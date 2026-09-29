/**
 * Utility functions for device detection
 */

/**
 * Detects if the current device is a mobile device
 * Uses a combination of user agent detection and screen size
 */
export const isMobileDevice = (): boolean => {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileRegex.test(userAgent);

  // Check screen size (optional, but helpful for tablets)
  const isSmallScreen = window.innerWidth <= 768;

  // Consider it mobile if either condition is true
  return isMobileUserAgent || isSmallScreen;
};

/**
 * Detects if the device is specifically a tablet
 */
export const isTablet = (): boolean => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  return tabletRegex.test(userAgent);
};

/**
 * Detects if the device is a desktop/laptop
 */
export const isDesktop = (): boolean => {
  return !isMobileDevice();
};

/**
 * Checks if the Web Share API is available
 */
export const isShareAPIAvailable = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
};

/**
 * Checks if native share should be used
 * Returns true for mobile devices with Web Share API support
 */
export const shouldUseNativeShare = (): boolean => {
  return isMobileDevice() && isShareAPIAvailable();
};
