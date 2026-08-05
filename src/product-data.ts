import type {Metafield, Product, ProductOption, Variant} from './types';
import {asList, asStringList} from './data-normalize';
import {slugify} from './utils';

const FIREBASE_FORBIDDEN_KEY = /[.#$\[\]\/]/;
const EPOCH = new Date(0).toISOString();

const cleanString = (value: unknown, fallback = '') => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};
const finiteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const objectValue = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value)
  ? value as Record<string, unknown>
  : {};
const stringList = (value: unknown, splitComma = false) => typeof value === 'string'
  ? (splitComma ? value.split(',') : [value]).map((item) => item.trim()).filter(Boolean)
  : asStringList(value);

export function normalizeSku(value: unknown): string {
  return String(value ?? '').trim();
}

export function isFirebaseSafeSku(sku: string): boolean {
  return Boolean(sku) && !FIREBASE_FORBIDDEN_KEY.test(sku);
}

export function assertFirebaseSafeSku(sku: string): void {
  if (!sku) throw new Error('Sản phẩm thiếu mã SKU.');
  if (!isFirebaseSafeSku(sku)) {
    throw new Error(`SKU “${sku}” chứa ký tự Firebase không hỗ trợ: . # $ [ ] /`);
  }
}

function normalizeVariantRecord(value: unknown, productSku: string, index: number, fallback: Pick<Product, 'price' | 'compareAtPrice' | 'inventory'>): Variant {
  const variant = objectValue(value) as Partial<Variant>;
  const sku = normalizeSku(variant.sku) || (index === 0 ? productSku : `${productSku || 'variant'}-${index + 1}`);
  return {
    ...variant,
    id: cleanString(variant.id, sku || `variant-${index + 1}`),
    title: cleanString(variant.title, index === 0 ? 'Default Title' : `Variant ${index + 1}`),
    sku,
    price: Math.max(0, finiteNumber(variant.price, fallback.price)),
    compareAtPrice: Math.max(0, finiteNumber(variant.compareAtPrice, fallback.compareAtPrice)),
    inventory: Math.max(0, finiteNumber(variant.inventory, fallback.inventory)),
    optionValues: Object.fromEntries(Object.entries(objectValue(variant.optionValues)).map(([key, item]) => [key, cleanString(item)])),
  };
}

/**
 * Makes legacy/imported product records safe to render without changing their
 * persisted SKU. Saving still goes through canonicalProduct and validates the key.
 */
export function normalizeProductRecord(value: unknown, fallbackId = ''): Product {
  const source = objectValue(value) as Partial<Product>;
  const id = normalizeSku(source.id || source.sku || fallbackId);
  const sku = normalizeSku(source.sku || source.id || fallbackId);
  const basePrice = Math.max(0, finiteNumber(source.price));
  const baseCompareAtPrice = Math.max(0, finiteNumber(source.compareAtPrice));
  const baseInventory = Math.max(0, finiteNumber(source.inventory));
  const rawVariants = asList<unknown>(source.variants);
  const variants = (rawVariants.length ? rawVariants : [{
    id: sku || id,
    title: 'Default Title',
    sku,
    price: basePrice,
    compareAtPrice: baseCompareAtPrice,
    inventory: baseInventory,
  }]).map((variant, index) => normalizeVariantRecord(variant, sku || id, index, {
    price: basePrice,
    compareAtPrice: baseCompareAtPrice,
    inventory: baseInventory,
  }));
  const primary = variants[0];
  const status = ['active', 'draft', 'archived'].includes(cleanString(source.status)) ? source.status as Product['status'] : 'draft';
  const options = asList<unknown>(source.options).map((value, index) => {
    const option = objectValue(value) as Partial<ProductOption>;
    return {
      id: cleanString(option.id, `option-${index + 1}`),
      name: cleanString(option.name, `Tùy chọn ${index + 1}`),
      values: asStringList(option.values),
    };
  });
  const metafields = asList<unknown>(source.metafields).map((value, index) => {
    const field = objectValue(value) as Partial<Metafield>;
    return {
      id: cleanString(field.id, `metafield-${index + 1}`),
      namespace: cleanString(field.namespace, 'custom'),
      key: cleanString(field.key, `field_${index + 1}`),
      value: cleanString(field.value),
      type: cleanString(field.type, 'single_line_text_field'),
    };
  });
  const rawShopify = objectValue(source.rawShopify);
  const handle = slugify(cleanString(source.handle) || `${cleanString(source.vendor)}-${cleanString(source.title)}-${sku || id}`) || slugify(sku || id);

  return {
    ...source,
    id,
    handle,
    title: cleanString(source.title, 'Sản phẩm chưa đặt tên'),
    descriptionHtml: cleanString(source.descriptionHtml),
    descriptionText: cleanString(source.descriptionText),
    vendor: cleanString(source.vendor),
    productType: cleanString(source.productType),
    category: cleanString(source.category),
    tags: stringList(source.tags, true),
    status,
    published: typeof source.published === 'boolean' ? source.published : status === 'active',
    images: stringList(source.images),
    price: basePrice || primary?.price || 0,
    compareAtPrice: baseCompareAtPrice || primary?.compareAtPrice || 0,
    cost: Math.max(0, finiteNumber(source.cost)),
    sku,
    barcode: cleanString(source.barcode),
    inventory: Number.isFinite(Number(source.inventory)) ? baseInventory : variants.reduce((sum, item) => sum + item.inventory, 0),
    trackInventory: source.trackInventory !== false,
    weight: Math.max(0, finiteNumber(source.weight)),
    weightUnit: cleanString(source.weightUnit, 'g'),
    seoTitle: cleanString(source.seoTitle),
    seoDescription: cleanString(source.seoDescription),
    variants,
    options,
    metafields,
    createdAt: cleanString(source.createdAt, EPOCH),
    updatedAt: cleanString(source.updatedAt, cleanString(source.createdAt, EPOCH)),
    ...(Object.keys(rawShopify).length ? {rawShopify: Object.fromEntries(Object.entries(rawShopify).map(([key, item]) => [key, cleanString(item)])) as Record<string, string>} : {}),
  };
}

function canonicalVariant(variant: Variant, productSku: string, index: number): Variant {
  const sku = normalizeSku(variant.sku) || (index === 0 ? productSku : `${productSku}-${index + 1}`);
  return {
    ...variant,
    id: index === 0 ? productSku : sku,
    sku,
  };
}

export function canonicalProduct(product: Product): Product {
  const normalized = normalizeProductRecord(product);
  const sku = normalizeSku(normalized.sku || normalized.id);
  assertFirebaseSafeSku(sku);
  const handle = slugify(normalized.handle || `${normalized.vendor}-${normalized.title}-${sku}`) || slugify(sku);
  const variants = normalized.variants.map((variant, index) => canonicalVariant(variant, sku, index));
  const primary = variants[0];
  return {
    ...normalized,
    id: sku,
    sku,
    handle,
    price: normalized.price || primary?.price || 0,
    compareAtPrice: normalized.compareAtPrice || primary?.compareAtPrice || 0,
    inventory: Number.isFinite(normalized.inventory) ? normalized.inventory : variants.reduce((sum, item) => sum + item.inventory, 0),
    variants,
  };
}

function routeValue(value: unknown): string {
  const raw = String(value ?? '').trim();
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function findProductByRoute(products: Product[], value: unknown): Product | undefined {
  const raw = routeValue(value);
  const normalized = slugify(raw);
  return products.find((product) =>
    product.handle === raw ||
    slugify(product.handle) === normalized ||
    product.id === raw ||
    product.sku === raw
  );
}

export function productsFromFirebase(value: Product[] | Record<string, Product> | null | undefined): Product[] {
  if (!value) return [];
  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? value.map((product, index) => [String(index), product])
    : Object.entries(value);
  const output: Product[] = [];
  for (const [key, rawProduct] of entries) {
    const raw = objectValue(rawProduct) as Partial<Product>;
    const readable = normalizeProductRecord({...raw, id: raw.id || key, sku: raw.sku || key}, key);
    if (!readable.id && !readable.sku) continue;
    try {
      output.push(canonicalProduct(readable));
    } catch {
      // Invalid old SKUs remain readable/editable; validation runs when saving.
      output.push(readable);
    }
  }
  return output;
}

export function productsToFirebaseRecord(products: Product[]): Record<string, Product> {
  return products.reduce<Record<string, Product>>((record, product) => {
    const canonical = canonicalProduct(product);
    record[canonical.sku] = canonical;
    return record;
  }, {});
}

export function productFirebasePath(sku: string): string {
  const normalized = normalizeSku(sku);
  assertFirebaseSafeSku(normalized);
  return `timeforge/products/${normalized}`;
}
