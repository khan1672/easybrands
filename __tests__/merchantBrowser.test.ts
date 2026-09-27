/**
 * @format
 */

import { Linking } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { openMerchantPage, parseMerchantUrl } from '../src/services/browser/merchantBrowser';

jest.mock('react-native-inappbrowser-reborn', () => ({
  InAppBrowser: { open: jest.fn(), close: jest.fn(), isAvailable: jest.fn() },
}));

const openMock = InAppBrowser.open as jest.Mock;
const canOpenMock = jest.spyOn(Linking, 'canOpenURL');
const openUrlMock = jest.spyOn(Linking, 'openURL');

const MERCHANT_URL = 'https://gulahmedshop.com/products/dyed-cotton-spandex-jersey-ladies-tights';

describe('openMerchantPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openMock.mockResolvedValue({ type: 'dismiss' });
    canOpenMock.mockResolvedValue(true);
    openUrlMock.mockResolvedValue(true as never);
  });

  it('opens merchant links in the custom tab, not the browser app', async () => {
    const result = await openMerchantPage(MERCHANT_URL);

    expect(openMock).toHaveBeenCalledWith(MERCHANT_URL, expect.objectContaining({ showTitle: true }));
    expect(result).toEqual({ opened: true, usedSystemBrowser: false });
    // The whole point: no hand-off to the separate browser.
    expect(openUrlMock).not.toHaveBeenCalled();
  });

  it('keeps the address bar available so the shopper can see they left the app', async () => {
    await openMerchantPage(MERCHANT_URL);
    expect(openMock).toHaveBeenCalledWith(
      MERCHANT_URL,
      expect.objectContaining({ enableUrlBarHiding: false }),
    );
  });

  it('falls back to the system browser when no custom tab is available', async () => {
    openMock.mockRejectedValue(new Error('no custom tab host'));

    const result = await openMerchantPage(MERCHANT_URL);

    expect(openUrlMock).toHaveBeenCalledWith(MERCHANT_URL);
    expect(result).toEqual({ opened: true, usedSystemBrowser: true });
  });

  it('reports failure when neither route works', async () => {
    openMock.mockRejectedValue(new Error('no custom tab host'));
    canOpenMock.mockResolvedValue(false);

    await expect(openMerchantPage(MERCHANT_URL)).resolves.toEqual({
      opened: false,
      usedSystemBrowser: false,
    });
    expect(openUrlMock).not.toHaveBeenCalled();
  });

  it('reports failure when the system browser cannot handle the url either', async () => {
    openMock.mockRejectedValue(new Error('no custom tab host'));
    canOpenMock.mockResolvedValue(false);

    await expect(openMerchantPage('https://example.com')).resolves.toEqual({
      opened: false,
      usedSystemBrowser: false,
    });
  });

  // Scraped merchant data is untrusted input to a native browser.
  it.each([
    // eslint-disable-next-line no-script-url -- deliberate hostile input under test
    ['javascript:alert(1)'],
    ['intent://scan#Intent;scheme=zxing;end'],
    ['file:///etc/passwd'],
    ['not a url'],
    [''],
  ])('refuses to launch an unsafe url: %s', async url => {
    await expect(openMerchantPage(url)).resolves.toEqual({
      opened: false,
      usedSystemBrowser: false,
    });
    expect(openMock).not.toHaveBeenCalled();
    expect(openUrlMock).not.toHaveBeenCalled();
  });

  it('accepts a plain http merchant url', async () => {
    await expect(openMerchantPage('http://example.com/item')).resolves.toEqual({
      opened: true,
      usedSystemBrowser: false,
    });
  });
});

describe('parseMerchantUrl', () => {
  it('accepts http and https with a host', () => {
    expect(parseMerchantUrl('https://shop.pk/p')?.hostname).toBe('shop.pk');
    expect(parseMerchantUrl('http://shop.pk')?.protocol).toBe('http:');
  });

  it('rejects other schemes and malformed input', () => {
    expect(parseMerchantUrl('mailto:a@b.com')).toBeNull();
    expect(parseMerchantUrl('https://')).toBeNull();
    expect(parseMerchantUrl('nope')).toBeNull();
  });
});
