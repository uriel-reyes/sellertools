import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

interface Order {
  id: string;
  orderNumber?: string;
  createdAt: string;
  totalPrice: {
    centAmount: number;
    currencyCode: string;
  };
  orderState: string;
}

interface Customer {
  id: string;
  version: number;
  email: string;
  firstName?: string;
  lastName?: string;
  customerNumber?: string;
  createdAt: string;
  lastModifiedAt?: string;
  isEmailVerified: boolean;
  stores?: Array<{
    key: string;
  }>;
  customerGroup?: {
    id: string;
    name?: string;
  };
  custom?: {
    customFieldsRaw: Array<{
      name: string;
      value: string;
    }>;
  };
  orders?: Order[];
}

// GraphQL query to fetch customers by store key
const GET_STORE_CUSTOMERS = gql`
  query GetStoreCustomers($where: String, $sort: [String!]) {
    customers(where: $where, sort: $sort) {
      results {
        id
        version
        email
        firstName
        lastName
        customerNumber
        isEmailVerified
        createdAt
        lastModifiedAt
        customerGroup {
          id
        }
        stores {
          key
        }
        custom {
          customFieldsRaw {
            name
            value
          }
        }
      }
    }
  }
`;

// GraphQL query to fetch a single customer with details
const GET_CUSTOMER_BY_ID = gql`
  query GetCustomerById($id: String!) {
    customer(id: $id) {
      id
      version
      email
      firstName
      lastName
      customerNumber
      isEmailVerified
      createdAt
      lastModifiedAt
      customerGroup {
        id
      }
      stores {
        key
      }
      addresses {
        id
        firstName
        lastName
        streetName
        streetNumber
        postalCode
        city
        country
        phone
        email
      }
      defaultShippingAddressId
      defaultBillingAddressId
      custom {
        customFieldsRaw {
          name
          value
        }
      }
    }
  }
`;

// GraphQL query to fetch a customer group by ID
const GET_CUSTOMER_GROUP = gql`
  query GetCustomerGroup($id: String!) {
    customerGroup(id: $id) {
      id
      version
      name
      key
    }
  }
`;

// Add orders query
const GET_CUSTOMER_ORDERS = gql`
  query GetCustomerOrders($where: String, $sort: [String!], $limit: Int) {
    orders(where: $where, sort: $sort, limit: $limit) {
      results {
        id
        orderNumber
        createdAt
        totalPrice {
          centAmount
          currencyCode
        }
        orderState
      }
    }
  }
`;

interface CustomersResponse {
  customers: {
    results: Array<Customer>;
  };
}

interface CustomerDetailResponse {
  customer: Customer;
}

interface CustomerGroupResponse {
  customerGroup: {
    id: string;
    version: number;
    name: string;
    key?: string;
  };
}

interface CustomerOrdersResponse {
  orders: {
    results: Array<Order>;
  };
}

interface UseStoreCustomersHook {
  fetchCustomersByStore: (storeKey: string) => Promise<Customer[]>;
  fetchCustomerById: (customerId: string) => Promise<Customer | null>;
  fetchCustomerGroupById: (groupId: string) => Promise<{ id: string; name: string } | null>;
  fetchCustomerOrders: (customerId: string, limit?: number) => Promise<Order[]>;
  customers: Customer[];
  loading: boolean;
  error: Error | null;
}

const useStoreCustomers = (): UseStoreCustomersHook => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [customerGroups, setCustomerGroups] = useState<{[key: string]: {id: string; name: string}}>({});
  
  const { dataLocale } = useApplicationContext(context => ({
    dataLocale: context.dataLocale,
  }));
  
  const { refetch, loading: queryLoading } = useMcQuery<{
    customers?: { results: Array<Customer> };
  }>(GET_STORE_CUSTOMERS, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip on initial render
  });

  const { refetch: refetchCustomerById, loading: customerDetailLoading } = useMcQuery<CustomerDetailResponse>(
    GET_CUSTOMER_BY_ID, 
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  const { refetch: refetchCustomerGroupById, loading: groupLoading } = useMcQuery<CustomerGroupResponse>(
    GET_CUSTOMER_GROUP,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  const { refetch: refetchCustomerOrders, loading: ordersLoading } = useMcQuery<CustomerOrdersResponse>(
    GET_CUSTOMER_ORDERS,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip on initial render
    }
  );

  const fetchCustomerGroupById = useCallback(
    async (groupId: string): Promise<{ id: string; name: string } | null> => {
      // Check if we already have this group cached
      if (customerGroups[groupId]) {
        return customerGroups[groupId];
      }
      
      try {
        console.log(`Fetching customer group for ID: ${groupId}`);
        
        const { data, error: apiError } = await refetchCustomerGroupById({ 
          id: groupId
        });
        
        if (apiError) {
          console.error('API Error fetching customer group:', apiError);
          return null;
        }
        
        if (!data?.customerGroup) {
          console.log('Customer group not found');
          return null;
        }
        
        const group = {
          id: data.customerGroup.id,
          name: data.customerGroup.name
        };
        
        // Cache the result
        setCustomerGroups(prev => ({
          ...prev,
          [groupId]: group
        }));
        
        return group;
      } catch (err) {
        console.error('Error in fetchCustomerGroupById:', err);
        return null;
      }
    },
    [refetchCustomerGroupById, customerGroups]
  );

  const fetchCustomersByStore = useCallback(
    async (storeKey: string): Promise<Customer[]> => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching customers for store ${storeKey}`);
        
        // Create a where condition to filter customers by store key
        const whereCondition = `stores(key="${storeKey}")`;
        
        const { data, error: apiError } = await refetch({ 
          where: whereCondition,
          sort: ['createdAt desc'] // Sort by creation date, newest first
        });
        
        if (apiError) {
          console.error('API Error fetching customers:', apiError);
          throw apiError;
        }
        
        if (!data?.customers?.results || data.customers.results.length === 0) {
          console.log('No customers found for this store');
          setCustomers([]);
          return [];
        }
        
        console.log('Customers retrieved:', data.customers.results.length);
        
        const formattedCustomers = data.customers.results.map(customer => ({
          ...customer,
          createdAt: new Date(customer.createdAt).toLocaleString(),
          lastModifiedAt: customer.lastModifiedAt 
            ? new Date(customer.lastModifiedAt).toLocaleString() 
            : undefined,
        }));
        
        setCustomers(formattedCustomers);
        return formattedCustomers;
      } catch (err) {
        console.error('Error in fetchCustomersByStore:', err);
        const errorObject = err instanceof Error ? err : new Error('Unknown error fetching customers');
        setError(errorObject);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const fetchCustomerById = useCallback(
    async (customerId: string): Promise<Customer | null> => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching customer details for ID: ${customerId}`);
        
        const { data, error: apiError } = await refetchCustomerById({ 
          id: customerId
        });
        
        if (apiError) {
          console.error('API Error fetching customer details:', apiError);
          throw apiError;
        }
        
        if (!data?.customer) {
          console.log('Customer not found');
          return null;
        }
        
        console.log('Customer details retrieved');
        
        // Format dates
        const formattedCustomer = {
          ...data.customer,
          createdAt: new Date(data.customer.createdAt).toLocaleString(),
          lastModifiedAt: data.customer.lastModifiedAt 
            ? new Date(data.customer.lastModifiedAt).toLocaleString() 
            : undefined,
        };
        
        // Fetch customer group name if available
        if (formattedCustomer.customerGroup?.id) {
          try {
            const group = await fetchCustomerGroupById(formattedCustomer.customerGroup.id);
            if (group) {
              formattedCustomer.customerGroup.name = group.name;
            }
          } catch (groupErr) {
            console.error('Error fetching customer group:', groupErr);
            // Continue without the group name
          }
        }
        
        return formattedCustomer;
      } catch (err) {
        console.error('Error in fetchCustomerById:', err);
        const errorObject = err instanceof Error ? err : new Error('Unknown error fetching customer details');
        setError(errorObject);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refetchCustomerById, fetchCustomerGroupById]
  );

  const fetchCustomerOrders = useCallback(
    async (customerId: string, limit: number = 5): Promise<Order[]> => {
      try {
        console.log(`Fetching orders for customer ID: ${customerId}`);
        
        // Create a where condition to filter orders by customer ID
        const whereCondition = `customerId="${customerId}"`;
        
        const { data, error: apiError } = await refetchCustomerOrders({ 
          where: whereCondition,
          sort: ['createdAt desc'], // Sort by creation date, newest first
          limit
        });
        
        if (apiError) {
          console.error('API Error fetching customer orders:', apiError);
          return [];
        }
        
        if (!data?.orders?.results) {
          console.log('No orders found for this customer');
          return [];
        }
        
        console.log(`Found ${data.orders.results.length} orders for customer ${customerId}`);
        
        const formattedOrders = data.orders.results.map(order => ({
          ...order,
          createdAt: new Date(order.createdAt).toLocaleString(),
        }));
        
        return formattedOrders;
      } catch (err) {
        console.error('Error fetching customer orders:', err);
        return [];
      }
    },
    [refetchCustomerOrders]
  );

  return {
    fetchCustomersByStore,
    fetchCustomerById,
    fetchCustomerGroupById,
    fetchCustomerOrders,
    customers,
    loading: loading || queryLoading || customerDetailLoading || groupLoading || ordersLoading,
    error,
  };
};

export default useStoreCustomers; 