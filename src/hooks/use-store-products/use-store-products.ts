import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery } from '@commercetools-frontend/application-shell';
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
  loading: boolean;
  error: Error | null;
}

const useStoreProducts = (): UseStoreProductsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  // Use the query hook instead of mutation hook
  const { refetch } = useMcQuery(
    GET_STORE_PRODUCTS_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      // Pass default variables
      variables: {
        storeKey: "master-store" // Default to master store
      },
      // Skip initial automatic fetch
      skip: true, 
    }
  );

  const fetchStoreProducts = useCallback(
    async (storeKey: string): Promise<ProductData[]> => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching products for store "${storeKey}" with locale "${dataLocale}"`);
        
        // Use refetch to manually trigger the query with updated variables
        const result = await refetch({
          storeKey: storeKey
        });
        const data = result.data as any;
        
        if (!data || !data.productSelection || !data.productSelection.productRefs) {
          console.log(`No product data returned for store key: ${storeKey}`);
          return [];
        }
        
        // Transform the data
        const products = data.productSelection.productRefs.results.map((item: any) => {
          const product = item.product.masterData.current;
          return {
            id: item.product.id,
            name: product.name,
            image: product.masterVariant.images && product.masterVariant.images.length > 0 
              ? product.masterVariant.images[0].url 
              : '',
            sku: product.masterVariant.sku,
          };
        });
        
        console.log(`Fetched ${products.length} products from product selection for store: ${storeKey}`);
        return products;
        
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

  return {
    fetchStoreProducts,
    loading: loading,
    error: error,
  };
};

export default useStoreProducts; 