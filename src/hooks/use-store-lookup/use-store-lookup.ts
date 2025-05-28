import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcQuery } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import gql from 'graphql-tag';

interface StoreData {
  stores: {
    results: Array<{
      id: string;
      key: string;
    }>;
  };
}

interface StoreVariables {
  where: string;
}

interface UseStoreLookupResult {
  checkStoreByKey: (key: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

const STORES_QUERY = gql`
  query GetStoreByKey($where: String!) {
    stores(where: $where) {
      results {
        id
        key
      }
    }
  }
`;

const useStoreLookup = (): UseStoreLookupResult => {
  const [error, setError] = useState<Error | null>(null);
  const { dataLocale } = useApplicationContext();

  const { loading, refetch } = useMcQuery<StoreData, StoreVariables>(
    STORES_QUERY,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
      skip: true, // Skip initial query, we'll use refetch
    }
  );

  const checkStoreByKey = useCallback(
    async (key: string): Promise<boolean> => {
      try {
        setError(null);
        console.log(`Checking if store with key '${key}' exists...`);

        // Create a where condition to filter by key
        const whereCondition = `key="${key}"`;

        const result = await refetch({
          where: whereCondition,
        });

        const storeExists = result.data?.stores.results.length > 0;
        console.log(
          `Store with key '${key}'${
            storeExists ? ' exists' : ' does not exist'
          }`
        );

        return storeExists;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Unknown error checking store');
        setError(error);
        console.error('Error checking store existence:', error);
        return false;
      }
    },
    [refetch]
  );

  return {
    checkStoreByKey,
    loading,
    error,
  };
};

export default useStoreLookup;
