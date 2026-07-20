import type {Theme} from './types';
import type {ThemeExtrasV23} from './theme-extras-v23';

export const THEME_PREVIEW_KEY_V26 = 'tf.v26.theme-preview';
export const THEME_PREVIEW_EXTRAS_KEY_V26 = 'tf.v26.theme-preview-extras';
export const THEME_PREVIEW_UPDATED_V26 = 'timeforge:theme-preview-updated';

export function isThemePreviewV26() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('theme_preview') === '1';
}

export function readThemePreviewV26(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THEME_PREVIEW_KEY_V26);
    return raw ? JSON.parse(raw) as Theme : null;
  } catch {
    return null;
  }
}

export function writeThemePreviewV26(theme: Theme) {
  localStorage.setItem(THEME_PREVIEW_KEY_V26, JSON.stringify(theme));
  window.dispatchEvent(new CustomEvent(THEME_PREVIEW_UPDATED_V26, {detail: theme}));
}

export function readThemePreviewExtrasV26<T extends ThemeExtrasV23>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(THEME_PREVIEW_EXTRAS_KEY_V26);
    return raw ? {...fallback, ...JSON.parse(raw)} : fallback;
  } catch {
    return fallback;
  }
}

export function writeThemePreviewExtrasV26(extras: ThemeExtrasV23) {
  localStorage.setItem(THEME_PREVIEW_EXTRAS_KEY_V26, JSON.stringify(extras));
  window.dispatchEvent(new CustomEvent(THEME_PREVIEW_UPDATED_V26, {detail: extras}));
}
