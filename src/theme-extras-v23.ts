export type ThemeExtrasV23 = {
  showCountdown: boolean;
  countdownText: string;
  countdownScheme: 'light' | 'dark' | 'green' | 'red';
  cartDrawer: boolean;
  newsletterPopup: boolean;
  privacyBanner: boolean;
  footerVisible: boolean;
};

export const THEME_EXTRAS_KEY = 'tf.v19.editor-extras';
export const THEME_EXTRAS_EVENT = 'timeforge:theme-extras-updated';

export const defaultThemeExtrasV23: ThemeExtrasV23 = {
  showCountdown: false,
  countdownText: 'Giảm giá đến 50% · Miễn phí giao hàng',
  countdownScheme: 'red',
  cartDrawer: true,
  newsletterPopup: false,
  privacyBanner: false,
  footerVisible: true,
};

export function readThemeExtrasV23(): ThemeExtrasV23 {
  if (typeof window === 'undefined') return defaultThemeExtrasV23;
  try {
    return {...defaultThemeExtrasV23, ...JSON.parse(localStorage.getItem(THEME_EXTRAS_KEY) || '{}')};
  } catch {
    return defaultThemeExtrasV23;
  }
}

export function saveThemeExtrasV23(extras: ThemeExtrasV23) {
  localStorage.setItem(THEME_EXTRAS_KEY, JSON.stringify(extras));
  window.dispatchEvent(new CustomEvent(THEME_EXTRAS_EVENT, {detail: extras}));
}
