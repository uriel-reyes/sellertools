import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery, useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// GraphQL query to fetch product discounts
const GET_PRODUCT_DISCOUNTS_QUERY = gql`
  query GetProductDiscounts {
    productDiscounts {
      results {
        id
        version
        createdAt
        lastModifiedAt
        isActive
        name(locale: "en-US")
        description(locale: "en-US")
        predicate
        validFrom
        validUntil
        sortOrder
        key
        value {
          ... on RelativeDiscountValue {
            __typename
            permyriad
            type
          }
          ... on AbsoluteDiscountValue {
            __typename
            money {
              centAmount
              currencyCode
              fractionDigits
              type
            }
            type
          }
        }
      }
    }
  }
`;

// GraphQL mutation to create a new product discount
const CREATE_PRODUCT_DISCOUNT_MUTATION = gql`
  mutation CreateProductDiscount($draft: ProductDiscountDraft!) {
    createProductDiscount(draft: $draft) {
      id
      version
      createdAt
      lastModifiedAt
      name(locale: "en-US")
      description(locale: "en-US")
      isActive
      predicate
      validFrom
      validUntil
      sortOrder
      value {
        ... on RelativeDiscountValue {
          __typename
          permyriad
          type
        }
        ... on AbsoluteDiscountValue {
          __typename
          money {
            centAmount
            currencyCode
            fractionDigits
            type
          }
          type
        }
      }
    }
  }
`;

// Define the interface for the promotion data structure
interface PromotionData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  predicate: string;
  channelKey: string | null; // Added field to store extracted channel key
  valueAmount: string;
  sortOrder: string;
  key: string | null;
}

// Define the interface for creating a new product discount
interface CreateProductDiscountInput {
  name: string;
  description?: string;
  channelKey: string;
  predicate: string;
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  // For percentage discounts, value is in % (e.g., 10 for 10%)
  // For absolute discounts, value is in cents (e.g., 1000 for $10.00)
  currencyCode?: string; // Required for absolute discounts
  isActive?: boolean;
  sortOrder?: string;
  key?: string;
}

// GraphQL response types
interface ProductDiscountResult {
  id: string;
  isActive: boolean;
  name: string;
  description?: string;
  predicate: string;
  value: {
    __typename: string;
    type: string;
    money?: Array<{
      centAmount: number;
      currencyCode: string;
    }>;
    permyriad?: number;
  };
  sortOrder: string;
  key: string | null;
}

interface ProductDiscountsResponse {
  results: ProductDiscountResult[];
}

interface PromotionsQueryResult {
  productDiscounts: ProductDiscountsResponse;
}

interface QueryResponse {
  data: PromotionsQueryResult;
}

// Create product discount response
interface CreateProductDiscountResult {
  createProductDiscount: ProductDiscountResult;
}

// Define the hook result interface
interface UsePromotionsResult {
  fetchPromotions: (channelKey: string) => Promise<PromotionData[]>;
  createProductDiscount: (input: CreateProductDiscountInput) => Promise<ProductDiscountResult | null>;
  loading: boolean;
  error: Error | null;
}

const usePromotions = (): UsePromotionsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  const { refetch } = useMcQuery<PromotionsQueryResult>(GET_PRODUCT_DISCOUNTS_QUERY, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const [runCreateMutation] = useMcMutation<CreateProductDiscountResult>(
    CREATE_PRODUCT_DISCOUNT_MUTATION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  // Extract channel key from predicate
  const extractChannelKey = (predicate: string): string | null => {
    // Handle empty predicate
    if (!predicate) {
      return null;
    }
    
    // Try to match channel.key = "key" pattern
    const match = predicate.match(/channel\.key\s*=\s*["']([^"']+)["']/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Try to match other potential patterns
    const altMatch = predicate.match(/channel\s*\(\s*key\s*=\s*["']([^"']+)["']\s*\)/);
    if (altMatch && altMatch[1]) {
      return altMatch[1];
    }
    
    return null;
  };

  const fetchPromotions = useCallback(
    async (channelKey: string): Promise<PromotionData[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching product discounts`);
        const response = await refetch();

        // Safely access data with optional chaining
        const results = response?.data?.productDiscounts?.results || [];
        
        if (results.length > 0) {
          // Filter results to only include those with a matching channel key
          const filteredResults = results.filter((item: ProductDiscountResult) => {
            const itemChannelKey = extractChannelKey(item.predicate);
            return itemChannelKey === channelKey;
          });
          
          const promotions = filteredResults.map((item: ProductDiscountResult) => {
            // Process discount value information
            let valueAmount = '';
            
            if (item.value) {
              if (item.value.__typename === 'AbsoluteDiscountValue') {
                if (item.value.money && item.value.money.length > 0) {
                  const { centAmount, currencyCode } = item.value.money[0];
                  valueAmount = formatCurrency(centAmount, currencyCode);
                }
              } else if (item.value.__typename === 'RelativeDiscountValue') {
                if (item.value.permyriad !== undefined) {
                  valueAmount = formatPercentage(item.value.permyriad);
                }
              }
            }
            
            return {
              id: item.id,
              name: item.name || 'Unnamed Promotion',
              description: item.description || '',
              isActive: item.isActive || false,
              predicate: item.predicate || 'No conditions',
              channelKey: extractChannelKey(item.predicate),
              valueAmount,
              sortOrder: item.sortOrder || '0',
              key: item.key,
            };
          });

          console.log(`Successfully processed ${promotions.length} product discounts for channel ${channelKey}`);
          return promotions;
        }
        
        return [];
      } catch (err) {
        console.error('Error fetching product discounts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const createProductDiscount = useCallback(
    async (input: CreateProductDiscountInput): Promise<ProductDiscountResult | null> => {
      setLoading(true);
      setError(null);
      
      try {
        // Build the predicate that includes the channel key
        const predicate = input.predicate || `channel.key = "${input.channelKey}"`;
        
        // Format values according to the required GraphQL schema
        // For relative (percentage) discounts
        let value;
        if (input.discountType === 'percentage') {
          value = {
            relative: {
              permyriad: input.discountValue * 100, // Convert percentage to permyriad (e.g., 10% becomes 1000)
            }
          };
        } else {
          // For absolute discounts
          if (!input.currencyCode) {
            throw new Error('Currency code is required for absolute discounts');
          }
          
          value = {
            absolute: {
              money: [{
                currencyCode: input.currencyCode,
                centAmount: input.discountValue,
              }]
            }
          };
        }
        
        // Build the draft object with the correct structure
        const draft = {
          name: [
            {
              locale: "en-US", // Note the locale format must match what the API expects (en-US not en-us)
              value: input.name
            }
          ],
          description: input.description ? [
            {
              locale: "en-US",
              value: input.description
            }
          ] : undefined,
          predicate,
          value,
          isActive: input.isActive !== undefined ? input.isActive : true,
          sortOrder: input.sortOrder || '0.5',
          key: input.key,
        };
        
        console.log('Product discount draft:', JSON.stringify(draft, null, 2));
        
        // Execute the mutation
        const response = await runCreateMutation({
          variables: {
            draft,
          },
        });
        
        return response.data?.createProductDiscount || null;
      } catch (err) {
        console.error('Error creating product discount:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [runCreateMutation]
  );

  const formatCurrency = (centAmount: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(centAmount / 100); // Convert cent amount to dollars
  };

  const formatPercentage = (permyriad: number): string => {
    // Convert permyriad to percentage (permyriad is 1/10000, so divide by 100 to get percentage)
    return `${(permyriad / 100).toFixed(2)}%`; // Convert permyriad to percentage
  };

  return {
    fetchPromotions,
    createProductDiscount,
    loading,
    error,
  };
};

export default usePromotions;