import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery, useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';
import logger from '../../utils/logger';
import { TDataTableSortingState, TState } from '@commercetools-uikit/hooks';

// GraphQL query to fetch products with their prices (both current and staged)
const GET_PRODUCTS_WITH_PRICES = gql`
  query GetProductsWithPrices($storeKey: String!) {
    productSelection(key: $storeKey) {
      productRefs {
        results {
          product {
            id
            version
            masterData {
              current {
                name(locale: "en-us")
                masterVariant {
                  images {
                    url
                  }
                  sku
                  prices {
                    id
                    value {
                      centAmount
                      currencyCode
                    }
                    channel {
                      id
                      key
                    }
                  }
                }
              }
              staged {
                name(locale: "en-us")
                masterVariant {
                  prices {
                    id
                    value {
                      centAmount
                      currencyCode
                    }
                    channel {
                      id
                      key
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// GraphQL query to get product details including all prices
const GET_PRODUCT_PRICES = gql`
  query GetProductPrices($id: String!) {
    product(id: $id) {
      id
      version
      masterData {
        current {
          masterVariant {
            prices {
              id
              value {
                centAmount
                currencyCode
              }
              channel {
                id
                key
              }
            }
          }
        }
        staged {
          masterVariant {
            prices {
              id
              value {
                centAmount
                currencyCode
              }
              channel {
                id
                key
              }
            }
          }
        }
      }
    }
  }
`;

// GraphQL mutation to update product prices
const UPDATE_PRODUCT_PRICE = gql`
  mutation UpdateProductPrice($id: String!, $version: Long!, $actions: [ProductUpdateAction!]!) {
    updateProduct(id: $id, version: $version, actions: $actions) {
      id
      version
    }
  }
`;

// Type definitions for GraphQL response
interface ProductPrice {
  id: string;
  value: {
    centAmount: number;
    currencyCode: string;
  };
  channel?: {
    id: string;
    key: string;
  };
}

interface ProductVariant {
  images: Array<{ url: string }>;
  sku: string;
  prices?: ProductPrice[];
}

interface ProductDataVersion {
  masterVariant: ProductVariant;
  name?: string;
}

interface ProductMasterData {
  current: ProductDataVersion;
  staged?: ProductDataVersion;
}

interface Product {
  id: string;
  version: number;
  masterData: ProductMasterData;
}

interface ProductRef {
  product: Product;
}

interface ProductSelection {
  productRefs: {
    results: ProductRef[];
  };
}

interface GetProductsWithPricesResponse {
  productSelection: ProductSelection;
}

interface GetProductPricesResponse {
  product: Product;
}

// Response type for update operation
interface UpdateProductResponse {
  updateProduct: {
    id: string;
    version: number;
  };
}

// Product type definition with price information
interface ProductPriceData {
  id: string;
  name: string;
  image: string;
  sku: string;
  version: number;
  currentPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
  masterPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
}

// Define the hook interface
interface UsePriceManagementResult {
  fetchProductsWithPrices: (storeKey: string) => Promise<ProductPriceData[]>;
  updateProductPrice: (productId: string, version: number, price: number, channelKey: string, priceId?: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

const usePriceManagement = ({ page, perPage }: { page?: TState, perPage?: TState}): UsePriceManagementResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext((context) => ({
    dataLocale: context.dataLocale ?? 'en-US',
  }));

  const { refetch } = useMcQuery<GetProductsWithPricesResponse>(GET_PRODUCTS_WITH_PRICES, {
    variables: {
      storeKey: 'placeholder', // This will be overridden in fetchProductsWithPrices
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const { refetch: getProductPrices } = useMcQuery<GetProductPricesResponse>(GET_PRODUCT_PRICES, {
    variables: {
      id: 'placeholder', // This will be overridden in updateProductPrice
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const [updateProduct] = useMcMutation(UPDATE_PRODUCT_PRICE, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const fetchProductsWithPrices = useCallback(
    async (storeKey: string): Promise<ProductPriceData[]> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(`Fetching products with prices for store: ${storeKey}`);
        const { data } = await refetch({
          storeKey,
        });

        if (
          data?.productSelection?.productRefs?.results &&
          Array.isArray(data.productSelection.productRefs.results)
        ) {
          const products = data.productSelection.productRefs.results.map(
            (item) => {
              const product = item.product;
              const currentMasterVariant = product.masterData.current.masterVariant;
              const stagedMasterVariant = product.masterData.staged?.masterVariant;
              
              // Check current prices first
              let storePrice = currentMasterVariant.prices?.find(
                (price) => price.channel?.key === storeKey
              );

              // If no price found in current, check staged prices
              if (!storePrice && stagedMasterVariant?.prices) {
                storePrice = stagedMasterVariant.prices.find(
                  (price) => price.channel?.key === storeKey
                );
                if (storePrice) {
                  logger.info(`Found price in staged data for product ${product.id}`);
                }
              }
              
              // Find master store price
              let masterStorePrice = currentMasterVariant.prices?.find(
                (price) => price.channel?.key === "master-store"
              );
              
              // If no master price found in current, check staged
              if (!masterStorePrice && stagedMasterVariant?.prices) {
                masterStorePrice = stagedMasterVariant.prices.find(
                  (price) => price.channel?.key === "master-store"
                );
              }

              return {
                id: product.id,
                version: product.version,
                name: product.masterData.current.name || 'Unnamed product',
                image: currentMasterVariant.images?.[0]?.url || 'https://via.placeholder.com/80',
                sku: currentMasterVariant.sku || 'No SKU',
                currentPrice: storePrice ? {
                  id: storePrice.id,
                  value: storePrice.value.centAmount / 100, // Convert cents to dollars
                  currencyCode: storePrice.value.currencyCode,
                } : undefined,
                masterPrice: masterStorePrice ? {
                  id: masterStorePrice.id,
                  value: masterStorePrice.value.centAmount / 100, // Convert cents to dollars
                  currencyCode: masterStorePrice.value.currencyCode,
                } : undefined,
              };
            }
          );

          logger.info(`Successfully fetched ${products.length} products with prices for store ${storeKey}`);
          return products;
        }

        logger.info(`No products found for store ${storeKey}`);
        return [];
      } catch (err) {
        logger.error(`Error fetching products with prices for store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error loading products for store ${storeKey}`));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [dataLocale, refetch]
  );

  const updateProductPrice = useCallback(
    async (productId: string, version: number, price: number, channelKey: string, priceId?: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        logger.info(`Updating price for product ${productId} with channel ${channelKey}`);
        
        // Always fetch the product's current prices to ensure we have the latest data
        const { data } = await getProductPrices({
          id: productId,
        });
        
        if (!data || !data.product) {
          throw new Error(`Could not fetch product data for ID ${productId}`);
        }
        
        // Get the latest version from the response
        let latestVersion = data.product.version;
        logger.info(`Initial product version: ${latestVersion}`);
        
        // Check both current and staged variants for existing prices
        const currentPrices = data.product.masterData.current.masterVariant.prices || [];
        const stagedPrices = data.product.masterData.staged?.masterVariant.prices || [];
        
        // First look for a price with matching channel key
        let existingPriceId = priceId;
        
        if (!existingPriceId) {
          // Look in current prices first
          const currentPriceWithChannel = currentPrices.find(p => 
            p.channel?.key === channelKey && p.value.currencyCode === "USD"
          );
          
          if (currentPriceWithChannel) {
            existingPriceId = currentPriceWithChannel.id;
            logger.info(`Found existing price in current variant with ID ${existingPriceId} for channel ${channelKey}`);
          } else {
            // Look in staged prices if not found in current
            const stagedPriceWithChannel = stagedPrices.find(p => 
              p.channel?.key === channelKey && p.value.currencyCode === "USD"
            );
            
            if (stagedPriceWithChannel) {
              existingPriceId = stagedPriceWithChannel.id;
              logger.info(`Found existing price in staged variant with ID ${existingPriceId} for channel ${channelKey}`);
            }
          }
        }
        
        // Convert price to cents
        const priceInCents = Math.round(price * 100);
        
        // STEP 1: If there's an existing price, remove it first in a separate update
        if (existingPriceId) {
          logger.info(`Removing existing price with ID ${existingPriceId} in separate operation`);
          
          // Create remove action
          const removeAction = {
            removePrice: {
              priceId: existingPriceId
            }
          };
          
          // Execute removal as separate operation
          const removeResult = await updateProduct({
            variables: {
              id: productId,
              version: latestVersion,
              actions: [
                removeAction,
                // Publish action to ensure removal is visible
                {
                  publish: {
                    scope: "All"
                  }
                }
              ]
            }
          }) as { data: UpdateProductResponse };
          
          // Update version number for next operation
          latestVersion = removeResult.data.updateProduct.version;
          logger.info(`Price removed. New product version: ${latestVersion}`);
          
          // Small delay to ensure commercetools processes the change
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // STEP 2: Add the new price in a separate operation
        logger.info(`Adding new price for channel ${channelKey} with amount ${priceInCents}`);
        
        const addPriceAction = {
          addPrice: {
            variantId: 1, // Master variant
            price: {
              value: {
                centPrecision: {
                  centAmount: priceInCents,
                  currencyCode: "USD"
                }
              },
              channel: {
                typeId: "channel",
                key: channelKey
              }
            }
          }
        };
        
        // Add publish action to apply changes
        const publishAction = {
          publish: {
            scope: "All"
          }
        };
        
        // Execute the mutation to add the new price
        const result = await updateProduct({
          variables: {
            id: productId,
            version: latestVersion,
            actions: [addPriceAction, publishAction],
          },
        });
        
        logger.info('Product price updated successfully:', result);
        return true;
      } catch (err) {
        logger.error(`Error updating price for product ${productId}:`, err);
        
        // Additional error logging
        if (err instanceof Error) {
          logger.error('Error message:', err.message);
          logger.error('Error stack:', err.stack);
          
          // Try to extract more details if it's an Apollo error
          const anyErr = err as any;
          if (anyErr.graphQLErrors) {
            logger.error('GraphQL Errors:', JSON.stringify(anyErr.graphQLErrors));
          }
          if (anyErr.networkError) {
            logger.error('Network Error:', anyErr.networkError);
          }
        }
        
        setError(err instanceof Error ? err : new Error(`Unknown error updating price for product ${productId}`));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [updateProduct, getProductPrices]
  );

  return {
    fetchProductsWithPrices,
    updateProductPrice,
    loading,
    error,
  };
};

export default usePriceManagement; 