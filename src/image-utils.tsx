import {useEffect, useState, type ImgHTMLAttributes} from 'react';


const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f3f1eb"/><circle cx="300" cy="300" r="118" fill="none" stroke="#c9c4b9" stroke-width="18"/><rect x="265" y="82" width="70" height="116" rx="24" fill="#ded9cf"/><rect x="265" y="402" width="70" height="116" rx="24" fill="#ded9cf"/><circle cx="300" cy="300" r="78" fill="#faf9f5" stroke="#8e8a82" stroke-width="8"/><path d="M300 300V248M300 300l42 24" stroke="#4f514d" stroke-width="10" stroke-linecap="round"/><text x="300" y="560" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#555954">TIMEFORGE</text></svg>`)}`;

export function productImage(product: {images?: string[]; rawShopify?: Record<string, string>; sku?: string}, index = 0) {
  const images = (product.images || []).map((item) => String(item || '').trim()).filter(Boolean);
  const raw = product.rawShopify || {};
  const rawCandidates = [raw['Image Src'], raw['Variant Image'], raw['Image URL'], raw.image, raw.secure_url]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return images[index] || images[0] || rawCandidates[index] || rawCandidates[0] || DEFAULT_PRODUCT_IMAGE;
}

export function optimizedImage(url: string, width = 900, height?: number, crop: 'fill' | 'fit' | 'limit' = 'fill') {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const dimensions = [`w_${Math.max(80, Math.round(width))}`, height ? `h_${Math.max(80, Math.round(height))}` : '', `c_${crop}`].filter(Boolean).join(',');
  return url.replace('/upload/', `/upload/f_auto,q_auto:good,dpr_auto,${dimensions}/`);
}

export function SmartImage({src = '', alt = '', className = '', width, height, priority = false, ...props}: ImgHTMLAttributes<HTMLImageElement> & {priority?: boolean}) {
  const normalizedSource = String(src || '').trim() || DEFAULT_PRODUCT_IMAGE;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [displayedSource, setDisplayedSource] = useState(normalizedSource);
  const numericWidth = typeof width === 'number' ? width : 1000;
  const numericHeight = typeof height === 'number' ? height : undefined;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setDisplayedSource(normalizedSource);
  }, [normalizedSource]);

  return <span className={`tf-smart-image ${loaded ? 'is-loaded' : ''} ${failed ? 'is-fallback' : ''} ${className}`}>
    <span className="tf-image-skeleton" aria-hidden="true" />
    <img
      {...props}
      src={optimizedImage(displayedSource, numericWidth, numericHeight, numericHeight ? 'fill' : 'limit')}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : (props.loading || 'lazy')}
      fetchPriority={priority ? 'high' : props.fetchPriority}
      decoding="async"
      onLoad={(event) => {setLoaded(true); props.onLoad?.(event);}}
      onError={(event) => {
        if (displayedSource !== DEFAULT_PRODUCT_IMAGE) {
          setFailed(true);
          setLoaded(false);
          setDisplayedSource(DEFAULT_PRODUCT_IMAGE);
          return;
        }
        setLoaded(true);
        props.onError?.(event);
      }}
    />
  </span>;
}
