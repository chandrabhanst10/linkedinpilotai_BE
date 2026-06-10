import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let sharedConnection: Redis | undefined;
let connectionWarned = false;

export const getRedisConnection = (): Redis | undefined => {
  if (sharedConnection) {
    return sharedConnection;
  }

  try {
    sharedConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        if (times > 3) {
          return 30000;
        }
        return Math.min(times * 1000, 3000);
      },
    });

    sharedConnection.on('error', (err: { code?: string; message?: string }) => {
      if (!connectionWarned) {
        console.warn('[Redis] Connection unavailable — BullMQ will use simulation/fallback mode:');
        console.warn(`  Code: ${err.code || 'ECONNREFUSED'}`);
        console.warn(`  Message: ${err.message ? err.message.split('\n')[0] : 'Connection refused'}`);
        if (process.env.NODE_ENV !== 'production') {
          console.warn('  Tip: run `docker compose up -d redis` for production-like job scheduling.');
        }
        connectionWarned = true;
      }
    });

    return sharedConnection;
  } catch {
    console.warn('[Redis] Could not initialize connection. BullMQ disabled.');
    return undefined;
  }
};

export const isRedisReady = (): boolean => {
  const connection = getRedisConnection();
  return Boolean(connection && connection.status === 'ready');
};
