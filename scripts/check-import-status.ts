import { parseGenericRows, parseShopifyRows } from '../src/csv';

const image = 'https://example.com/watch.png';

const generic = parseGenericRows(
  [
    { SKU: 'A1', Title: 'Active', Status: 'active', 'Image URL': image },
    { SKU: 'D1', Title: 'Draft', Status: 'draft', 'Image URL': image },
    { SKU: 'R1', Title: 'Archive', Status: 'archive', 'Image URL': image },
    { SKU: 'F1', Title: 'Fallback', 'Image URL': image },
  ],
  true,
).products.map((product) => [product.sku, product.status, product.published]);

const shopifyRows = [
  ['active', 'SA'],
  ['draft', 'SD'],
  ['archive', 'SR'],
  ['archived', 'SX'],
].map(([Status, sku], index) => ({
  Handle: `watch-${index}`,
  Title: `Watch ${index}`,
  'Variant SKU': sku,
  'Variant Price': '100',
  'Image Src': image,
  Status,
  Published: 'true',
}));

const shopify = parseShopifyRows(
  shopifyRows,
  Object.keys(shopifyRows[0]),
  true,
).products.map((product) => [product.sku, product.status, product.published]);

const expectedGeneric = [
  ['A1', 'active', true],
  ['D1', 'draft', false],
  ['R1', 'archived', false],
  ['F1', 'active', true],
];

const expectedShopify = [
  ['SA', 'active', true],
  ['SD', 'draft', false],
  ['SR', 'archived', false],
  ['SX', 'archived', false],
];

if (JSON.stringify(generic) !== JSON.stringify(expectedGeneric)) {
  throw new Error(`Generic import status mismatch: ${JSON.stringify(generic)}`);
}

if (JSON.stringify(shopify) !== JSON.stringify(expectedShopify)) {
  throw new Error(`Shopify import status mismatch: ${JSON.stringify(shopify)}`);
}

console.log('✓ Import Status giữ đúng active, draft, archive/archived và fallback.');
