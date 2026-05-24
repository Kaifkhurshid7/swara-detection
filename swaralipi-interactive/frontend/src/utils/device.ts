/**
 * Device Detection Utility
 *
 * Determines whether the user is on a mobile device to switch between
 * camera capture (mobile) and file upload (desktop) interfaces.
 */

export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;

  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  const hasTouch = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1;

  return mobilePattern.test(navigator.userAgent) || hasTouch;
}
