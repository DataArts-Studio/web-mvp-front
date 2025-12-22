export const toCamelCase = (str: string) =>
  str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

export const toSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const keysToCamelCase = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamelCase);

  return Object.keys(obj).reduce(
    (acc, key) => {
      const camelKey = toCamelCase(key);
      const value = obj[key];

      acc[camelKey] = value !== null && typeof value === 'object' ? keysToCamelCase(value) : value;
      return acc;
    },
    {} as Record<string, any>
  );
};

export const keysToSnakeCase = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnakeCase);

  return Object.keys(obj).reduce(
    (acc, key) => {
      const snakeKey = toCamelCase(key);
      const value = obj[key];

      acc[snakeKey] = value !== null && typeof value === 'object' ? keysToSnakeCase(value) : value;
      return acc;
    },
    {} as Record<string, any>
  );
}
