import { TState, usePaginationState } from '@commercetools-uikit/hooks';
import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import logger from '../../utils/logger';
import { ProductData } from './products';

interface ProductsContextType {
  fetchUserStoreProducts: () => Promise<void>;
  handleStoreProductSelection: (productId: string) => void;
  handleStoreSearch: () => void;
  setFilteredStoreProducts: (products: ProductData[]) => void;
  storeSearchQuery: string;
  storeProducts: ProductData[];
  setStoreSearchQuery: Dispatch<SetStateAction<string>>;
  filteredStoreProducts: ProductData[];
  selectedStoreProducts: string[];
  isStoreSearching: boolean;
  isRemovingProducts: boolean;
  isStoreProductsLoading: boolean;
  storeProductsError: Error | null;
  handleRemoveProductsFromStore: () => Promise<void>;
  page: TState;
  perPage: TState;
}

const StoreProductsContext = createContext<ProductsContextType | null>(null);

export const useStoreProductContext = () => {
  const context = useContext(StoreProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

interface ProductsProviderProps {
  children: ReactNode;
  storeKey: string;
}

export const StoreProductsProvider: React.FC<ProductsProviderProps> = ({
  children,
  storeKey,
}) => {
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [isStoreSearching, setIsStoreSearching] = useState(false);
  const [filteredStoreProducts, setFilteredStoreProducts] = useState<
    ProductData[]
  >([]);
  const [selectedStoreProducts, setSelectedStoreProducts] = useState<string[]>(
    []
  );
  const [storeProductsError, setStoreProductsError] = useState<Error | null>(
    null
  );
  const [isRemovingProducts, setIsRemovingProducts] = useState(false);
  const [storeProducts, setStoreProducts] = useState<ProductData[]>([]);
  const [isStoreProductsLoading, setIsStoreProductsLoading] = useState(false);

  const { page, perPage } = usePaginationState();
  const { fetchStoreProducts, removeProductsFromStore } = useStoreProducts({
    page,
    perPage,
  });

  const handleStoreSearch = () => {
    if (!storeSearchQuery.trim()) {
      setFilteredStoreProducts(storeProducts);
      return;
    }

    setIsStoreSearching(true);

    try {
      // Simple client-side filtering for store products
      const searchTermLower = storeSearchQuery.toLowerCase();
      logger.info(`Filtering store products with query: "${searchTermLower}"`);

      const filtered = storeProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTermLower) ||
          product.sku.toLowerCase().includes(searchTermLower)
      );

      logger.info(
        `Found ${filtered.length} store products matching "${storeSearchQuery}"`
      );

      // Update store products with filtered results
      setFilteredStoreProducts(filtered);
    } catch (error) {
      logger.error('Error during store product filtering:', error);
    } finally {
      setIsStoreSearching(false);
    }
  };

  const handleStoreProductSelection = (productId: string) => {
    setSelectedStoreProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleRemoveProductsFromStore = async () => {
    if (!selectedStoreProducts.length) return;

    setIsRemovingProducts(true);
    try {
      const success = await removeProductsFromStore(
        storeKey!,
        selectedStoreProducts
      );

      if (success) {
        // Refresh the store products to show the updated list
        await fetchUserStoreProducts();
        // Clear selections after successful removal
        setSelectedStoreProducts([]);
      }
    } catch (err) {
      logger.error('Error removing products from store:', err);
    } finally {
      setIsRemovingProducts(false);
    }
  };
  const fetchUserStoreProducts = async () => {
    if (!storeKey) return;

    setIsStoreProductsLoading(true);
    setStoreProductsError(null);

    try {
      logger.info(`Fetching products for user store: ${storeKey}`);
      const result = await fetchStoreProducts(storeKey);

      if (result) {
        logger.info(
          `Fetched ${result.length} products from user store: ${storeKey}`
        );
        setStoreProducts(result);
      } else {
        logger.info(`No products returned for user store: ${storeKey}`);
        setStoreProducts([]);
      }
    } catch (err) {
      logger.error(`Error fetching products for store ${storeKey}:`, err);
      setStoreProductsError(
        err instanceof Error
          ? err
          : new Error(`Unknown error fetching products for store ${storeKey}`)
      );
    } finally {
      setIsStoreProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStoreProducts();
  }, [storeKey, fetchStoreProducts]);

  useEffect(() => {
    setStoreProducts((prev) =>
      prev.map((product) => ({
        ...product,
        isSelected: selectedStoreProducts.includes(product.id),
      }))
    );
  }, [selectedStoreProducts]);

  useEffect(() => {
    setFilteredStoreProducts(storeProducts);
  }, [storeProducts]);

  const value = {
    fetchUserStoreProducts,
    handleStoreProductSelection,
    handleStoreSearch,
    setFilteredStoreProducts,
    storeSearchQuery,
    setStoreSearchQuery,
    filteredStoreProducts,
    selectedStoreProducts,
    isStoreSearching,
    isRemovingProducts,
    isStoreProductsLoading,
    storeProductsError,
    storeProducts,
    handleRemoveProductsFromStore,
    page,
    perPage,
  };

  return (
    <StoreProductsContext.Provider value={value}>
      {children}
    </StoreProductsContext.Provider>
  );
};

export const useProductWrapper = () => {
  const context = useContext(StoreProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export default function ProductsWrapper({
  children,
  storeKey,
}: {
  children: ReactNode;
  storeKey: string;
}) {
  return (
    <StoreProductsProvider storeKey={storeKey}>
      {children}
    </StoreProductsProvider>
  );
}
