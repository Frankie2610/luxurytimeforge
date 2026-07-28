import type {Product} from './types';
import {discount} from './utils';

export type ProductFilterKey =
  | 'gender'
  | 'discount'
  | 'faceShape'
  | 'faceSize'
  | 'bandMaterial'
  | 'bandColor'
  | 'caseColor'
  | 'classification';

export interface ProductFilterDefinition {
  id: ProductFilterKey;
  label: string;
  key: string;
  aliases: string[];
  examples: string[];
  hint: string;
}

export interface ProductFilterOption {
  value: string;
  count: number;
}

export const PRODUCT_FILTER_DEFINITIONS: ProductFilterDefinition[] = [
  {
    id: 'gender',
    label: 'Giới tính',
    key: 'gender',
    aliases: ['gender'],
    examples: ['Nam', 'Nữ', 'Unisex'],
    hint: 'Chỉ đọc metafield custom.gender. Giá trị hợp lệ: Nam, Nữ hoặc Unisex.',
  },
  {
    id: 'discount',
    label: '% Giảm giá',
    key: 'discount',
    aliases: ['discount', 'discount_percent', 'sale_percent'],
    examples: ['10', '20', '30', '50'],
    hint: 'Có thể nhập phần trăm; nếu để trống storefront tự tính từ giá so sánh.',
  },
  {
    id: 'faceShape',
    label: 'Hình dạng mặt số',
    key: 'faceshape',
    aliases: ['faceshape', 'face_shape', 'dial_shape', 'watch_face_shape'],
    examples: ['Tròn', 'Vuông', 'Chữ nhật', 'Tonneau'],
    hint: 'Ví dụ: Tròn, Vuông, Chữ nhật hoặc Tonneau.',
  },
  {
    id: 'faceSize',
    label: 'Kích thước mặt số',
    key: 'facesize',
    aliases: ['facesize', 'face_size', 'case_size', 'diameter', 'duong_kinh'],
    examples: ['28 mm', '32 mm', '36 mm', '40 mm', '42 mm'],
    hint: 'Nên thống nhất định dạng, ví dụ 40 mm.',
  },
  {
    id: 'bandMaterial',
    label: 'Chất liệu dây',
    key: 'bandmaterial',
    aliases: ['bandmaterial', 'band_material', 'strap_material', 'watch_band_material'],
    examples: ['Dây kim loại', 'Dây da', 'Dây cao su', 'Dây vải'],
    hint: 'Ví dụ: Dây kim loại, Dây da hoặc Dây cao su.',
  },
  {
    id: 'bandColor',
    label: 'Màu dây',
    key: 'bandcolor',
    aliases: ['bandcolor', 'band_color', 'band-color', 'strap_color', 'm_u_d_y'],
    examples: ['Đen', 'Nâu', 'Bạc', 'Vàng', 'Vàng hồng'],
    hint: 'Nhập tên màu ngắn gọn và nhất quán.',
  },
  {
    id: 'caseColor',
    label: 'Màu vỏ',
    key: 'casecolor',
    aliases: ['casecolor', 'case_color', 'case-color', 'watch_case_color'],
    examples: ['Bạc', 'Đen', 'Vàng', 'Vàng hồng'],
    hint: 'Màu vỏ hoặc màu viền chính của đồng hồ.',
  },
  {
    id: 'classification',
    label: 'Phân loại',
    key: 'classification',
    aliases: ['classification', 'watch_type', 'movement', 'phan_loai'],
    examples: ['Đồng hồ cơ', 'Đồng hồ Quartz', 'Đồng hồ thông minh'],
    hint: 'Ví dụ: Đồng hồ cơ, Đồng hồ Quartz.',
  },
];

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const normalizeKey = (value: string) => value.trim().toLocaleLowerCase('vi-VN').replace(/[\s.-]+/g, '_');
const normalizePlain = (value: string) => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLocaleLowerCase('vi-VN');
const splitValues = (value: string) => [...new Set(value
  .split(/\s*(?:,|;|\||\/)\s*/)
  .map(clean)
  .filter(Boolean))];

const plainDescription = (product: Product) => (product.descriptionHtml || product.descriptionText || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(?:li|p|h\d)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .split('\n')
  .map(clean)
  .filter(Boolean);

const findSpec = (product: Product, labels: string[]) => {
  const normalizedLabels = labels.map((label) => label.toLocaleLowerCase('vi-VN'));
  for (const line of plainDescription(product)) {
    const divider = line.indexOf(':');
    if (divider < 0) continue;
    const label = clean(line.slice(0, divider)).toLocaleLowerCase('vi-VN');
    if (normalizedLabels.some((item) => label === item || label.endsWith(item))) return clean(line.slice(divider + 1));
  }
  return '';
};

const metafieldValues = (product: Product, definition: ProductFilterDefinition) => {
  const aliases = new Set([definition.key, ...definition.aliases].map(normalizeKey));
  return (product.metafields || [])
    .filter((field) => aliases.has(normalizeKey(field.key)))
    .flatMap((field) => splitValues(field.value));
};

const genderMetafieldValues = (product: Product) => (product.metafields || [])
  .filter((field) => normalizeKey(field.namespace || '') === 'custom' && normalizeKey(field.key) === 'gender')
  .flatMap((field) => splitValues(field.value))
  .map((value) => {
    const normalized = normalizePlain(value);
    if (normalized === 'nam' || normalized === 'male') return 'Nam';
    if (normalized === 'nu' || normalized === 'female') return 'Nữ';
    if (normalized === 'unisex') return 'Unisex';
    return '';
  })
  .filter(Boolean);

const tagMatch = (product: Product, pattern: RegExp) => product.tags.find((tag) => pattern.test(tag)) || '';

const inferredValues = (product: Product, key: ProductFilterKey): string[] => {
  if (key === 'gender') {
    const value = findSpec(product, ['Giới tính']) || tagMatch(product, /^(nam|nữ|nu|unisex)$/i);
    return value ? [value] : [];
  }
  if (key === 'discount') {
    const rate = discount(product.price, product.compareAtPrice);
    if (rate <= 0) return [];
    if (rate < 10) return ['Dưới 10%'];
    if (rate < 20) return ['10% – 19%'];
    if (rate < 30) return ['20% – 29%'];
    if (rate < 40) return ['30% – 39%'];
    if (rate < 50) return ['40% – 49%'];
    return ['Từ 50%'];
  }
  if (key === 'faceShape') {
    const value = findSpec(product, ['Hình dạng mặt số', 'Hình dạng mặt', 'Dáng mặt']);
    if (value) return [value];
    if (/tonneau/i.test(product.title)) return ['Tonneau'];
    if (/square|vuông/i.test(product.title)) return ['Vuông'];
    if (/rectangle|chữ nhật/i.test(product.title)) return ['Chữ nhật'];
    return product.productType.toLocaleLowerCase('vi-VN').includes('watch') ? ['Tròn'] : [];
  }
  if (key === 'faceSize') {
    const value = findSpec(product, ['Kích thước mặt số', 'Đường kính', 'Kích thước vỏ'])
      || tagMatch(product, /^\d+(?:[.,]\d+)?\s*mm$/i);
    return value ? [value.replace(/(\d)\s*mm$/i, '$1 mm')] : [];
  }
  if (key === 'bandMaterial') {
    const value = findSpec(product, ['Chất liệu dây', 'Dây đeo']) || tagMatch(product, /^Dây\s/i);
    const matched = value.match(/dây\s+(kim loại|da|cao su|vải|silicone|thép[^,;]*)/i);
    return matched ? [`Dây ${clean(matched[1]).toLocaleLowerCase('vi-VN')}`.replace(/^Dây k/, 'Dây k')] : value ? [value] : [];
  }
  if (key === 'bandColor') {
    const value = findSpec(product, ['Màu dây', 'Dây đeo']);
    const matched = value.match(/màu\s+(.+)$/i);
    return matched ? [clean(matched[1])] : [];
  }
  if (key === 'caseColor') {
    const value = findSpec(product, ['Màu vỏ', 'Màu viền', 'Viền đồng hồ']);
    return value ? [value] : [];
  }
  if (key === 'classification') {
    const value = findSpec(product, ['Phân loại', 'Máy', 'Bộ máy']);
    if (value) return [/quartz/i.test(value) ? 'Đồng hồ Quartz' : /automatic|cơ/i.test(value) ? 'Đồng hồ cơ' : value];
    return product.productType ? [product.productType.toLocaleLowerCase('vi-VN') === 'watches' ? 'Đồng hồ' : product.productType] : [];
  }
  return [];
};

export const readProductFilterValues = (product: Product, key: ProductFilterKey): string[] => {
  const definition = PRODUCT_FILTER_DEFINITIONS.find((item) => item.id === key);
  if (!definition) return [];
  if (key === 'gender') return [...new Set(genderMetafieldValues(product))];
  const explicit = metafieldValues(product, definition);
  if (key === 'discount' && explicit.length) {
    const rate = Number(explicit[0].replace(/[^\d.]/g, ''));
    if (Number.isFinite(rate) && rate > 0) {
      if (rate < 10) return ['Dưới 10%'];
      if (rate < 20) return ['10% – 19%'];
      if (rate < 30) return ['20% – 29%'];
      if (rate < 40) return ['30% – 39%'];
      if (rate < 50) return ['40% – 49%'];
      return ['Từ 50%'];
    }
  }
  return explicit.length ? explicit : inferredValues(product, key);
};

export const emptyProductFilterSelection = (): Record<ProductFilterKey, string[]> => ({
  gender: [],
  discount: [],
  faceShape: [],
  faceSize: [],
  bandMaterial: [],
  bandColor: [],
  caseColor: [],
  classification: [],
});

export const buildProductFacetOptions = (products: Product[]): Record<ProductFilterKey, ProductFilterOption[]> => {
  const output: Record<ProductFilterKey, ProductFilterOption[]> = {
    gender: [],
    discount: [],
    faceShape: [],
    faceSize: [],
    bandMaterial: [],
    bandColor: [],
    caseColor: [],
    classification: [],
  };
  PRODUCT_FILTER_DEFINITIONS.forEach((definition) => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      readProductFilterValues(product, definition.id).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    });
    output[definition.id] = [...counts.entries()]
      .map(([value, count]) => ({value, count}))
      .sort((a, b) => definition.id === 'faceSize'
        ? Number.parseFloat(a.value) - Number.parseFloat(b.value)
        : a.value.localeCompare(b.value, 'vi'));
  });
  return output;
};
