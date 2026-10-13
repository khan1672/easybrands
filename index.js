/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';

/**
 * Silence the console in release builds so nothing is written to the device log
 * (Xcode / Logcat / Metro) or leaked through an attached debugger. Debug builds
 * are untouched.
 *
 * This is the belt-and-braces backstop: app code (e.g. the API logger) also
 * gates its own output behind `__DEV__`, but this guarantees no stray `console.*`
 * from any dependency ever reaches a production device.
 */
if (!__DEV__) {
  const noop = () => {};
  for (const method of [
    'log',
    'info',
    'warn',
    'error',
    'debug',
    'trace',
    'group',
    'groupCollapsed',
    'groupEnd',
    'table',
    'dir',
    'assert',
  ]) {
    // eslint-disable-next-line no-console -- intentionally muting console in release.
    console[method] = noop;
  }
}

AppRegistry.registerComponent(appName, () => App);
