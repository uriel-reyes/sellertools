import { useMcMutation, useMcQuery } from '@commercetools-frontend/application-shell';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { TState } from '@commercetools-uikit/hooks';
import gql from 'graphql-tag';
import { useCallback, useState } from 'react';
import logger from '../../utils/logger';

// Define GraphQL response types
interface ProductSelectionResponse {
  productSelection?: {
    id: string;
    version: number;
    productRefs?: {
      results: Array<{
        product: {
          id: string;
          masterData: {
            current: {
              name: string;
              masterVariant: {
                images?: Array<{ url: string }>;
                sku?: string;
                key?: string;
              };
            };
          };
        };
      }>;
    };
  };
}

interface CreateProductResponse {
  createProduct?: {
    id: string;
    version: number;
  };
}

// New interface for product search response
interface ProductSearchResponse {
  productProjectionSearch: {
    results: Array<{
      id: string;
      nameAllLocales: Array<{
        locale: string;
        value: string;
      }>;
      masterVariant: {
        id?: string;
        sku?: string;
        key?: string;
        isMatchingVariant?: boolean;
        images?: Array<{ url: string; label?: string }>;
      };
      variants?: Array<{
        id: string;
        sku?: string;
        key?: string;
        images?: Array<{ url: string; label?: string }>;
      }>;
    }>;
  };
}

// Define SearchFilterInput type
interface SearchFilterInput {
  model: string;
  value: any;
}

// GraphQL query to fetch products from product selection with dynamic key
const GET_STORE_PRODUCTS_QUERY = gql`
  query GetProductSelection($storeKey: String!, $limit: Int, $offset: Int) {
    productSelection(key: $storeKey) {
      id
      productRefs (limit: $limit, offset: $offset) {
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

// GraphQL query to search for products
const SEARCH_PRODUCTS_QUERY = gql`
  query ProductSearch($text: String, $filter: [SearchFilterInput!]) {
    productProjectionSearch(
      markMatchingVariants: true
      text: $text
      filters: $filter
      locale: "en-US"
      limit: 20
      fuzzy: true
    ) {
      results {
        id
        nameAllLocales {
          locale
          value
        }
        masterVariant {
          sku
          images {
            url
          }
        }
      }
    }
  }
`;

// GraphQL mutation to create a product
const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($draft: ProductDraft!) {
    createProduct(draft: $draft) {
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
  createProduct: (productDraft: any) => Promise<boolean>;
  searchProducts: (searchText: string, filters?: SearchFilterInput[]) => Promise<ProductData[]>;
  loading: boolean;
  error: Error | null;
}

const useStoreProducts = ({page, perPage}: {page?: TState, perPage?: TState}): UseStoreProductsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-us',
  }));

  const { refetch } = useMcQuery(GET_STORE_PRODUCTS_QUERY, {

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

  const { refetch: searchProducts } = useMcQuery(SEARCH_PRODUCTS_QUERY, {
    variables: {
      text: '',
      filter: [] as SearchFilterInput[],
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
  
  const [createProductMutation] = useMcMutation(CREATE_PRODUCT_MUTATION, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const fetchStoreProducts = useCallback(
    async (storeKey: string): Promise<ProductData[]> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(`Fetching products for store: ${storeKey}`);
        const { data } = await refetch({
          storeKey,
          limit: perPage?.value,
          offset: page?.value,
        }) as { data: ProductSelectionResponse };

        if (
          data?.productSelection?.productRefs?.results &&
          Array.isArray(data.productSelection.productRefs.results)
        ) {
          const products = data.productSelection.productRefs.results.map(
            (item, index) => {
              const product = item.product;
              
              // Get the image URL with better fallbacks
              let imageUrl = 'https://via.placeholder.com/80';
              const masterVariant = product.masterData.current.masterVariant;
              
              if (masterVariant.images && masterVariant.images.length > 0) {
                imageUrl = masterVariant.images[0].url;
              }
              
              // Add cache busting parameter to prevent browser caching issues
              if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
                // Add a unique timestamp and random parameter to prevent caching
                const cacheBuster = `_cb=${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`;
                imageUrl = imageUrl.includes('?') 
                  ? `${imageUrl}&${cacheBuster}` 
                  : `${imageUrl}?${cacheBuster}`;
              }
              
              // Get the best SKU with fallbacks
              const sku = masterVariant.sku || masterVariant.key || 'No SKU';
              
              return {
                id: product.id,
                name: product.masterData.current.name || 'Unnamed product',
                image: imageUrl,
                sku,
              };
            }
          );

          logger.info(`Successfully fetched ${products.length} products for store ${storeKey}`);
          return products;
        }

        logger.info(`No products found for store ${storeKey}`);
        return [];
      } catch (err) {
        logger.error(`Error fetching products for store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error loading products for store ${storeKey}`));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [dataLocale, refetch, perPage?.value, page?.value]
  );

  const addProductsToStore = useCallback(
    async (storeKey: string, productIds: string[]): Promise<boolean> => {
      if (!productIds.length) {
        logger.warn('No products selected to add');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        logger.info(`Adding ${productIds.length} products to store ${storeKey}`);
        
        // Step 1: Get the product selection ID and version
        const { data: selectionData } = await getProductSelectionByKey({
          key: storeKey,
        }) as { data: ProductSelectionResponse };
        
        if (!selectionData?.productSelection?.id) {
          throw new Error(`Product selection for store ${storeKey} not found`);
        }
        
        const selectionId = selectionData.productSelection.id;
        const version = selectionData.productSelection.version;
        
        logger.info(`Found product selection: ${selectionId} (version ${version})`);
        
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
        
        logger.info('Product selection updated successfully:', result);
        return true;
      } catch (err) {
        logger.error(`Error adding products to store ${storeKey}:`, err);
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
        logger.warn('No products selected to remove');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        logger.info(`Removing ${productIds.length} products from store ${storeKey}`);
        
        // Step 1: Get the product selection ID and version
        const { data: selectionData } = await getProductSelectionByKey({
          key: storeKey,
        }) as { data: ProductSelectionResponse };
        
        if (!selectionData?.productSelection?.id) {
          throw new Error(`Product selection for store ${storeKey} not found`);
        }
        
        const selectionId = selectionData.productSelection.id;
        const version = selectionData.productSelection.version;
        
        logger.info(`Found product selection: ${selectionId} (version ${version})`);
        
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
        
        logger.info('Products successfully removed from selection:', result);
        return true;
      } catch (err) {
        logger.error(`Error removing products from store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error removing products from store ${storeKey}`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getProductSelectionByKey, updateProductSelection]
  );

  // Function to create a new product
  const createProduct = async (productDraft: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add priceMode: Embedded to match the working example
      const finalProductDraft = {
        ...productDraft,
        priceMode: "Embedded"
      };
      
      logger.info('Creating product with data:', JSON.stringify(finalProductDraft, null, 2));
      
      // Step 1: Create the product using the GraphQL mutation
      const result = await createProductMutation({
        variables: {
          draft: finalProductDraft
        }
      }).catch((error) => {
        // Extract GraphQL specific error details
        const graphqlErrors = error.graphQLErrors || [];
        
        if (graphqlErrors.length > 0) {
          const errorDetails = graphqlErrors.map((err: any) => {
            logger.error('GraphQL error details:', JSON.stringify(err, null, 2));
            return `${err.message}${err.extensions?.code ? ` (${err.extensions.code})` : ''}`;
          }).join('\n');
          logger.error('GraphQL errors:', errorDetails);
          throw new Error(`Failed to create product: ${errorDetails}`);
        } else if (error.networkError) {
          logger.error('Network error:', error.networkError);
          throw new Error('Network error when creating product. Please try again.');
        } else {
          logger.error('Unexpected error:', error);
          throw error;
        }
      });
      
      // Type assertion to handle TypeScript type safety
      const data = result.data as CreateProductResponse;
      
      if (!data?.createProduct?.id) {
        throw new Error('Failed to create product: No product ID returned');
      }
      
      const productId = data.createProduct.id;
      logger.info('Product created successfully with ID:', productId);
      
      // Step 2: Add the product to the store's product selection if a channel key is provided
      if (productDraft.masterVariant.prices?.[0]?.channel?.key) {
        const storeKey = productDraft.masterVariant.prices[0].channel.key;
        
        // Add the newly created product to the store's product selection
        await addProductsToStore(storeKey, [productId]);
        logger.info(`Product ${productId} added to store ${storeKey}`);
      } else {
        logger.warn('No channel key found in product draft, skipping add to product selection');
      }
      
      return true;
    } catch (err) {
      logger.error('Error creating product:', err);
      setError(err instanceof Error ? err : new Error('Unknown error creating product'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const searchProductsFunc = useCallback(
    async (searchText: string, filters?: SearchFilterInput[]): Promise<ProductData[]> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(`Searching products with text: "${searchText}"`);
        const response = await searchProducts({
          text: searchText,
          filter: filters || []
        }) as { data: ProductSearchResponse };
        
        const { data } = response;
        
        // Log the raw response for debugging
        logger.info('Raw search response data structure:', 
          JSON.stringify(data?.productProjectionSearch?.results?.[0] || {}, null, 2)
        );

        if (
          data?.productProjectionSearch?.results &&
          Array.isArray(data.productProjectionSearch.results)
        ) {
          logger.info(`Search found ${data.productProjectionSearch.results.length} products`);
          
          const products = data.productProjectionSearch.results.map(
            (product, index) => {
              logger.info(`Processing product ${index + 1}/${data.productProjectionSearch.results.length}, ID: ${product.id}`);
              
              // Extract name from nameAllLocales, preferring en-US
              let productName = 'Unnamed product';
              if (product.nameAllLocales && product.nameAllLocales.length > 0) {
                logger.info(`nameAllLocales for product ${product.id}:`, 
                  JSON.stringify(product.nameAllLocales, null, 2)
                );
                
                // Try to find the en-US locale first
                const enUsName = product.nameAllLocales.find(name => name.locale === 'en-US');
                if (enUsName) {
                  productName = enUsName.value;
                  logger.info(`Using en-US locale name: "${productName}"`);
                } else {
                  // Fallback to first name if en-US not available
                  productName = product.nameAllLocales[0].value;
                  logger.info(`No en-US locale found, using first available: "${productName}"`);
                }
              } else {
                logger.info(`No nameAllLocales found for product ${product.id}`);
              }
              
              // Get image URL from masterVariant
              let imageUrl = 'https://via.placeholder.com/80';
              if (product.masterVariant?.images && product.masterVariant.images.length > 0) {
                imageUrl = product.masterVariant.images[0].url;
                logger.info(`Found image URL: ${imageUrl}`);
              } else {
                logger.info(`No images found, using placeholder`);
              }
              
              // Add cache busting parameter with product ID to ensure uniqueness
              if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
                const productSpecificId = `product_${product.id}`;
                const cacheBuster = `_cb=${Date.now()}_${productSpecificId}_${Math.random().toString(36).substring(2, 8)}`;
                imageUrl = imageUrl.includes('?') 
                  ? `${imageUrl}&${cacheBuster}` 
                  : `${imageUrl}?${cacheBuster}`;
              }
              
              const result = {
                id: product.id,
                name: productName,
                image: imageUrl,
                sku: product.masterVariant?.sku || 'No SKU',
              };
              
              logger.info(`Final product data:`, result);
              return result;
            }
          );

          return products;
        }

        logger.info('No products found in search');
        return [];
      } catch (err) {
        logger.error(`Error searching products:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error searching products`));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [searchProducts]
  );

  return {
    fetchStoreProducts,
    addProductsToStore,
    removeProductsFromStore,
    createProduct,
    searchProducts: searchProductsFunc,
    loading,
    error,
  };
};

export default useStoreProducts; 