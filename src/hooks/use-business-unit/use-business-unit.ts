import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

// Define the interface for the business unit address
interface BusinessUnitAddress {
  id?: string;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  country: string;
}

// Define the interface for the custom field
interface CustomField {
  name: string;
  value: string | string[];
}

// Define the interface for the business unit
interface BusinessUnit {
  id: string;
  version: number;
  name: string;
  addresses: BusinessUnitAddress[];
  custom: {
    customFieldsRaw: CustomField[];
  };
}

// GraphQL query to fetch business unit data
const GET_BUSINESS_UNIT_QUERY = gql`
  query GetBusinessUnit($id: String!) {
    businessUnit(id: $id) {
      id
      version
      name
      addresses {
        id
        streetNumber
        streetName
        city
        state
        postalCode
        phone
        country
      }
      custom {
        customFieldsRaw {
          name
          value
        }
      }
    }
  }
`;

// Response type for the GraphQL query
interface GetBusinessUnitResponse {
  businessUnit: BusinessUnit;
}

// Return type for the hook
interface UseBusinessUnitHook {
  businessUnit: BusinessUnit | null;
  loading: boolean;
  error: Error | null;
  fetchBusinessUnit: (id: string) => Promise<void>;
}

const useBusinessUnit = (): UseBusinessUnitHook => {
  const [businessUnit, setBusinessUnit] = useState<BusinessUnit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  // Set up the GraphQL query
  const { refetch } = useMcQuery<GetBusinessUnitResponse>(GET_BUSINESS_UNIT_QUERY, {
    context: {
      target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
    },
    skip: true, // Skip on initial render
  });

  // Function to fetch business unit data by ID
  const fetchBusinessUnit = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await refetch({ id });
      
      if (data && data.businessUnit) {
        console.log('Fetched business unit:', JSON.stringify(data.businessUnit, null, 2));
        setBusinessUnit(data.businessUnit);
      } else {
        setBusinessUnit(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching business unit data'));
      console.error('Error fetching business unit data:', err);
    } finally {
      setLoading(false);
    }
  }, [refetch]);
  
  return {
    businessUnit,
    loading,
    error,
    fetchBusinessUnit,
  };
};

export default useBusinessUnit; 