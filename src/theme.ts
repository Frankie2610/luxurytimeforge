import type {BlockType, Section, SectionType, TemplateKey, Theme, ThemeBlock, ThemeState, ThemeTemplate} from './types';
import {uid} from './utils';

const b = (type: BlockType, settings: ThemeBlock['settings'] = {}): ThemeBlock => ({id: uid('b'), type, visible: true, settings});
const s = (type: SectionType, settings: Section['settings'] = {}, blocks: ThemeBlock[] = []): Section => ({id: uid('s'), type, visible: true, settings, blocks});
const t = (key: TemplateKey, name: string, sections: Section[]): ThemeTemplate => ({key, name, sections});

export const sectionLabels: Record<SectionType, string> = {
  hero: 'Banner hình ảnh',
  trust: 'Cam kết cửa hàng',
  collections: 'Danh sách bộ sưu tập',
  products: 'Lưới sản phẩm',
  bestSellers: 'Sản phẩm bán chạy',
  blogPosts: 'Bài viết tạp chí',
  multicolumn: 'Nội dung nhiều cột',
  video: 'Video',
  imageText: 'Hình ảnh với nội dung',
  richText: 'Văn bản',
  newsletter: 'Đăng ký nhận tin',
  testimonials: 'Đánh giá khách hàng',
  faq: 'Câu hỏi thường gặp',
  logoList: 'Danh sách thương hiệu',
  gallery: 'Thư viện hình ảnh',
  countdownBanner: 'Banner đếm ngược',
  productMain: 'Thông tin sản phẩm',
  productRecommendations: 'Sản phẩm liên quan',
  collectionBanner: 'Banner bộ sưu tập',
  collectionGrid: 'Danh sách sản phẩm',
  searchResults: 'Kết quả tìm kiếm',
  cartMain: 'Giỏ hàng',
  pageContent: 'Nội dung trang',
};

export const blockLabels: Record<BlockType, string> = {
  heading: 'Tiêu đề', text: 'Văn bản', button: 'Nút', image: 'Hình ảnh', iconText: 'Biểu tượng & nội dung',
  productInfo: 'Thông tin cơ bản', price: 'Giá', variantPicker: 'Phiên bản', quantity: 'Số lượng',
  buyButtons: 'Nút mua hàng', accordion: 'Nội dung thu gọn', spacer: 'Khoảng cách', group: 'Nhóm block',
};

export const templateLabels: Record<TemplateKey, string> = {
  home: 'Trang chủ', product: 'Trang sản phẩm', collection: 'Trang bộ sưu tập', search: 'Trang tìm kiếm', cart: 'Trang giỏ hàng', page: 'Trang nội dung',
};

const sharedEditorialSections: SectionType[] = ['imageText', 'richText', 'multicolumn', 'video', 'testimonials', 'faq', 'logoList', 'gallery', 'countdownBanner', 'newsletter'];
export const allowedSections: Record<TemplateKey, SectionType[]> = {
  home: ['hero', 'trust', 'collections', 'products', 'bestSellers', 'blogPosts', ...sharedEditorialSections],
  product: ['productMain', 'trust', 'productRecommendations', ...sharedEditorialSections],
  collection: ['collectionBanner', 'collectionGrid', ...sharedEditorialSections],
  search: ['searchResults', 'richText', 'logoList', 'newsletter'],
  cart: ['cartMain', 'trust', 'richText', 'faq', 'newsletter'],
  page: ['pageContent', ...sharedEditorialSections],
};

export const allowedBlocks: Partial<Record<SectionType, BlockType[]>> = {
  hero: ['heading', 'text', 'button'], trust: ['iconText'], imageText: ['heading', 'text', 'button'],
  richText: ['heading', 'text', 'button'], newsletter: ['heading', 'text', 'button'], multicolumn: ['iconText'],
  video: ['heading', 'text', 'button'], testimonials: ['iconText'], faq: ['accordion'], logoList: ['iconText'],
  gallery: ['image'], countdownBanner: ['heading', 'text', 'button'],
  productMain: ['productInfo', 'price', 'variantPicker', 'quantity', 'buyButtons', 'accordion'],
  collectionBanner: ['heading', 'text'], pageContent: ['heading', 'text'],
};

export const createSection = (type: SectionType): Section => {
  switch (type) {
    case 'hero': return s(type, {image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1800&q=90', height: 680, overlay: 46, alignment: 'left', colorScheme: 'dark'}, [
      b('heading', {eyebrow: 'TIMEFORGE SELECTION', text: 'Thời gian, được chế tác thành phong cách.'}),
      b('text', {text: 'Tuyển chọn đồng hồ chính hãng với dịch vụ hậu mãi rõ ràng.'}),
      b('button', {label: 'Khám phá bộ sưu tập', link: '/collections', style: 'primary'}),
    ]);
    case 'trust': return s(type, {columns: 3, background: 'light'}, [
      b('iconText', {icon: 'shield', title: 'Sản phẩm chính hãng', text: 'Thông tin nguồn gốc rõ ràng'}),
      b('iconText', {icon: 'truck', title: 'Giao hàng an toàn', text: 'Đóng gói kỹ trước khi gửi'}),
      b('iconText', {icon: 'clock', title: 'Hỗ trợ nhanh', text: 'Tư vấn trước và sau mua'}),
    ]);
    case 'collections': return s(type, {eyebrow: 'CURATED WORLDS', title: 'Bộ sưu tập nổi bật', description: 'Mỗi lựa chọn là một câu chuyện riêng về phong cách và di sản.', limit: 3, layout: 'cards'});
    case 'products': return s(type, {eyebrow: 'THE TIMEFORGE SELECTION', title: 'Được lựa chọn nhiều', description: 'Những thiết kế cân bằng giữa thẩm mỹ và giá trị sử dụng.', limit: 8, columns: 4, collectionHandle: ''});
    case 'bestSellers': return s(type, {eyebrow: 'ĐƯỢC LỰA CHỌN NHIỀU', title: 'Sản phẩm bán chạy', description: 'Những thiết kế được quan tâm và lựa chọn nhiều trong thời gian gần đây.', limit: 8, columns: 4});
    case 'blogPosts': return s(type, {eyebrow: 'TIMEFORGE JOURNAL', title: 'Câu chuyện về thời gian và phong cách', description: 'Kiến thức tuyển chọn về đồng hồ, chăm sóc và trải nghiệm sở hữu.', limit: 3});
    case 'multicolumn': return s(type, {eyebrow: 'DỊCH VỤ TIMEFORGE', title: 'Trải nghiệm được chăm chút', columns: 3, background: 'light'}, [
      b('iconText', {icon: 'shield', title: 'Chính hãng', text: 'Thông tin sản phẩm và nguồn hàng rõ ràng.'}),
      b('iconText', {icon: 'truck', title: 'Giao hàng an toàn', text: 'Đóng gói cẩn thận và theo dõi minh bạch.'}),
      b('iconText', {icon: 'clock', title: 'Hỗ trợ hậu mãi', text: 'Đồng hành trong quá trình sử dụng.'}),
    ]);
    case 'video': return s(type, {videoUrl: '', poster: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1800&q=85', alignment: 'left', height: 560, overlay: 58, colorScheme: 'dark'}, [
      b('heading', {eyebrow: 'TIME IN MOTION', text: 'Chuyển động của thời gian'}),
      b('text', {text: 'Kể câu chuyện thương hiệu bằng hình ảnh chuyển động.'}),
      b('button', {label: 'Khám phá bộ sưu tập', link: '/collections', style: 'secondary'}),
    ]);
    case 'imageText': return s(type, {image: 'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1400&q=85', imagePosition: 'left', background: 'light'}, [
      b('heading', {eyebrow: 'THE TIMEFORGE STANDARD', text: 'Chọn đúng chiếc đồng hồ phù hợp'}),
      b('text', {text: 'TimeForge tập trung vào sản phẩm có nguồn gốc rõ ràng và trải nghiệm mua sắm minh bạch.'}),
      b('button', {label: 'Câu chuyện TimeForge', link: '/pages/about', style: 'link'}),
    ]);
    case 'richText': return s(type, {alignment: 'center', width: 'narrow', background: 'transparent'}, [
      b('heading', {eyebrow: 'TIMEFORGE', text: 'Một tiêu đề giàu cảm hứng'}),
      b('text', {text: 'Thêm nội dung giới thiệu, thông báo hoặc câu chuyện thương hiệu tại đây.'}),
      b('button', {label: 'Xem thêm', link: '/collections', style: 'link'}),
    ]);
    case 'newsletter': return s(type, {background: 'dark'}, [
      b('heading', {eyebrow: 'STAY IN TIME', text: 'Nhận tin từ TimeForge'}),
      b('text', {text: 'Cập nhật bộ sưu tập mới và ưu đãi riêng.'}),
      b('button', {label: 'Đăng ký', style: 'primary'}),
    ]);
    case 'testimonials': return s(type, {eyebrow: 'CLIENT STORIES', title: 'Trải nghiệm từ khách hàng', columns: 3, background: 'light'}, [
      b('iconText', {icon: 'quote', title: 'Trải nghiệm chỉn chu', text: 'Thông tin rõ ràng, đóng gói cẩn thận và hỗ trợ rất nhanh.'}),
      b('iconText', {icon: 'quote', title: 'Tư vấn đúng nhu cầu', text: 'Đội ngũ giúp chọn kích thước phù hợp thay vì chỉ tập trung vào giá.'}),
      b('iconText', {icon: 'quote', title: 'An tâm khi mua online', text: 'Hình ảnh và tình trạng sản phẩm đúng như mô tả.'}),
    ]);
    case 'faq': return s(type, {eyebrow: 'NEED TO KNOW', title: 'Câu hỏi thường gặp', background: 'transparent'}, [
      b('accordion', {title: 'Sản phẩm có chính hãng không?', text: 'TimeForge công bố rõ nguồn hàng, tình trạng và chính sách đi kèm của từng sản phẩm.', open: true}),
      b('accordion', {title: 'Thời gian giao hàng bao lâu?', text: 'Thời gian dự kiến từ 1–4 ngày tùy khu vực và tình trạng sản phẩm.', open: false}),
      b('accordion', {title: 'Chính sách bảo hành thế nào?', text: 'Điều kiện bảo hành được thể hiện theo từng thương hiệu và xác nhận lại trước khi giao.', open: false}),
    ]);
    case 'logoList': return s(type, {eyebrow: 'SELECTED MAISONS', title: 'Thương hiệu được tuyển chọn', columns: 5, background: 'transparent'}, [
      b('iconText', {title: 'VERSACE', text: ''}), b('iconText', {title: 'TIMEX', text: ''}), b('iconText', {title: 'FOSSIL', text: ''}), b('iconText', {title: 'MOVADO', text: ''}), b('iconText', {title: 'MICHAEL KORS', text: ''}),
    ]);
    case 'gallery': return s(type, {eyebrow: 'TIMEFORGE EDIT', title: 'Khoảnh khắc tuyển chọn', columns: 3, aspect: 'portrait', background: 'transparent'}, [
      b('image', {image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85', alt: 'Đồng hồ TimeForge'}),
      b('image', {image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85', alt: 'Chi tiết đồng hồ'}),
      b('image', {image: 'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?auto=format&fit=crop&w=1000&q=85', alt: 'Phong cách TimeForge'}),
    ]);
    case 'countdownBanner': return s(type, {background: 'dark', endDate: '2026-12-31T23:59', alignment: 'center'}, [
      b('heading', {eyebrow: 'LIMITED EDIT', text: 'Ưu đãi tuyển chọn trong thời gian giới hạn'}),
      b('text', {text: 'Khám phá các thiết kế đang được áp dụng mức giá đặc biệt.'}),
      b('button', {label: 'Xem bộ sưu tập', link: '/collections', style: 'secondary'}),
    ]);
    case 'productMain': return s(type, {gallerySize: 'medium', stickyInfo: true, thumbnailPosition: 'left', showBreadcrumb: true}, [
      b('productInfo', {showVendor: true, showSku: false, showStock: true}), b('price', {showCompare: true, showDiscount: true}),
      b('variantPicker', {style: 'buttons'}), b('quantity'), b('buyButtons', {showAddToCart: true, showBuyNow: true, showWishlist: true}),
      b('accordion', {title: 'Mô tả sản phẩm', source: 'description', open: true}), b('accordion', {title: 'Giao hàng & thanh toán', source: 'shipping', open: false}),
      b('accordion', {title: 'Bảo hành & đổi trả', source: 'warranty', open: false}),
    ]);
    case 'productRecommendations': return s(type, {title: 'Sản phẩm liên quan', limit: 4, columns: 4});
    case 'collectionBanner': return s(type, {height: 360, showImage: true, alignment: 'left', overlay: 52, colorScheme: 'dark'}, [
      b('heading', {eyebrow: 'TIMEFORGE COLLECTION', text: 'Tên bộ sưu tập'}), b('text', {text: 'Mô tả bộ sưu tập sẽ được lấy tự động.'}),
    ]);
    case 'collectionGrid': return s(type, {columns: 4, showFilter: true, showSort: true, showCount: true, pageSize: 50});
    case 'searchResults': return s(type, {columns: 4, showSuggestions: true});
    case 'cartMain': return s(type, {showCoupon: true, showShippingEstimate: true, showTrust: true});
    case 'pageContent': return s(type, {width: 'narrow', alignment: 'left'}, [b('heading', {eyebrow: 'TIMEFORGE', text: 'Tiêu đề trang'}), b('text', {text: 'Nội dung trang được lấy từ trình quản trị nội dung.'})]);
  }
};

const defaultSettings: Theme['settings'] = {
  storeName: 'Luxury Timeforge', announcement: 'Giảm giá đến 50% · Miễn phí giao hàng cho đơn từ 5.000.000₫', accent: '#2d6543',
  storeDescription: 'Đồng hồ chính hãng, tuyển chọn kỹ và hậu mãi minh bạch.',
  storePhone: '', storeEmail: '', storeAddress: '', taxId: '',
  facebookUrl: '', instagramUrl: '', tiktokUrl: '', recruitmentUrl: '',
  background: '#f7f5f0', surface: '#fffdf9', text: '#17221b', muted: '#687068', textOnDark: '#f8f5ef', radius: 18,
  cardRadius: 18, buttonRadius: 999, contentWidth: 1360, sectionSpacing: 88, headingScale: 100, headingWeight: 600,
  bodyWeight: 400, headingFont: 'Cormorant Garamond', bodyFont: 'Inter', motion: 'subtle', logoText: 'LUXURY TIMEFORGE', logoImage: '',
  showAnnouncement: true, stickyHeader: true,
};

export const defaultTheme = (): Theme => ({
  version: 4,
  name: 'Luxury Timeforge Atelier',
  settings: {...defaultSettings},
  templates: {
    home: t('home', 'Trang chủ', [createSection('hero'), createSection('trust'), createSection('collections'), createSection('products'), createSection('bestSellers'), createSection('imageText'), createSection('testimonials'), createSection('blogPosts'), createSection('newsletter')]),
    product: t('product', 'Trang sản phẩm', [createSection('productMain'), createSection('trust'), createSection('productRecommendations')]),
    collection: t('collection', 'Trang bộ sưu tập', [createSection('collectionBanner'), createSection('collectionGrid'), createSection('newsletter')]),
    search: t('search', 'Trang tìm kiếm', [createSection('searchResults'), createSection('newsletter')]),
    cart: t('cart', 'Trang giỏ hàng', [createSection('cartMain'), createSection('trust')]),
    page: t('page', 'Trang nội dung', [createSection('pageContent'), createSection('newsletter')]),
  },
});

export const createThemeState = (): ThemeState => {
  const theme = defaultTheme();
  return {draft: structuredClone(theme), published: structuredClone(theme), publishedAt: new Date().toISOString(), versions: []};
};

function normalizeThemeV27(theme: Theme): Theme {
  const next = structuredClone(theme);
  const normalizeBlocksV41 = (blocks: ThemeBlock[]): ThemeBlock[] => blocks.map((block) => ({
    ...block,
    settings: block.type === 'buyButtons'
      ? {showAddToCart: true, showBuyNow: true, showWishlist: true, ...(block.settings || {})}
      : {...(block.settings || {})},
    ...(block.children ? {children: normalizeBlocksV41(block.children)} : {}),
  }));
  next.version = Math.max(4, Number(next.version || 0));
  next.settings = {...defaultSettings, ...(next.settings || {})};
  const base = defaultTheme();
  (Object.keys(base.templates) as TemplateKey[]).forEach((key) => {
    if (!next.templates[key]) next.templates[key] = structuredClone(base.templates[key]);
    next.templates[key].sections = next.templates[key].sections.map((section) => ({
      ...section,
      blocks: normalizeBlocksV41(section.blocks || []),
    }));
  });
  const home = next.templates.home;
  const types = home.sections.map(section => section.type);
  if (!types.includes('bestSellers')) {
    const productIndex = home.sections.findIndex(section => section.type === 'products');
    home.sections.splice(productIndex >= 0 ? productIndex + 1 : home.sections.length, 0, createSection('bestSellers'));
  }
  if (!types.includes('blogPosts')) {
    const imageIndex = home.sections.findIndex(section => section.type === 'imageText');
    home.sections.splice(imageIndex >= 0 ? imageIndex + 1 : home.sections.length, 0, createSection('blogPosts'));
  }
  return next;
}

export function migrateTheme(raw: unknown): ThemeState {
  if (raw && typeof raw === 'object' && 'draft' in raw && 'published' in raw) {
    const state = raw as ThemeState;
    return {...state, draft: normalizeThemeV27(state.draft), published: normalizeThemeV27(state.published)};
  }
  if (raw && typeof raw === 'object' && 'sections' in raw) {
    const base = defaultTheme();
    const old = raw as {storeName?: string; announcement?: string; accent?: string; background?: string; text?: string; radius?: number; sections?: Array<{id: string; type: SectionType; visible: boolean; settings: Record<string, string | number | boolean>}>};
    base.settings = {...base.settings, storeName: old.storeName || base.settings.storeName, announcement: old.announcement || base.settings.announcement, accent: old.accent || base.settings.accent, background: old.background || base.settings.background, text: old.text || base.settings.text, radius: old.radius ?? base.settings.radius};
    if (old.sections?.length) base.templates.home.sections = old.sections.map(item => ({...item, blocks: createSection(item.type).blocks}));
    const normalized = normalizeThemeV27(base);
    return {draft: structuredClone(normalized), published: structuredClone(normalized), publishedAt: new Date().toISOString(), versions: []};
  }
  return createThemeState();
}
