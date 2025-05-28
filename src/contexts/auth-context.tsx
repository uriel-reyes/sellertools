import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { TCustomer } from '../types/generated/ctp';
import useCustomerAuth from '../hooks/use-customer-auth/use-customer-auth';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
// Type for customer details in the context
export type CustomerDetails = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

const AUTH_STORAGE_KEY = '__seller_auth';

export const convertToCustomerDetails = (
  customer: TCustomer
): CustomerDetails => {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
  };
};

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  storeKey: string | null;
  setStoreKey: (storeKey: string) => void;
  customerDetails: CustomerDetails | null;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: false,
  storeKey: null,
  setStoreKey: () => {},
  customerDetails: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] =
    useState<CustomerDetails | null>(null);

  const {
    mcLoggedInUserLoading,
    mcLoggedInUserError,
    mcLoggedInUser,
    findCustomerByEmail,
    findCustomerByEmailLoading,
  } = useCustomerAuth();

  const {
    environment,
  }: {
    environment: {
      SELLER_CUSTOMERGROUP_KEY: string;
    };
  } = useApplicationContext();

  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);

      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);

        if (
          parsedAuth &&
          typeof parsedAuth.isLoggedIn === 'boolean' &&
          parsedAuth.customerDetails
        ) {
          console.log('Restoring auth state from session storage');
          setIsLoggedIn(parsedAuth.isLoggedIn);
          setCustomerDetails(parsedAuth.customerDetails);
          setStoreKey(parsedAuth.storeKey);
        }
      }
    } catch (error) {
      console.error('Failed to load auth state from session storage:', error);
    }
  }, []);

  useEffect(() => {
    if (mcLoggedInUser && mcLoggedInUser.user?.id) {
      findCustomerByEmail({
        variables: {
          where: `email = "${mcLoggedInUser.user.email}"`,
        },
      }).then((result) => {
        const customer = result.data?.customers?.results?.[0];
        if (customer) {
          const customerGroupAssignments =
            result.data?.customers?.results?.[0].customerGroupAssignments;
          const isSeller = customerGroupAssignments?.some(
            (assignment) =>
              assignment.customerGroup.key ===
              environment.SELLER_CUSTOMERGROUP_KEY
          );
          setIsLoggedIn(!!isSeller);
          setCustomerDetails(convertToCustomerDetails(customer));
        }
      });
    }
  }, [mcLoggedInUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      isLoading: mcLoggedInUserLoading || findCustomerByEmailLoading,
      storeKey,
      customerDetails,
      setStoreKey,
    }),
    [isLoggedIn, storeKey, customerDetails, setStoreKey]
  );

  if (mcLoggedInUserLoading || findCustomerByEmailLoading) {
    return <LoadingSpinner />;
  }

  if (mcLoggedInUserError) {
    return (
      <ErrorMessage>
        Error loading user: {mcLoggedInUserError.message}
      </ErrorMessage>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
