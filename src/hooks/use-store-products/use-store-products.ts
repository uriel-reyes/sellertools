import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery, useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// GraphQL query to fetch products from product selection with dynamic key
const GET_STORE_PRODUCTS_QUERY = gql`
  query GetProductSelection($storeKey: String!) {
    productSelection(key: $storeKey) {
      id
      productRefs {
        results {
          product {
            id
            masterData {
              current {
                name(locale: "en-us")
                masterVariant {
                  images {
                    url
                  }
                  sku
                }
              }
            }
          }
        }
      }
    }
  }
`;

// GraphQL mutation to update product selection
const UPDATE_PRODUCT_SELECTION_MUTATION = gql`
  mutation UpdateProductSelection($id: String!, $version: Long!, $actions: [ProductSelectionUpdateAction!]!) {
    updateProductSelection(id: $id, version: $version, actions: $actions) {
      id
      version
    }
  }
`;

// GraphQL query to get product selection ID and version by key
const GET_PRODUCT_SELECTION_BY_KEY = gql`
  query GetProductSelectionByKey($key: String!) {
    productSelection(key: $key) {
      id
      version
    }
  }
`;

// Product type definition
interface ProductData {
  id: string;
  name: string;
  image: string;
  sku: string;
}

// Define the hook interface
interface UseStoreProductsResult {
  fetchStoreProducts: (storeKey: string) => Promise<ProductData[]>;
  addProductsToStore: (storeKey: string, productIds: string[]) => Promise<boolean>;
  removeProductsFromStore: (storeKey: string, productIds: string[]) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

const useStoreProducts = (): UseStoreProductsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-US',
  }));

  const { refetch } = useMcQuery(GET_STORE_PRODUCTS_QUERY, {
    variables: {
      storeKey: 'placeholder', // This will be overridden in fetchStoreProducts
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const { refetch: getProductSelectionByKey } = useMcQuery(GET_PRODUCT_SELECTION_BY_KEY, {
    variables: {
      key: 'placeholder', // Will be overridden
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const [updateProductSelection] = useMcMutation(UPDATE_PRODUCT_SELECTION_MUTATION, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const fetchStoreProducts = useCallback(
    async (storeKey: string): Promise<ProductData[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching products for store: ${storeKey}`);
        const { data } = await refetch({
          storeKey,
        });

        if (
          data?.productSelection?.productRefs?.results &&
          Array.isArray(data.productSelection.productRefs.results)
        ) {
          const products = data.productSelection.productRefs.results.map(
            (item: any) => {
              const product = item.product;
              return {
                id: product.id,
                name: product.masterData.current.name || 'Unnamed product',
                image: product.masterData.current.masterVariant.images?.[0]?.url || 'https://via.placeholder.com/80',
                sku: product.masterData.current.masterVariant.sku || 'No SKU',
              };
            }
          );

          console.log(`Successfully fetched ${products.length} products for store ${storeKey}`);
          return products;
        }

        console.log(`No products found for store ${storeKey}`);
        return [];
      } catch (err) {
        console.error(`Error fetching products for store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error loading products for store ${storeKey}`));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [dataLocale, refetch]
  );

  const addProductsToStore = useCallback(
    async (storeKey: string, productIds: string[]): Promise<boolean> => {
      if (!productIds.length) {
        console.warn('No products selected to add');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`Adding ${productIds.length} products to store ${storeKey}`);
        
        // Step 1: Get the product selection ID and version
        const { data: selectionData } = await getProductSelectionByKey({
          key: storeKey,
        });
        
        if (!selectionData?.productSelection?.id) {
          throw new Error(`Product selection for store ${storeKey} not found`);
        }
        
        const selectionId = selectionData.productSelection.id;
        const version = selectionData.productSelection.version;
        
        console.log(`Found product selection: ${selectionId} (version ${version})`);
        
        // Step 2: Create actions to add each product
        const actions = productIds.map(productId => ({
          addProduct: {
            product: {
              id: productId,
            },
          },
        }));
        
        // Step 3: Execute the mutation to update the product selection
        const result = await updateProductSelection({
          variables: {
            id: selectionId,
            version,
            actions,
          },
        });
        
        console.log('Product selection updated successfully:', result);
        return true;
      } catch (err) {
        console.error(`Error adding products to store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error adding products to store ${storeKey}`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getProductSelectionByKey, updateProductSelection]
  );

  const removeProductsFromStore = useCallback(
    async (storeKey: string, productIds: string[]): Promise<boolean> => {
      if (!productIds.length) {
        console.warn('No products selected to remove');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`Removing ${productIds.length} products from store ${storeKey}`);
        
        // Step 1: Get the product selection ID and version
        const { data: selectionData } = await getProductSelectionByKey({
          key: storeKey,
        });
        
        if (!selectionData?.productSelection?.id) {
          throw new Error(`Product selection for store ${storeKey} not found`);
        }
        
        const selectionId = selectionData.productSelection.id;
        const version = selectionData.productSelection.version;
        
        console.log(`Found product selection: ${selectionId} (version ${version})`);
        
        // Step 2: Create actions to remove each product
        const actions = productIds.map(productId => ({
          removeProduct: {
            product: {
              id: productId,
            },
          },
        }));
        
        // Step 3: Execute the mutation to update the product selection
        const result = await updateProductSelection({
          variables: {
            id: selectionId,
            version,
            actions,
          },
        });
        
        console.log('Products successfully removed from selection:', result);
        return true;
      } catch (err) {
        console.error(`Error removing products from store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error removing products from store ${storeKey}`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getProductSelectionByKey, updateProductSelection]
  );

  return {
    fetchStoreProducts,
    addProductsToStore,
    removeProductsFromStore,
    loading,
    error,
  };
};

export default useStoreProducts; 