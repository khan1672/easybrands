const isDev = () => {
  return typeof __DEV__ !== 'undefined' && __DEV__;
};

export const track = (
  eventName: string,
  properties?: Record<string, string | number | boolean | undefined>,
): void => {
  if (isDev()) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${eventName}`, properties ?? {});
  }
};