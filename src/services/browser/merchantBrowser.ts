import { Linking } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { colors } from '@theme/colors';

/**
 * Opens merchant links in a custom tab (Android) or a Safari view controller
 * (iOS) rather than handing off to the browser app, which used to lose the
 * shopper's place in the app.
 *
 * The URL comes from scraped merchant data, so it is validated before it is
 * handed to a native browser: only http(s) with a real host is allowed, which
 * stops a malformed or `javascript:`/`intent:` record from being launched.
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export const parseMerchantUrl = (raw: string): URL | null => {
  try {
    const parsed = new URL(raw);
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol) || parsed.hostname.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export interface OpenMerchantPageResult {
  opened: boolean;
  /** True when the custom tab could not be used and the system browser was. */
  usedSystemBrowser: boolean;
}

const isUsableUrl = (url: string): boolean => parseMerchantUrl(url) !== null;

const openExternally = async (url: string): Promise<void> => {
  const supported = await Linking.canOpenURL(url).catch(() => false);
  if (!supported) {
    throw new Error(`No handler for ${url}`);
  }
  await Linking.openURL(url);
};

export const openMerchantPage = async (url: string): Promise<OpenMerchantPageResult> => {
  if (!isUsableUrl(url)) {
    return { opened: false, usedSystemBrowser: false };
  }

  try {
    await InAppBrowser.open(url, {
      // Android: keep the address bar available so a shopper can see they have
      // left the app before entering payment details.
      showTitle: true,
      enableUrlBarHiding: false,
      enableDefaultShare: true,
      toolbarColor: colors.textPrimary,
      secondaryToolbarColor: colors.textPrimary,
      navigationBarColor: colors.textPrimary,
      // iOS
      dismissButtonStyle: 'close',
      readerMode: false,
      animated: true,
      modalPresentationStyle: 'pageSheet',
      showInRecents: true,
    });
    return { opened: true, usedSystemBrowser: false };
  } catch {
    // No custom-tab host installed, or the native side refused. Degrade to the
    // system browser rather than failing the tap.
    try {
      await openExternally(url);
      return { opened: true, usedSystemBrowser: true };
    } catch {
      return { opened: false, usedSystemBrowser: false };
    }
  }
};
