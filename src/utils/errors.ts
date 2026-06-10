export const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
};

export const toError = (error: unknown, fallback = 'An unexpected error occurred'): Error =>
  error instanceof Error ? error : new Error(getErrorMessage(error, fallback));
