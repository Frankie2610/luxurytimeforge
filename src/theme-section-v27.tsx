import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import {ArrowRight, Clock3, Quote, ShieldCheck, Truck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useProductCatalog,useStoreReviews} from './context';
import {NewsletterSignupV65} from './newsletter-signup-v65';
import {optimizedImage} from './image-utils';
import {sectionLabels, blockLabels} from './theme';
import type {Section, ThemeBlock} from './types';

const flatten = (blocks: ThemeBlock[] = []): ThemeBlock[] => blocks.flatMap(block => block.type === 'group' ? (block.visible ? flatten(block.children || []) : []) : block.visible ? [block] : []);
const first = (section: Section, type: ThemeBlock['type']) => flatten(section.blocks).find(block => block.type === type);
const all = (section: Section, type: ThemeBlock['type']) => flatten(section.blocks).filter(block => block.type === type);
const sectionProps = (section: Section) => ({'data-theme-section-id': section.id, 'data-theme-section-label': sectionLabels[section.type]});
const blockProps = (block?: ThemeBlock) => block ? {'data-theme-block-id': block.id, 'data-theme-block-label': blockLabels[block.type]} : {};
const iconFor = (icon: string) => icon === 'truck' ? <Truck/> : icon === 'clock' ? <Clock3/> : icon === 'quote' ? <Quote/> : <ShieldCheck/>;
const isDark = (section: Section) => section.settings.background === 'dark' || section.settings.colorScheme === 'dark';

function Countdown({endDate}: {endDate: string}) {
  const getRemaining = () => Math.max(0, new Date(endDate).getTime() - Date.now());
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(getRemaining()), 1000);
    return () => window.clearInterval(timer);
  }, [endDate]);
  const units = useMemo(() => {
    const total = Math.floor(remaining / 1000);
    return [
      {label: 'Ngày', value: Math.floor(total / 86400)},
      {label: 'Giờ', value: Math.floor((total % 86400) / 3600)},
      {label: 'Phút', value: Math.floor((total % 3600) / 60)},
      {label: 'Giây', value: total % 60},
    ];
  }, [remaining]);
  return <div className="v27-countdown-clock">{units.map(unit => <span key={unit.label}><b>{String(unit.value).padStart(2, '0')}</b><small>{unit.label}</small></span>)}</div>;
}

export function ThemeSectionV27({section}: {section: Section}) {
  const {products}=useProductCatalog();
  const reviews=useStoreReviews();
  if (!section.visible) return null;
  const heading = first(section, 'heading');
  const text = first(section, 'text');
  const action = first(section, 'button');
  const dark = isDark(section);
  const surfaceClass = dark ? 'tf-dark-section' : section.settings.background === 'light' ? 'tf-light-section' : '';

  if (section.type === 'imageText') {
    return <section {...sectionProps(section)} className={`tf-editorial-v39 image-${String(section.settings.imagePosition || 'left')} ${surfaceClass}`}>
      <div className="tf-editorial-media-v39"><img src={optimizedImage(String(section.settings.image || products[0]?.images[0] || ''), 1200, 1500)} alt="TimeForge editorial" loading="lazy" decoding="async"/><span>EST. 2026</span></div>
      <div className="tf-editorial-content-v39"><small {...blockProps(heading)}>{String(heading?.settings.eyebrow || 'THE TIMEFORGE STANDARD')}</small><h2 {...blockProps(heading)}>{String(heading?.settings.text || 'Chọn đúng chiếc đồng hồ phù hợp')}</h2><p {...blockProps(text)}>{String(text?.settings.text || '')}</p>{action && <Link {...blockProps(action)} to={String(action.settings.link || '/pages/about')}>{String(action.settings.label || 'Tìm hiểu thêm')}<ArrowRight/></Link>}<div className="tf-editorial-facts-v39"><span><b>100%</b>Thông tin rõ ràng</span><span><b>1–4 ngày</b>Giao hàng dự kiến</span><span><b>Dài lâu</b>Hỗ trợ hậu mãi</span></div></div>
    </section>;
  }
  if (section.type === 'richText') {
    return <section {...sectionProps(section)} className={`lux-section v26-rich-text v27-rich-text align-${String(section.settings.alignment || 'center')} width-${String(section.settings.width || 'narrow')} ${surfaceClass}`}><small {...blockProps(heading)}>{String(heading?.settings.eyebrow || 'TIMEFORGE')}</small><h2 {...blockProps(heading)}>{String(heading?.settings.text || 'Một tiêu đề giàu cảm hứng')}</h2><p {...blockProps(text)}>{String(text?.settings.text || '')}</p>{action && <Link {...blockProps(action)} to={String(action.settings.link || '/collections')}>{String(action.settings.label || 'Xem thêm')}<ArrowRight/></Link>}</section>;
  }
  if (section.type === 'newsletter') {
    return <section {...sectionProps(section)} className={`tf4933-newsletter ${dark ? 'dark tf-dark-section' : ''}`}><div><small {...blockProps(heading)}>{String(heading?.settings.eyebrow || 'TIMEFORGE JOURNAL')}</small><h2 {...blockProps(heading)}>{String(heading?.settings.text || 'Nhận tin tuyển chọn mới')}</h2><p {...blockProps(text)}>{String(text?.settings.text || '')}</p></div><NewsletterSignupV65 source="homepage" className="tf4933-newsletter-signup" actionLabel={String(action?.settings.label || 'Đăng ký')} buttonProps={blockProps(action)}/></section>;
  }
  if (section.type === 'multicolumn') {
    const items = all(section, 'iconText');
    return <section {...sectionProps(section)} className={`lux-section v26-multicolumn v27-multicolumn ${surfaceClass}`}><div className="lux-section-heading"><div><small>{String(section.settings.eyebrow || 'DỊCH VỤ TIMEFORGE')}</small><h2>{String(section.settings.title || 'Trải nghiệm được chăm chút')}</h2></div></div><div style={{'--v26-columns': Number(section.settings.columns || 3)} as CSSProperties}>{items.map(item => <article key={item.id} {...blockProps(item)}>{iconFor(String(item.settings.icon || 'shield'))}<span><b>{String(item.settings.title || 'Nội dung')}</b><p>{String(item.settings.text || '')}</p></span></article>)}</div></section>;
  }
  if (section.type === 'video') {
    const videoUrl = String(section.settings.videoUrl || '');
    return <section {...sectionProps(section)} className={`v26-video-section v27-video-section ${dark ? 'tf-dark-section' : ''}`} style={{minHeight: Number(section.settings.height || 560)}}>{videoUrl ? <video src={videoUrl} poster={String(section.settings.poster || '')} controls muted playsInline/> : <img src={optimizedImage(String(section.settings.poster || ''), 1800, 1000)} alt="TimeForge video"/>}<div className={`align-${String(section.settings.alignment || 'left')}`}><small {...blockProps(heading)}>{String(heading?.settings.eyebrow || 'TIME IN MOTION')}</small><h2 {...blockProps(heading)}>{String(heading?.settings.text || 'Chuyển động của thời gian')}</h2><p {...blockProps(text)}>{String(text?.settings.text || '')}</p>{action && <Link {...blockProps(action)} to={String(action.settings.link || '/collections')}>{String(action.settings.label || 'Khám phá')}<ArrowRight/></Link>}</div></section>;
  }
  if (section.type === 'testimonials') {
    const fallbackItems = all(section, 'iconText');
    const managedReviews = reviews.filter(item => item.status === 'published' && item.reviewType !== 'product').sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder||new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0, Math.min(12, Math.max(3, Number(section.settings.limit || 6))));
    return <section {...sectionProps(section)} className={`lux-section v27-testimonials tf60-testimonials ${surfaceClass}`}><div className="lux-section-heading"><div><small>{String(section.settings.eyebrow || 'CLIENT STORIES')}</small><h2>{String(section.settings.title || 'Trải nghiệm từ khách hàng')}</h2><p>Những chia sẻ thật từ khách hàng đã mua sắm và được TimeForge hỗ trợ.</p></div>{managedReviews.length>0&&<span className="tf60-review-proof"><b>{managedReviews.length}</b> review được chọn</span>}</div>{managedReviews.length?<div className="tf60-testimonial-grid">{managedReviews.map((item,index)=><article key={item.id} className={item.image?'has-image':''}>{item.image&&<figure><img src={optimizedImage(item.image,900,700)} alt={`Review của ${item.customerName}`} loading="lazy" decoding="async"/></figure>}<div className="tf60-testimonial-copy"><div className="tf60-testimonial-rating" aria-label={`${item.rating}/5 sao`}>{Array.from({length:5},(_,star)=><span key={star} className={star<item.rating?'is-on':''}>★</span>)}</div>{item.title&&<h3>{item.title}</h3>}{item.text&&<p>“{item.text}”</p>}<footer><span>{String(index+1).padStart(2,'0')}</span><div><b>{item.customerName}</b><small>{item.source||'Khách hàng TimeForge'}</small></div></footer></div></article>)}</div>:<div className="v27-testimonial-grid" style={{'--v27-columns': Number(section.settings.columns || 3)} as CSSProperties}>{fallbackItems.map((item, index) => <blockquote key={item.id} {...blockProps(item)}><Quote/><p>“{String(item.settings.text || '')}”</p><footer><span>{String(index + 1).padStart(2, '0')}</span><b>{String(item.settings.title || 'Khách hàng TimeForge')}</b></footer></blockquote>)}</div>}</section>;
  }
  if (section.type === 'faq') {
    const items = all(section, 'accordion');
    return <section {...sectionProps(section)} className={`lux-section v27-faq ${surfaceClass}`}><div className="v27-faq-intro"><small>{String(section.settings.eyebrow || 'NEED TO KNOW')}</small><h2>{String(section.settings.title || 'Câu hỏi thường gặp')}</h2><p>Thông tin ngắn gọn để khách hàng dễ dàng đưa ra lựa chọn.</p></div><div className="v27-faq-list">{items.map(item => <details key={item.id} {...blockProps(item)} open={Boolean(item.settings.open)}><summary>{String(item.settings.title || 'Câu hỏi')}<span>+</span></summary><p>{String(item.settings.text || item.settings.source || '')}</p></details>)}</div></section>;
  }
  if (section.type === 'logoList') {
    const items = all(section, 'iconText');
    return <section {...sectionProps(section)} className={`lux-section v27-logo-list ${surfaceClass}`}><div className="lux-section-heading"><div><small>{String(section.settings.eyebrow || 'SELECTED MAISONS')}</small><h2>{String(section.settings.title || 'Thương hiệu được tuyển chọn')}</h2></div></div><div style={{'--v27-columns': Number(section.settings.columns || 5)} as CSSProperties}>{items.map(item => <span key={item.id} {...blockProps(item)}>{String(item.settings.title || 'TIMEFORGE')}</span>)}</div></section>;
  }
  if (section.type === 'gallery') {
    const items = all(section, 'image');
    return <section {...sectionProps(section)} className={`lux-section v27-gallery ${surfaceClass}`}><div className="lux-section-heading"><div><small>{String(section.settings.eyebrow || 'TIMEFORGE EDIT')}</small><h2>{String(section.settings.title || 'Khoảnh khắc tuyển chọn')}</h2></div></div><div className={`v27-gallery-grid aspect-${String(section.settings.aspect || 'portrait')}`} style={{'--v27-columns': Number(section.settings.columns || 3)} as CSSProperties}>{items.map(item => <figure key={item.id} {...blockProps(item)}><img src={optimizedImage(String(item.settings.image || ''), 1000, 1200)} alt={String(item.settings.alt || 'TimeForge gallery')} loading="lazy" decoding="async"/></figure>)}</div></section>;
  }
  if (section.type === 'countdownBanner') {
    return <section {...sectionProps(section)} className={`v27-countdown-banner ${dark ? 'tf-dark-section' : surfaceClass} align-${String(section.settings.alignment || 'center')}`}><div><small {...blockProps(heading)}>{String(heading?.settings.eyebrow || 'LIMITED EDIT')}</small><h2 {...blockProps(heading)}>{String(heading?.settings.text || 'Ưu đãi trong thời gian giới hạn')}</h2><p {...blockProps(text)}>{String(text?.settings.text || '')}</p>{action && <Link {...blockProps(action)} to={String(action.settings.link || '/collections')}>{String(action.settings.label || 'Khám phá')}<ArrowRight/></Link>}</div><Countdown endDate={String(section.settings.endDate || '2026-12-31T23:59')}/></section>;
  }
  return null;
}

export const isSharedThemeSectionV27 = (section: Section) => ['imageText', 'richText', 'newsletter', 'multicolumn', 'video', 'testimonials', 'faq', 'logoList', 'gallery', 'countdownBanner'].includes(section.type);
