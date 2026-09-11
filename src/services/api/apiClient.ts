import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { Platform } from 'react-native';
import { secureStorage } from '@services/storage/secureStorage';

const API_BASE_URL = __DEV__
  ? 'https://api.easybrands.dev'
  : 'https://api.easybrands.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await secureStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await secureStorage.clearTokens();
    }
    return Promise.reject(error);
  },
);

export const isNetworkError = (error: unknown): boolean => {
  return error instanceof AxiosError && error.code === 'ERR_NETWORK';
};

export const getPlatformHeader = (): string => {
  return `${Platform.OS}_${Platform.Version}`;
};