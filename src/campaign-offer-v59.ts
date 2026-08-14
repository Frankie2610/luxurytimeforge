const CAMPAIGN_OFFER_KEY_V59 = 'tf:v59:campaign-offer';
const CAMPAIGN_OFFER_MAX_AGE_V59 = 24 * 60 * 60 * 1000;

export type CampaignOfferV59 = {code: string; capturedAt: number};

const normalizeCodeV59 = (value: unknown) => String(value || '')
  .trim()
  .toUpperCase()
  .replace(/[^A-Z0-9_-]/g, '')
  .slice(0, 40);

export function readCampaignOfferV59(): CampaignOfferV59 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CAMPAIGN_OFFER_KEY_V59);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CampaignOfferV59>;
    const code = normalizeCodeV59(value.code);
    if (!code || typeof value.capturedAt !== 'number' || Date.now() - value.capturedAt > CAMPAIGN_OFFER_MAX_AGE_V59) {
      window.sessionStorage.removeItem(CAMPAIGN_OFFER_KEY_V59);
      return null;
    }
    return {code, capturedAt: value.capturedAt};
  } catch {
    return null;
  }
}

export function captureCampaignOfferV59(search?: string): CampaignOfferV59 | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(search ?? window.location.search);
  const code = normalizeCodeV59(params.get('discount'));
  if (!code) return readCampaignOfferV59();
  const offer = {code, capturedAt: Date.now()};
  try {window.sessionStorage.setItem(CAMPAIGN_OFFER_KEY_V59, JSON.stringify(offer));} catch {/* The offer remains available from the current URL. */}
  return offer;
}

export function clearCampaignOfferV59() {
  if (typeof window === 'undefined') return;
  try {window.sessionStorage.removeItem(CAMPAIGN_OFFER_KEY_V59);} catch {/* Storefront remains usable when storage is blocked. */}
}

export function campaignDiscountCodeV59(search?: string) {
  if (typeof window === 'undefined') return '';
  const direct = normalizeCodeV59(new URLSearchParams(search ?? window.location.search).get('discount'));
  return direct || readCampaignOfferV59()?.code || '';
}
