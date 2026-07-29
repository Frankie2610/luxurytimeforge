import {useEffect, useLayoutEffect, useRef, useState, type ImgHTMLAttributes} from 'react';

const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f3f1eb"/><circle cx="300" cy="300" r="118" fill="none" stroke="#c9c4b9" stroke-width="18"/><rect x="265" y="82" width="70" height="116" rx="24" fill="#ded9cf"/><rect x="265" y="402" width="70" height="116" rx="24" fill="#ded9cf"/><circle cx="300" cy="300" r="78" fill="#faf9f5" stroke="#8e8a82" stroke-width="8"/><path d="M300 300V248M300 300l42 24" stroke="#4f514d" stroke-width="10" stroke-linecap="round"/><text x="300" y="560" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#555954">TIMEFORGE</text></svg>`)}`;

const proximityCallbacks = new WeakMap<Element, () => void>();
let proximityObserver: IntersectionObserver | null = null;
const observeNearViewport = (element: Element, callback: () => void) => {
  if (typeof IntersectionObserver === 'undefined') {
    callback();
    return () => {};
  }
  proximityObserver ||= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const onNear = proximityCallbacks.get(entry.target);
      proximityCallbacks.delete(entry.target);
      proximityObserver?.unobserve(entry.target);
      onNear?.();
    });
  }, {rootMargin: '800px 0px'});
  proximityCallbacks.set(element, callback);
  proximityObserver.observe(element);
  return () => {
    proximityCallbacks.delete(element);
    proximityObserver?.unobserve(element);
  };
};

export function productImage(product: {images?: string[]; rawShopify?: Record<string, string>; sku?: string}, index = 0) {
  const images = (product.images || []).map((item) => String(item || '').trim()).filter(Boolean);
  const raw = product.rawShopify || {};
  const rawCandidates = [raw['Image Src'], raw['Variant Image'], raw['Image URL'], raw.image, raw.secure_url]
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return images[index] || images[0] || rawCandidates[index] || rawCandidates[0] || DEFAULT_PRODUCT_IMAGE;
}

export function optimizedImage(url: string, width = 900, height?: number, crop: 'fill' | 'fit' | 'limit' = 'fill') {
  const source = String(url || '').trim();
  if (!source || source.startsWith('data:') || source.startsWith('blob:')) return source;
  // Cloudinary originals can be several megabytes. Insert a deterministic,
  // cacheable transformation while leaving every non-Cloudinary URL untouched.
  const marker = '/image/upload/';
  if (/^https?:\/\/res\.cloudinary\.com\//i.test(source) && source.includes(marker)) {
    const [prefix, suffix] = source.split(marker, 2);
    const safeWidth = Math.max(80, Math.min(2400, Math.round(width || 900)));
    const safeHeight = height ? Math.max(80, Math.min(2400, Math.round(height))) : 0;
    const resize = [`c_${crop}`, `w_${safeWidth}`, safeHeight ? `h_${safeHeight}` : '', crop === 'fill' ? 'g_auto' : ''].filter(Boolean).join(',');
    return `${prefix}${marker}f_auto,q_auto:eco,dpr_auto,${resize}/${suffix}`;
  }
  return source;
}

export function SmartImage({src = '', alt = '', className = '', width, height, priority = false, ...props}: ImgHTMLAttributes<HTMLImageElement> & {priority?: boolean}) {
  const normalizedSource = String(src || '').trim() || DEFAULT_PRODUCT_IMAGE;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nearViewport, setNearViewport] = useState(priority);
  const [displayedSource, setDisplayedSource] = useState(normalizedSource);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previousSourceRef = useRef(normalizedSource);
  const numericWidth = typeof width === 'number' ? width : 1000;
  const numericHeight = typeof height === 'number' ? height : undefined;
  const finalSource = optimizedImage(displayedSource, numericWidth, numericHeight, numericHeight ? 'fit' : 'limit');

  // Chỉ reset khi URL thật sự thay đổi. Không reset sau onLoad của ảnh cache,
  // tránh skeleton bị treo vĩnh viễn trên Chrome/Safari.
  useLayoutEffect(() => {
    if (previousSourceRef.current === normalizedSource) return;
    previousSourceRef.current = normalizedSource;
    setLoaded(false);
    setFailed(false);
    setDisplayedSource(normalizedSource);
  }, [normalizedSource]);

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, [finalSource]);

  // Chỉ theo dõi lỗi ảnh khi ảnh sắp xuất hiện. Catalog 50 sản phẩm không còn
  // tạo đồng thời hàng chục timeout cho các card còn ở rất xa viewport.
  useEffect(() => {
    if (priority) {
      setNearViewport(true);
      return;
    }
    const image = imageRef.current;
    if (!image) {
      setNearViewport(true);
      return;
    }
    return observeNearViewport(image, () => setNearViewport(true));
  }, [priority]);

  // URL từ CSV có thể chết hoặc server chặn hotlink. Sau một khoảng ngắn,
  // chuyển sang ảnh dự phòng thay vì để shimmer chạy vô hạn.
  useEffect(() => {
    if (loaded || !nearViewport) return;
    const timer = window.setTimeout(() => {
      const image = imageRef.current;
      if (image?.complete && image.naturalWidth > 0) {
        setLoaded(true);
        return;
      }
      if (displayedSource !== DEFAULT_PRODUCT_IMAGE) {
        setFailed(true);
        setDisplayedSource(DEFAULT_PRODUCT_IMAGE);
      } else {
        setLoaded(true);
      }
    }, priority ? 6000 : 9000);
    return () => window.clearTimeout(timer);
  }, [displayedSource, loaded, nearViewport, priority]);

  return <span className={`tf-smart-image ${loaded ? 'is-loaded' : ''} ${failed ? 'is-fallback' : ''} ${className}`} aria-busy={!loaded}>
    {!loaded && <span className="tf-image-skeleton" aria-hidden="true" />}
    <img
      {...props}
      key={finalSource}
      ref={imageRef}
      src={finalSource}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : (props.loading || 'lazy')}
      fetchPriority={priority ? 'high' : props.fetchPriority}
      decoding="async"
      referrerPolicy={props.referrerPolicy || 'no-referrer'}
      onLoad={(event) => {
        setLoaded(true);
        props.onLoad?.(event);
      }}
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
