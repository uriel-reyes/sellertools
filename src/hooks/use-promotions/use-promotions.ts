import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery, useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// GraphQL query to fetch promotions for a specific store
const GET_PROMOTIONS_QUERY = gql`
  query GetPromotions($storeKey: KeyReferenceInput!) {
    inStore(key: $storeKey) {
      cartDiscounts {
        results {
          id
          isActive
          name(locale: "en-us")
          description(locale: "en-us")
          cartPredicate
          target {
            ... on CartDiscountTotalPriceTarget {
              __typename
              type
            }
            ... on LineItemsTarget {
              __typename
              predicate
              type
            }
          }
          value {
            type
            ... on AbsoluteCartDiscountValue {
              __typename
              money {
                centAmount
                currencyCode
              }
            }
            ... on RelativeDiscountValue {
              __typename
              permyriad
            }
          }
        }
      }
    }
  }
`;

// GraphQL mutation to create a new cart discount
const CREATE_CART_DISCOUNT_MUTATION = gql`
  mutation CreateCartDiscount($draft: CartDiscountDraft!) {
    createCartDiscount(draft: $draft) {
      id
      name(locale: "en-us")
      description(locale: "en-us")
      isActive
      cartPredicate
      target {
        ... on CartDiscountTotalPriceTarget {
          __typename
          type
        }
        ... on LineItemsTarget {
          __typename
          predicate
          type
        }
      }
      value {
        type
        ... on AbsoluteCartDiscountValue {
          __typename
          money {
            centAmount
            currencyCode
          }
        }
        ... on RelativeDiscountValue {
          __typename
          permyriad
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
  cartPredicate: string;
  targetType: string;
  targetDetails: string;
  valueAmount: string;
}

// Define the interface for creating a new cart discount
interface CreateCartDiscountInput {
  name: string;
  description?: string;
  storeKey: string;
  lineItemPredicate: string;
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  // For percentage discounts, value is in % (e.g., 10 for 10%)
  // For absolute discounts, value is in cents (e.g., 1000 for $10.00)
  currencyCode?: string; // Required for absolute discounts
  isActive?: boolean;
  sortOrder?: string; // Add sortOrder field
}

// GraphQL response types
interface CartDiscountResult {
  id: string;
  isActive: boolean;
  name: string;
  description?: string;
  cartPredicate: string;
  target?: {
    __typename: string;
    type: string;
    predicate?: string;
  };
  value: {
    __typename: string;
    type: string;
    money?: Array<{
      centAmount: number;
      currencyCode: string;
    }>;
    permyriad?: number;
  };
}

interface CartDiscountsResponse {
  results: CartDiscountResult[];
}

interface InStoreResponse {
  cartDiscounts: CartDiscountsResponse;
}

interface PromotionsQueryResult {
  inStore: InStoreResponse;
}

interface QueryResponse {
  data: PromotionsQueryResult;
}

// Create cart discount response
interface CreateCartDiscountResult {
  createCartDiscount: CartDiscountResult;
}

// Define the hook result interface
interface UsePromotionsResult {
  fetchPromotions: (storeKey: string) => Promise<PromotionData[]>;
  createCartDiscount: (input: CreateCartDiscountInput) => Promise<CartDiscountResult | null>;
  loading: boolean;
  error: Error | null;
}

const usePromotions = (): UsePromotionsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  const { refetch } = useMcQuery<PromotionsQueryResult>(GET_PROMOTIONS_QUERY, {
    variables: {
      storeKey: "placeholder", // Will be overridden in fetchPromotions
    },
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip initial query, we'll trigger it manually
  });

  const [runCreateMutation] = useMcMutation<CreateCartDiscountResult>(
    CREATE_CART_DISCOUNT_MUTATION,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const fetchPromotions = useCallback(
    async (storeKey: string): Promise<PromotionData[]> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching promotions for store key: ${storeKey}`);
        const response = await refetch({
          storeKey: storeKey,
        });

        // Safely access data with optional chaining
        const results = response?.data?.inStore?.cartDiscounts?.results || [];
        
        if (results.length > 0) {
          const promotions = results.map((item: CartDiscountResult) => {
            // Process target information
            let targetType = 'Unknown';
            let targetDetails = '';
            
            if (item.target) {
              if (item.target.__typename === 'CartDiscountTotalPriceTarget') {
                targetType = 'Total Price';
                targetDetails = 'Applies to entire cart';
              } else if (item.target.__typename === 'LineItemsTarget') {
                targetType = 'Line Items';
                targetDetails = item.target.predicate || 'All line items';
              }
            }
            
            // Process discount value information
            let valueAmount = '';
            
            if (item.value) {
              if (item.value.__typename === 'AbsoluteCartDiscountValue') {
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
              cartPredicate: item.cartPredicate || 'No conditions',
              targetType,
              targetDetails,
              valueAmount,
            };
          });

          console.log(`Successfully processed ${promotions.length} promotions for store ${storeKey}`);
          return promotions;
        }

        console.log(`No promotions found for store ${storeKey}`);
        return [];
      } catch (err) {
        console.error(`Error fetching promotions for store ${storeKey}:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error loading promotions for store ${storeKey}`));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const createCartDiscount = useCallback(
    async (input: CreateCartDiscountInput): Promise<CartDiscountResult | null> => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Creating cart discount for store: ${input.storeKey}`);
        
        // Prepare the draft object for the mutation
        const discountDraft: any = {
          name: [
            {
              locale: "en-US",
              value: input.name
            }
          ],
          isActive: input.isActive ?? true,
          stores: {
            typeId: "store",
            key: input.storeKey
          },
          sortOrder: input.sortOrder || "0.5", // Default to middle priority if not specified
          cartPredicate: "1=1", // Apply to all carts that match the target
        };

        // Add description if provided
        if (input.description) {
          discountDraft.description = [
            {
              locale: "en-US",
              value: input.description
            }
          ];
        }

        // Configure the target properly
        discountDraft.target = {
          lineItems: {
            predicate: input.lineItemPredicate
          }
        };

        // Set the value based on discount type
        if (input.discountType === 'percentage') {
          // Convert percentage to permyriad (e.g., 10% -> 1000)
          const permyriad = input.discountValue * 100;
          discountDraft.value = {
            relative: {
              permyriad
            }
          };
        } else {
          // Absolute discount requires a currency code
          if (!input.currencyCode) {
            throw new Error("Currency code is required for absolute discounts");
          }
          
          // For absolute discounts, the value could be in dollars (e.g., 12.25)
          // but centAmount needs to be an integer in cents (1225)
          const centAmount = Math.round(input.discountValue * 100);
          
          discountDraft.value = {
            absolute: {
              money: [{
                currencyCode: input.currencyCode,
                centAmount
              }]
            }
          };
        }

        console.log('Discount draft:', discountDraft);

        // Execute the mutation
        const result = await runCreateMutation({
          variables: {
            draft: discountDraft
          }
        });

        if (result?.data?.createCartDiscount) {
          console.log(`Successfully created discount: ${result.data.createCartDiscount.id}`);
          return result.data.createCartDiscount;
        }

        return null;
      } catch (err) {
        console.error(`Error creating cart discount:`, err);
        setError(err instanceof Error ? err : new Error(`Unknown error creating cart discount`));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [runCreateMutation]
  );

  // Helper function to format currency amounts
  const formatCurrency = (centAmount: number, currencyCode: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(centAmount / 100); // Convert from cents to dollars
  };

  // Helper function to format percentage values
  const formatPercentage = (permyriad: number): string => {
    return `${(permyriad / 100).toFixed(2)}%`; // Convert permyriad to percentage
  };

  return {
    fetchPromotions,
    createCartDiscount,
    loading,
    error,
  };
};

export default usePromotions;