import { Category } from '@typings/category';
import { HeroBanner } from '@typings/home';
import { Product, ProductVariant } from '@typings/product';

const img = (id: string, width = 800): string =>
  `https://images.unsplash.com/photo-${id}?q=80&w=${width}&auto=format&fit=crop`;

export const mockHeroBanner: HeroBanner = {
  id: 'hero-summer-2026',
  title: 'The Summer 2026 Edit',
  subtitle: 'Lightweight layers for warm days ahead',
  image: img('1496747611176-843222e1e57c', 1400),
  ctaLabel: 'SHOP NOW',
};

export const mockCategories: Category[] = [
  { id: 'cat-dresses', name: 'Dresses', image: img('1445205170230-053b83016050'), productCount: 24 },
  { id: 'cat-tops', name: 'Tops', image: img('1523381210434-271e8be1f52b'), productCount: 42 },
  { id: 'cat-outerwear', name: 'Outerwear', image: img('1539109136881-3be0616acf4b'), productCount: 18 },
  { id: 'cat-knitwear', name: 'Knitwear', image: img('1529139574466-a303027c1d8b'), productCount: 21 },
  { id: 'cat-trousers', name: 'Trousers', image: img('1473966968600-fa801b869a1a'), productCount: 27 },
  { id: 'cat-activewear', name: 'Activewear', image: img('1526401485004-46910ecc8e51'), productCount: 15 },
];

const product = (
  id: string,
  name: string,
  categoryId: string,
  price: number,
  photoId: string,
  rating: number,
  reviewCount: number,
  opts: {
    compareAtPrice?: number;
    colors?: string[];
    isNew?: boolean;
    alt?: string;
    brandName?: string;
    variants?: ProductVariant[];
  } = {},
): Product => ({
  id,
  name,
  brandName: opts.brandName ?? 'EasyBrands',
  slug: id,
  price,
  compareAtPrice: opts.compareAtPrice,
  currency: 'USD',
  categoryId,
  images: [
    { url: img(photoId), alt: opts.alt ?? `${name} on model` },
    { url: img(photoId, 400), alt: opts.alt ?? `${name} on model` },
  ],
  colors: opts.colors ?? ['#171717'],
  available: true,
  variants: opts.variants ?? [],
  rating,
  reviewCount,
  isNew: opts.isNew ?? false,
});

export const mockProducts: Product[] = [
  product('p-001', 'Linen-Blend Wrap Dress', 'cat-dresses', 128, '1490481651871-ab68de25d43d', 4.7, 214, {
    compareAtPrice: 168,
    colors: ['#C9AB91', '#3A342C'],
    isNew: true,
  }),
  product('p-002', 'Silk Slip Midi Dress', 'cat-dresses', 158, '1509319117193-57bab727e09d', 4.8, 186, {
    colors: ['#D9B25A', '#2C2A28'],
    isNew: true,
  }),
  product('p-003', 'Cropped Cotton Top', 'cat-tops', 45, '1562157873-818bc0726f68', 4.3, 98, {
    colors: ['#E7E2D8', '#171717'],
  }),
  product('p-004', 'Oversized Poplin Shirt', 'cat-tops', 58, '1521572163474-6864f9cf17ab', 4.5, 142, {
    compareAtPrice: 72,
    colors: ['#FFFFFF', '#B7B1A6'],
  }),
  product('p-005', 'Relaxed Fit Overshirt', 'cat-outerwear', 98, '1441984904996-e0b6ba687e04', 4.6, 121, {
    compareAtPrice: 128,
    colors: ['#8B6F52', '#34302C'],
    isNew: true,
  }),
  product('p-006', 'Wool Peacoat', 'cat-outerwear', 189, '1509941943102-10c232535736', 4.9, 87, {
    compareAtPrice: 249,
    colors: ['#232323', '#6E6257'],
  }),
  product('p-007', 'Merino Crewneck Sweater', 'cat-knitwear', 112, '1434389677669-e08b4cac3105', 4.6, 165, {
    colors: ['#B9B0A2', '#58605D'],
    isNew: true,
  }),
  product('p-008', 'Ribbed V-Neck Cardigan', 'cat-knitwear', 124, '1496747611176-843222e1e57c', 4.4, 76, {
    colors: ['#C7795C', '#3B3B3B'],
  }),
  product('p-009', 'High-Rise Straight Jeans', 'cat-trousers', 79, '1495385794356-15371f348c31', 4.5, 301, {
    compareAtPrice: 95,
    colors: ['#3E5A8C', '#1F2429'],
  }),
  product('p-010', 'Wide-Leg Pleated Trousers', 'cat-trousers', 88, '1483985988355-763728e1935b', 4.2, 54, {
    colors: ['#A9A195', '#222222'],
  }),
  product('p-011', 'Seamless High-Waist Legging', 'cat-activewear', 68, '1515886657613-9f3515b0c78f', 4.7, 240, {
    colors: ['#2A2A3A', '#5C4A3F'],
    isNew: true,
  }),
  product('p-012', 'Performance Running Jacket', 'cat-activewear', 96, '1469334031218-e382a71b716b', 4.4, 132, {
    compareAtPrice: 118,
    colors: ['#C2D4D8', '#26221E'],
  }),
];