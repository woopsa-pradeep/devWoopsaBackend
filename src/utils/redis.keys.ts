const queuePrefix = (process.env.QUEUE_NAME || "default").trim() || "default";

export const getProjectQueuePrefix = (): string => queuePrefix;

export const getDriverLocationKey = (driverId: number): string =>
  `${queuePrefix}:driver:location:${driverId}`;

export const getDriverLastSyncKey = (driverId: number): string =>
  `${queuePrefix}:driver:lastSync:${driverId}`;

export const getDriverLocationPattern = (): string =>
  `${queuePrefix}:driver:location:*`;
