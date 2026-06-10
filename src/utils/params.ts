export const getParam = (params: Record<string, string | string[] | undefined>, key: string): string => {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
};

export const getQueryParam = (query: Record<string, unknown>, key: string): string => {
  const value = query[key];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return '';
};
