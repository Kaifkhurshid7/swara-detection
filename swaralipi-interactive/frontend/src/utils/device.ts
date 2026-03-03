/**
 * Detect mobile vs desktop for camera vs file-upload UI.
 */
export function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const mobileKeywords = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;
  return mobileKeywords.test(ua) || (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1;
}
