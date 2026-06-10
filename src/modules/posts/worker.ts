import { Worker, Job } from 'bullmq';
import { getRedisConnection, isRedisReady } from '../../config/redis.js';
import { toObjectId } from '../../utils/objectId.js';
import { getErrorMessage } from '../../utils/errors.js';
import { asBullMqConnection } from '../../utils/redisConnection.js';
import { decrypt } from '../../utils/encryption.js';
import { publishToLinkedIn } from '../../services/playwrightService.js';
import { sendNotification } from '../../sockets/socketService.js';
import * as linkedinCore from '../linkedin/core/index.js';
import * as linkedinService from '../linkedin/service.js';
import * as postsCore from './core/index.js';
import * as accountsCore from '../accounts/core/index.js';
import * as notificationsCore from '../notifications/core/index.js';

const connection = getRedisConnection();
let postWorker: Worker | undefined;

try {
  if (!connection) {
    throw new Error('Redis connection unavailable');
  }


  const createAndSendNotification = async (userId: string, title: string, message: string, type: 'success' | 'error' | 'info' | 'warning'): Promise<void> => {
    try {
      const notification = await notificationsCore.createNotification({
        user: toObjectId(userId),
        title,
        message,
        type,
      });

      sendNotification(userId, notification);
    } catch (err: unknown) {
      console.error('Failed to create notification log:', getErrorMessage(err));
    }
  };

  const processPublishPost = async (postId: string): Promise<void> => {
    console.log(`[Worker] Processing post ${postId}`);

    const post = await postsCore.findPostById(postId);
    if (!post) {
      console.error(`[Worker] Post ${postId} not found in database.`);
      return;
    }

    if (post.status !== 'scheduled' && post.status !== 'failed') {
      console.warn(`[Worker] Post ${postId} is in status "${post.status}", skipping.`);
      return;
    }

    // Transition to publishing state
    post.status = 'publishing';
    await post.save();

    // Trigger socket update
    sendNotification(String(post.user), {
      title: 'Publishing started',
      message: `Your post is currently being published to LinkedIn.`,
      type: 'info',
      isRead: false,
      createdAt: new Date(),
    });

    // If platform is LinkedIn and a real connection exists, use REST API
    if (post.platform === 'linkedin') {
      const conn = await linkedinCore.getLinkedInConnectionByUserId(String(post.user));
      if (conn) {
        try {
          const decryptedToken = decrypt(conn.accessToken);
          const result = await linkedinService.createPost({
            accessToken: decryptedToken,
            linkedinMemberId: conn.linkedinId,
            text: post.content,
          });

          post.status = 'posted';
          post.publishedAt = new Date();
          post.linkedinPostUrn = result.urn;
          post.error = '';
          await post.save();

          await createAndSendNotification(
            String(post.user),
            'Post Published! 🎉',
            `Your post was successfully published to LinkedIn.`,
            'success'
          );
          return;
        } catch (error: unknown) {
          const message = getErrorMessage(error, 'REST API publication failed');
          console.error('[Worker] LinkedIn REST API publication failed:', error);
          post.status = 'failed';
          post.error = message;
          await post.save();

          await createAndSendNotification(
            String(post.user),
            'Post Publishing Failed ⚠️',
            `Failed to publish to LinkedIn: ${message}`,
            'error'
          );
          return;
        }
      }
    }

    // Retrieve first connected account details (support single-post/multi-account)
    const accountId = String(post.linkedinAccounts[0]);
    const account = await accountsCore.findLinkedInAccountById(accountId);

    if (!account) {
      const errMsg = 'LinkedIn account configuration not found.';
      post.status = 'failed';
      post.error = errMsg;
      await post.save();

      await createAndSendNotification(String(post.user), 'Publishing Failed', errMsg, 'error');
      return;
    }

    const decryptedToken = decrypt(account.accessToken);

    // Execute automation
    const result = await publishToLinkedIn(post.content, post.media, decryptedToken, String(post._id));

    if (result.success) {
      post.status = 'published';
      post.publishedAt = new Date();
      post.linkedinPostUrn = result.urn;
      post.error = '';
      await post.save();

      await createAndSendNotification(
        String(post.user),
        'Post Published! 🎉',
        `Your post was successfully published to ${account.name}'s profile.`,
        'success'
      );
    } else {
      post.status = 'failed';
      post.error = result.error || 'Unknown automation failure';
      post.screenshotUrl = result.screenshotPath || '';
      await post.save();

      await createAndSendNotification(
        String(post.user),
        'Post Publishing Failed ⚠️',
        `Failed to publish to ${account.name}: ${result.error}`,
        'error'
      );
    }
  };

  postWorker = new Worker(
    'postQueue',
    async (job: Job) => {
      const { postId } = job.data;
      await processPublishPost(postId);
    },
    {
      connection: asBullMqConnection(connection),
      concurrency: 1, // process 1 post at a time to mimic human interactions and avoid rate limits
    }
  );

  postWorker.on('completed', (job: Job) => {
    console.log(`[Worker] Job ${job.id} completed successfully.`);
  });

  postWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  postWorker.on('error', (err: Error) => {
    // Suppress repetitive connection error stack traces
  });

  // Fallback in-memory scheduler if Redis/BullMQ connection is not ready
  let fallbackSchedulerInterval: NodeJS.Timeout | undefined;
  const startFallbackScheduler = () => {
    if (fallbackSchedulerInterval) return;
    console.log('[Fallback Scheduler] Starting in-memory check interval (polls every 5s for pending posts)...');
    fallbackSchedulerInterval = setInterval(async () => {
      try {
        const overduePosts = await postsCore.findOverduePosts(new Date());

        for (const post of overduePosts) {
          console.log(`[Fallback Scheduler] Processing overdue post ${post._id}`);
          await processPublishPost(String(post._id));
        }
      } catch (err: unknown) {
        console.error('[Fallback Scheduler] Error in polling check:', getErrorMessage(err));
      }
    }, 5000);
  };

  setTimeout(() => {
    if (!isRedisReady()) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[FATAL] Redis is required in production but is not available. Shutting down.');
        process.exit(1);
      }
      startFallbackScheduler();
    }
  }, 5000);
} catch {
  console.warn('Could not initialize BullMQ worker — fallback scheduler will be used if Redis is unavailable.');
}

export { postWorker };
