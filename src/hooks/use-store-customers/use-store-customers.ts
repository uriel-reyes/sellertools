import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

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
  custom?: {
    customFieldsRaw: Array<{
      name: string;
      value: string;
    }>;
  };
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
      defaultShippingAddress
      defaultBillingAddress
      custom {
        customFieldsRaw {
          name
          value
        }
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

interface UseStoreCustomersHook {
  fetchCustomersByStore: (storeKey: string) => Promise<Customer[]>;
  fetchCustomerById: (customerId: string) => Promise<Customer | null>;
  customers: Customer[];
  loading: boolean;
  error: Error | null;
}

const useStoreCustomers = (): UseStoreCustomersHook => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
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
    [refetchCustomerById]
  );

  return {
    fetchCustomersByStore,
    fetchCustomerById,
    customers,
    loading: loading || queryLoading || customerDetailLoading,
    error,
  };
};

export default useStoreCustomers; 