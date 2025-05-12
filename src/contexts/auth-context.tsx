import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { TCustomer } from '../types/generated/ctp';

// Type for customer details in the context
export type CustomerDetails = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  storeKey?: string;
  stores?: string[];
};

const AUTH_STORAGE_KEY = '__seller_auth';

export const convertToCustomerDetails = (customer: TCustomer): CustomerDetails => {
  const storeKeyField = customer.custom?.customFieldsRaw?.find(
    (field: any) => field.name === 'store-key'
  );
  
  const storeKey = storeKeyField?.value?.toString();
  
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    storeKey: storeKey,
    stores: customer.stores?.map(store => store.key || '').filter(Boolean) || []
  };
};

interface AuthContextType {
  isLoggedIn: boolean;
  storeKey: string | null;
  customerDetails: CustomerDetails | null;
  setAuthState: (isLoggedIn: boolean, customerDetails: CustomerDetails | null, storeKey: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  storeKey: null,
  customerDetails: null,
  setAuthState: () => {},
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth);
        
        if (parsedAuth && 
            typeof parsedAuth.isLoggedIn === 'boolean' && 
            parsedAuth.customerDetails) {
          
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

  const setAuthState = useCallback(
    (loggedIn: boolean, details: CustomerDetails | null, key: string | null) => {
      // Only update state if values have actually changed
      if (loggedIn !== isLoggedIn) {
        setIsLoggedIn(loggedIn);
      }
      
      // Deep compare customer details to avoid unnecessary renders
      const detailsChanged = JSON.stringify(details) !== JSON.stringify(customerDetails);
      if (detailsChanged) {
        setCustomerDetails(details);
      }
      
      if (key !== storeKey) {
        setStoreKey(key);
      }
      
      try {
        const authData = {
          isLoggedIn: loggedIn,
          customerDetails: details,
          storeKey: key
        };
        
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      } catch (error) {
        console.error('Failed to save auth state to session storage:', error);
      }
    }, 
    [isLoggedIn, customerDetails, storeKey]
  );

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCustomerDetails(null);
    setStoreKey(null);
    
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth state from session storage:', error);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      storeKey,
      customerDetails,
      setAuthState,
      logout,
    }),
    [isLoggedIn, storeKey, customerDetails, setAuthState, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
