import { Queue } from 'bullmq';
import { getRedisConnection, isRedisReady } from '../../config/redis.js';
import { asBullMqConnection } from '../../utils/redisConnection.js';
import { getErrorMessage } from '../../utils/errors.js';
import { IScheduledPostDocument } from '../../types/types.js';

const connection = getRedisConnection();
let postQueue: Queue | undefined;

try {
  if (connection) {
    postQueue = new Queue('postQueue', {
      connection: asBullMqConnection(connection),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    postQueue.on('error', () => {
      // Suppress repetitive connection error stack traces
    });
  }
} catch {
  console.warn('Could not initialize BullMQ queue.');
}

export const addPostJob = async (post: IScheduledPostDocument): Promise<void> => {
  if (!postQueue || !isRedisReady()) {
    console.log(`[BullMQ Simulation] Scheduled post ${post._id} for ${post.scheduledTime}`);
    return;
  }

  try {
    const delay = new Date(post.scheduledTime).getTime() - Date.now();
    const cleanDelay = Math.max(0, delay);

    // Remove old job if it exists to avoid duplicates
    await postQueue.remove(String(post._id));

    await postQueue.add(
      'publishPost',
      { postId: post._id },
      {
        jobId: String(post._id),
        delay: cleanDelay,
      }
    );

    console.log(`[BullMQ] Enqueued post ${post._id} with delay of ${cleanDelay}ms`);
  } catch (error: unknown) {
    console.error('Failed to add BullMQ job, running simulation mode:', getErrorMessage(error));
  }
};

export const removePostJob = async (postId: string): Promise<void> => {
  if (!postQueue || !isRedisReady()) {
    return;
  }

  try {
    await postQueue.remove(postId.toString());
    console.log(`[BullMQ] Cancelled scheduled job for post ${postId}`);
  } catch (error: unknown) {
    console.error('Failed to remove BullMQ job:', getErrorMessage(error));
  }
};

export { postQueue };
