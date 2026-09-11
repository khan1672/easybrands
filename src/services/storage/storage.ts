import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'easybrands',
});

export const getItem = (key: string): string | null => {
  return storage.getString(key) ?? null;
};

export const setItem = (key: string, value: string): void => {
  storage.set(key, value);
};

export const removeItem = (key: string): void => {
  storage.remove(key);
};

export const getJSONItem = <T>(key: string): T | null => {
  const value = storage.getString(key);
  return value ? (JSON.parse(value) as T) : null;
};

export const setJSONItem = <T>(key: string, value: T): void => {
  storage.set(key, JSON.stringify(value));
};