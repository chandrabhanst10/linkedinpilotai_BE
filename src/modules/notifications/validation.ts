export const validateNotificationId = (id: string) => {
  return typeof id === 'string' && id.length > 0;
};
