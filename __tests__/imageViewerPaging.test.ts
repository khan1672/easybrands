/**
 * @format
 */

import { stepPage } from '../src/features/products/components/ImageViewer';

const LENGTH = 5;
const SWIPE_LEFT = -220;
const SWIPE_RIGHT = 220;

/**
 * Going back has to move to the previous photo, which is the direction that
 * regressed: the gesture was deciding from a stale page, so a backwards swipe
 * recomputed the photo already on screen while the counter moved on.
 */
describe('stepPage', () => {
  it('steps to the next photo when swiping left', () => {
    expect(stepPage(0, SWIPE_LEFT, LENGTH)).toBe(1);
    expect(stepPage(2, SWIPE_LEFT, LENGTH)).toBe(3);
  });

  it('steps to the previous photo when swiping right', () => {
    expect(stepPage(1, SWIPE_RIGHT, LENGTH)).toBe(0);
    expect(stepPage(3, SWIPE_RIGHT, LENGTH)).toBe(2);
    expect(stepPage(4, SWIPE_RIGHT, LENGTH)).toBe(3);
  });

  it('is symmetric around the current page', () => {
    for (let page = 0; page < LENGTH; page++) {
      const forward = stepPage(page, SWIPE_LEFT, LENGTH);
      const back = stepPage(page, SWIPE_RIGHT, LENGTH);
      expect(forward).toBe(Math.min(page + 1, LENGTH - 1));
      expect(back).toBe(Math.max(page - 1, 0));
    }
  });

  it('stops at the ends instead of wrapping around', () => {
    expect(stepPage(0, SWIPE_RIGHT, LENGTH)).toBe(0);
    expect(stepPage(LENGTH - 1, SWIPE_LEFT, LENGTH)).toBe(LENGTH - 1);
  });

  // A short flick is a mistap, not a page change.
  it('stays put for a drag shorter than a deliberate swipe', () => {
    expect(stepPage(2, -12, LENGTH)).toBe(2);
    expect(stepPage(2, 12, LENGTH)).toBe(2);
    expect(stepPage(2, 0, LENGTH)).toBe(2);
  });

  it('handles a single-image gallery', () => {
    expect(stepPage(0, SWIPE_LEFT, 1)).toBe(0);
    expect(stepPage(0, SWIPE_RIGHT, 1)).toBe(0);
  });
});
