import {readProductFilterValues} from './product-filter-data';
import type {Product, ProductGroup, ProductGroupItem} from './types';
import {slugify, uid} from './utils';

const PREFIX_LENGTHS: Record<string, number> = {
  VERSACE: 4,
  FERRAGAMO: 4,
  'PHILIPP PLEIN': 5,
  'VERSUS BY VERSACE': 5,
  MISSONI: 6,
  GUESS: 6,
  'TED BAKER': 7,
  ADIDAS: 8,
  LOCMAN: 8,
  FURLA: 10,
};

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const vendorKey = (value: string) => clean(value).toLocaleUpperCase('en-US');
const modelName = (title: string) => clean(title).split(' ').filter(Boolean).at(-1) || 'UnknownModel';
const productColor = (product: Product) =>
  readProductFilterValues(product, 'bandColor')[0]
  || readProductFilterValues(product, 'caseColor')[0]
  || '';
const productSize = (product: Product) => readProductFilterValues(product, 'faceSize')[0] || '';

export const skuPrefixLengthForVendor = (vendor: string) => PREFIX_LENGTHS[vendorKey(vendor)] || 5;

export const skuPrefixForProduct = (product: Product) => {
  const sku = clean(product.sku).toLocaleUpperCase('en-US');
  return sku.slice(0, skuPrefixLengthForVendor(product.vendor));
};

const itemFromProduct = (product: Product, index: number, previous?: ProductGroupItem): ProductGroupItem => ({
  id: previous?.id || uid('group-item'),
  productId: product.id,
  sku: product.sku,
  name: previous?.name || product.title,
  color: previous?.color || productColor(product),
  size: previous?.size || productSize(product),
  image: product.images[0] || previous?.image || '',
  sortOrder: previous?.sortOrder ?? index,
});

/**
 * Recreates SKU families from the catalog after a product import.
 * Manual labels and item corrections are retained by autoKey/SKU.
 */
export const buildAutomaticProductGroups = (products: Product[], existing: ProductGroup[] = []): ProductGroup[] => {
  const buckets = new Map<string, {vendor: string; prefix: string; products: Product[]}>();

  products.forEach((product) => {
    const sku = clean(product.sku);
    if (!sku || !product.id) return;
    const vendor = vendorKey(product.vendor) || 'TIMEFORGE';
    const prefix = skuPrefixForProduct(product);
    if (!prefix) return;
    const key = `${vendor}::${prefix}`;
    const bucket = buckets.get(key) || {vendor, prefix, products: []};
    if (!bucket.products.some((item) => item.id === product.id || item.sku === product.sku)) bucket.products.push(product);
    buckets.set(key, bucket);
  });

  const now = new Date().toISOString();
  const generated = [...buckets.entries()]
    .filter(([, bucket]) => bucket.products.length >= 2)
    .map(([autoKey, bucket]): ProductGroup => {
      const previous = existing.find((group) => group.autoKey === autoKey)
        || existing.find((group) => vendorKey(group.vendor || '') === bucket.vendor && group.skuPrefix.toLocaleUpperCase('en-US') === bucket.prefix);
      const previousItems = new Map((previous?.items || []).map((item) => [item.sku.toLocaleUpperCase('en-US'), item]));
      const items = bucket.products
        .map((product, index) => itemFromProduct(product, index, previousItems.get(product.sku.toLocaleUpperCase('en-US'))))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.sku.localeCompare(b.sku));

      return {
        id: previous?.id || `group-${slugify(bucket.vendor)}-${slugify(bucket.prefix)}`,
        name: previous?.name || `${bucket.vendor}-${bucket.prefix}-${modelName(bucket.products[0]?.title || '')}`,
        skuPrefix: previous?.skuPrefix || bucket.prefix,
        vendor: bucket.vendor,
        description: previous?.description || 'Các phiên bản cùng dòng được hệ thống nhóm tự động theo thương hiệu và tiền tố SKU.',
        status: previous?.status || 'active',
        source: 'automatic',
        autoKey,
        manualOverride: previous?.manualOverride || false,
        items,
        createdAt: previous?.createdAt || now,
        updatedAt: now,
      };
    });

  const retainedManual = existing.filter((group) => {
    if (group.source === 'manual' || (!group.autoKey && group.manualOverride)) return true;
    return group.manualOverride && !generated.some((candidate) => candidate.autoKey === group.autoKey);
  });

  return [...generated, ...retainedManual]
    .filter((group, index, list) => list.findIndex((candidate) => candidate.id === group.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
};
