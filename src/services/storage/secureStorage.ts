import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const secureStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Keychain.setGenericPassword(ACCESS_TOKEN_KEY, accessToken, {
      service: ACCESS_TOKEN_KEY,
    });
    await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, refreshToken, {
      service: REFRESH_TOKEN_KEY,
    });
  },

  async getAccessToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: ACCESS_TOKEN_KEY,
    });
    return credentials ? credentials.password : null;
  },

  async getRefreshToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({
      service: REFRESH_TOKEN_KEY,
    });
    return credentials ? credentials.password : null;
  },

  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
  },
};

export const isSecureStorageAvailable = Platform.OS !== 'web';