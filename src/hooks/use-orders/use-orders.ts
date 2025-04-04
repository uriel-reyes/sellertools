import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery, useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

interface Order {
  id: string;
  version: number;
  orderNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  orderState: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  lineItems?: Array<any>;
  shippingAddress?: any;
  billingAddress?: any;
}

interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// GraphQL query to fetch store orders
const GET_STORE_ORDERS = gql`
  query GetStoreOrders($where: String, $sort: [String!]) {
    orders(where: $where, sort: $sort) {
      results {
        id
        version
        orderNumber
        createdAt
        totalPrice {
          centAmount
          currencyCode
        }
        orderState
        customerId
        customerEmail
      }
    }
  }
`;

// GraphQL query to fetch a single order with details
const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: String!, $locale: Locale!) {
    order(id: $id) {
      id
      version
      orderNumber
      createdAt
      lastModifiedAt
      totalPrice {
        centAmount
        currencyCode
      }
      orderState
      customerId
      customerEmail
      lineItems {
        id
        name(locale: $locale)
        productId
        quantity
        variant {
          images {
            url
          }
        }
        price {
          value {
            centAmount
            currencyCode
          }
        }
        totalPrice {
          centAmount
          currencyCode
        }
      }
      shippingAddress {
        firstName
        lastName
        streetName
        streetNumber
        city
        postalCode
        country
      }
      billingAddress {
        firstName
        lastName
        streetName
        streetNumber
        city
        postalCode
        country
      }
    }
  }
`;

// GraphQL query to fetch customer details
const GET_CUSTOMER_BY_ID = gql`
  query GetCustomerById($id: String!) {
    customer(id: $id) {
      id
      firstName
      lastName
      email
    }
  }
`;

// GraphQL mutation to update order state
const UPDATE_ORDER_STATE = gql`
  mutation UpdateOrderState($id: String!, $version: Long!, $actions: [OrderUpdateAction!]!) {
    updateOrder(id: $id, version: $version, actions: $actions) {
      id
      version
      orderState
    }
  }
`;

interface OrdersResponse {
  orders: {
    results: Array<Order>;
  };
}

interface OrderDetailResponse {
  order: Order;
}

interface CustomerResponse {
  customer: Customer;
}

interface UseOrdersHook {
  fetchOrdersByStore: (storeKey: string) => Promise<Order[]>;
  fetchOrderById: (orderId: string) => Promise<Order | null>;
  fetchCustomerById: (customerId: string) => Promise<Customer | null>;
  updateOrderState: (orderId: string, version: number, newState: string) => Promise<boolean>;
  enrichOrdersWithCustomerNames: (orders: Order[]) => Promise<Order[]>;
  orders: Order[];
  loading: boolean;
  error: Error | null;
}

const useOrders = (): UseOrdersHook => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { dataLocale } = useApplicationContext(context => ({
    dataLocale: context.dataLocale,
  }));
  
  const { refetch, loading: queryLoading } = useMcQuery<{
    orders?: { results: Array<Order> };
  }>(GET_STORE_ORDERS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
  });

  const { refetch: refetchOrderById, loading: orderDetailLoading } = useMcQuery<OrderDetailResponse>(
    GET_ORDER_BY_ID, 
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      variables: {
        locale: dataLocale,
      },
      skip: true, // Skip on initial render
    }
  );

  const { refetch: refetchCustomerById, loading: customerLoading } = useMcQuery<CustomerResponse>(
    GET_CUSTOMER_BY_ID,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  const [executeUpdateOrderState, { loading: updateLoading }] = useMcMutation(
    UPDATE_ORDER_STATE,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const fetchCustomerById = useCallback(
    async (customerId: string): Promise<Customer | null> => {
      if (!customerId) {
        return null;
      }
      
      try {
        console.log(`Fetching customer details for ID: ${customerId}`);
        
        const { data, error: apiError } = await refetchCustomerById({ 
          id: customerId
        });
        
        if (apiError) {
          console.error('API Error fetching customer details:', apiError);
          return null;
        }
        
        if (!data?.customer) {
          console.log('Customer not found');
          return null;
        }
        
        console.log('Customer details retrieved');
        return data.customer;
      } catch (err) {
        console.error('Error in fetchCustomerById:', err);
        return null;
      }
    },
    [refetchCustomerById]
  );

  const enrichOrdersWithCustomerNames = useCallback(
    async (ordersList: Order[]): Promise<Order[]> => {
      try {
        const enrichedOrders = await Promise.all(
          ordersList.map(async (order) => {
            if (!order.customerId) {
              return {
                ...order,
                customerName: order.customerEmail || 'Guest',
              };
            }
            
            const customer = await fetchCustomerById(order.customerId);
            
            if (!customer) {
              return {
                ...order,
                customerName: order.customerEmail || 'Unknown',
              };
            }
            
            const customerName = [customer.firstName, customer.lastName]
              .filter(Boolean)
              .join(' ') || customer.email || 'Unknown';
            
            return {
              ...order,
              customerName,
            };
          })
        );
        
        return enrichedOrders;
      } catch (err) {
        console.error('Error enriching orders with customer names:', err);
        // Return original orders without enrichment
        return ordersList.map(order => ({
          ...order,
          customerName: order.customerEmail || 'Unknown',
        }));
      }
    },
    [fetchCustomerById]
  );

  const fetchOrdersByStore = useCallback(
    async (storeKey: string): Promise<Order[]> => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching orders for store ${storeKey}`);
        
        // Create a where condition to filter orders by store key
        const whereCondition = `store(key="${storeKey}")`;
        
        const { data, error: apiError } = await refetch({ 
          where: whereCondition,
          sort: ['createdAt desc'] // Sort by creation date, newest first
        });
        
        if (apiError) {
          console.error('API Error fetching orders:', apiError);
          throw apiError;
        }
        
        if (!data?.orders?.results || data.orders.results.length === 0) {
          console.log('No orders found for this store');
          setOrders([]);
          return [];
        }
        
        console.log('Orders retrieved:', data.orders.results.length);
        
        const formattedOrders = data.orders.results.map(order => ({
          ...order,
          createdAt: new Date(order.createdAt).toLocaleString(),
        }));
        
        // Enrich orders with customer names
        const enrichedOrders = await enrichOrdersWithCustomerNames(formattedOrders);
        
        setOrders(enrichedOrders);
        return enrichedOrders;
      } catch (err) {
        console.error('Error in fetchOrdersByStore:', err);
        const errorObject = err instanceof Error ? err : new Error('Unknown error fetching orders');
        setError(errorObject);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch, enrichOrdersWithCustomerNames]
  );

  const fetchOrderById = useCallback(
    async (orderId: string): Promise<Order | null> => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching order details for ID: ${orderId}`);
        
        const { data, error: apiError } = await refetchOrderById({ 
          id: orderId,
          locale: dataLocale
        });
        
        if (apiError) {
          console.error('API Error fetching order details:', apiError);
          throw apiError;
        }
        
        if (!data?.order) {
          console.log('Order not found');
          return null;
        }
        
        console.log('Order details retrieved');
        
        // Format dates
        let formattedOrder = {
          ...data.order,
          createdAt: new Date(data.order.createdAt).toLocaleString(),
          lastModifiedAt: data.order.lastModifiedAt 
            ? new Date(data.order.lastModifiedAt).toLocaleString() 
            : undefined,
        };
        
        // Add customer name if customer ID is available
        if (formattedOrder.customerId) {
          const customer = await fetchCustomerById(formattedOrder.customerId);
          if (customer) {
            const customerName = [customer.firstName, customer.lastName]
              .filter(Boolean)
              .join(' ') || customer.email || 'Unknown';
            
            formattedOrder = {
              ...formattedOrder,
              customerName,
            };
          }
        }
        
        return formattedOrder;
      } catch (err) {
        console.error('Error in fetchOrderById:', err);
        const errorObject = err instanceof Error ? err : new Error('Unknown error fetching order details');
        setError(errorObject);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refetchOrderById, fetchCustomerById, dataLocale]
  );

  const updateOrderState = useCallback(
    async (orderId: string, version: number, newState: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Updating order ${orderId} to state: ${newState}`);
        
        const response = await executeUpdateOrderState({
          variables: {
            id: orderId,
            version: version,
            actions: [
              {
                changeOrderState: {
                  orderState: newState,
                },
              },
            ],
          },
        });
        
        if (!response || response.errors) {
          console.error('Error updating order state:', response?.errors);
          throw new Error('Failed to update order state');
        }
        
        console.log('Order state updated successfully');
        
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { 
                  ...order, 
                  orderState: newState,
                  version: (response.data as any).updateOrder.version
                } 
              : order
          )
        );
        
        return true;
      } catch (err) {
        console.error('Error in updateOrderState:', err);
        const errorObject = err instanceof Error ? err : new Error('Unknown error updating order state');
        setError(errorObject);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [executeUpdateOrderState]
  );

  return {
    fetchOrdersByStore,
    fetchOrderById,
    fetchCustomerById,
    updateOrderState,
    enrichOrdersWithCustomerNames,
    orders,
    loading: loading || queryLoading || orderDetailLoading || customerLoading || updateLoading,
    error,
  };
};

export default useOrders; 