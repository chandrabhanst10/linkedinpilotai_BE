export const validateCallback = (code?: string, state?: string) => {
  return !!code && !!state;
};
