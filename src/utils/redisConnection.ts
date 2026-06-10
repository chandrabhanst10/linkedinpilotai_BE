import type { ConnectionOptions } from 'bullmq';
import type { Redis } from 'ioredis';

/**
 * BullMQ's ConnectionOptions and ioredis Redis types diverge across package versions.
 * At runtime an ioredis instance is a valid BullMQ connection.
 */
export const asBullMqConnection = (redis: Redis): ConnectionOptions => redis as ConnectionOptions;
