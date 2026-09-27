import { useQuery } from '@tanstack/react-query';
import { getCategories, getHeroBanner } from '@services/api/categoryApi';
import { getProducts } from '@services/api/productApi';

const CATEGORIES_STALE_TIME = 10 * 60 * 1000;
const PRODUCTS_STALE_TIME = 5 * 60 * 1000;

export const useHomeFeed = () => {
  const heroQuery = useQuery({
    queryKey: ['home', 'hero'],
    queryFn: getHeroBanner,
    staleTime: CATEGORIES_STALE_TIME,
  });

  const categoriesQuery = useQuery({
    // Keyed by source: these used to be brand tiles, so the old cache must not
    // be reused now that the rail is built from product categories. No cap --
    // the rail scrolls, so it shows every category the API returns.
    queryKey: ['categories', 'by-product', 'home'],
    queryFn: getCategories,
    staleTime: CATEGORIES_STALE_TIME,
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'home'],
    queryFn: getProducts,
    staleTime: PRODUCTS_STALE_TIME,
  });

  const isLoading =
    heroQuery.isLoading || categoriesQuery.isLoading || productsQuery.isLoading;

  const isError = heroQuery.isError || categoriesQuery.isError || productsQuery.isError;

  const refetchAll = () => {
    heroQuery.refetch();
    categoriesQuery.refetch();
    productsQuery.refetch();
  };

  return {
    hero: heroQuery.data,
    categories: categoriesQuery.data,
    products: productsQuery.data,
    isLoading,
    isError,
    refetchAll,
  };
};