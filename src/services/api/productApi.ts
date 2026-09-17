import { mockProducts } from './mockData';
import { Product } from '@typings/product';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const getProducts = async (): Promise<Product[]> => {
  await delay(700);
  return mockProducts;
};