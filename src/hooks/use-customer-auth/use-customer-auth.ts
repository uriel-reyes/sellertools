import { useCallback, useState } from 'react';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
import { useMcMutation } from '@commercetools-frontend/application-shell';
import { GRAPHQL_TARGETS } from '@commercetools-frontend/constants';
import { TCustomerSignInDraft, TCustomerSignInResult } from '../../types/generated/ctp';
import gql from 'graphql-tag';

interface UseCustomerAuthResult {
  login: (email: string, password: string) => Promise<TCustomerSignInResult | null>;
  error: Error | null;
  loading: boolean;
  errorCode: string | null;
}

// Regular customer sign-in mutation
const CUSTOMER_SIGN_IN = gql`
  mutation CustomerSignIn($draft: CustomerSignInDraft!) {
    customerSignIn(draft: $draft) {
      customer {
        id
        email
        firstName
        lastName
        isEmailVerified
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

const useCustomerAuth = (): UseCustomerAuthResult => {
  const [error, setError] = useState<Error | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { dataLocale } = useApplicationContext();
  
  // Regular customer sign-in mutation
  const [loginCustomer, { loading: regularLoading }] = useMcMutation<
    { customerSignIn: TCustomerSignInResult },
    { draft: TCustomerSignInDraft }
  >(
    CUSTOMER_SIGN_IN,
    {
      context: {
        target: GRAPHQL_TARGETS.COMMERCETOOLS_PLATFORM,
      },
    }
  );

  const login = useCallback(
    async (email: string, password: string): Promise<TCustomerSignInResult | null> => {
      try {
        setError(null);
        setErrorCode(null);
        setLoading(true);
        
        console.log('Attempting to login with:', { 
          email, 
          password
        });

        console.log('Using standard authentication');
        
        const signInDraft = {
          email,
          password,
        };
        
        const result = await loginCustomer({
          variables: {
            draft: signInDraft,
          },
        });
        
        console.log('Login result:', result ? 'Success' : 'No data returned');
        return result.data?.customerSignIn || null;
      } catch (err) {
        console.error('Login error:', err);
        
        // Check for GraphQL error response
        if (err && typeof err === 'object' && 'graphQLErrors' in err) {
          const graphQLErrors = (err as any).graphQLErrors;
          if (Array.isArray(graphQLErrors) && graphQLErrors.length > 0) {
            const firstError = graphQLErrors[0];
            console.error('GraphQL error details:', firstError);
            
            // Extract error code if available
            if (firstError.extensions && firstError.extensions.code) {
              setErrorCode(firstError.extensions.code);
            }
          }
        }
        
        setError(err instanceof Error ? err : new Error('Unknown error during login'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loginCustomer]
  );

  return {
    login,
    error,
    loading: loading || regularLoading,
    errorCode,
  };
};

export default useCustomerAuth; 