import { mockCategories, mockHeroBanner } from './mockData';
import { Category } from '@typings/category';
import { HeroBanner } from '@typings/home';

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export const getCategories = async (): Promise<Category[]> => {
  await delay(500);
  return mockCategories;
};

export const getHeroBanner = async (): Promise<HeroBanner> => {
  await delay(400);
  return mockHeroBanner;
};