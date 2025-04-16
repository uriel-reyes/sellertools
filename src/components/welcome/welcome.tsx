import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useIntl } from 'react-intl';
import Constraints from '@commercetools-uikit/constraints';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import PrimaryButton from '@commercetools-uikit/primary-button';
import TextField from '@commercetools-uikit/text-field';
import { ErrorMessage } from '@commercetools-uikit/messages';
import { CheckActiveIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import useCustomerAuth from '../../hooks/use-customer-auth';
import useCustomerDetails from '../../hooks/use-customer-details';
import useStoreLookup from '../../hooks/use-store-lookup';
import SellerDashboard from '../seller-dashboard/seller-dashboard';
import messages from './messages';
import styles from './welcome.module.css';
import { Maybe, TStore, TCustomer } from '../../types/generated/ctp';

type MessageKey = keyof typeof messages;

type CustomerObj = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type CustomerDetails = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  storeKey?: string;
  stores?: string[];
};

// Helper function to convert TCustomer to CustomerDetails
const convertToCustomerDetails = (customer: TCustomer): CustomerDetails => {
  const storeKeyField = customer.custom?.customFieldsRaw?.find(
    (field: any) => field.name === 'store-key'
  );
  
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    storeKey: storeKeyField?.value?.toString(),
    stores: customer.stores?.map(store => store.key || '').filter(Boolean) || []
  };
};

const Welcome: React.FC = () => {
  const intl = useIntl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedInCustomer, setLoggedInCustomer] = useState<CustomerObj | null>(null);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [storeKey, setStoreKey] = useState<string | null>(null);
  const [storeExists, setStoreExists] = useState<boolean | null>(null);
  const [redirectToDashboard, setRedirectToDashboard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, loading: authLoading, error: authError, errorCode } = useCustomerAuth();
  const { fetchCustomer, loading: customerLoading, error: detailsError } = useCustomerDetails();
  const { checkStoreByKey, loading: storeLoading, error: storeError } = useStoreLookup();

  // Fetch customer details when logged in
  useEffect(() => {
    let mounted = true;
    
    if (loggedInCustomer?.id && !customerDetails) {
      const getDetails = async () => {
        const details = await fetchCustomer(loggedInCustomer.id);
        if (!mounted) return;
        
        if (details) {
          // Convert TCustomer to CustomerDetails
          const convertedDetails = convertToCustomerDetails(details);
          setCustomerDetails(convertedDetails);
          console.log('Customer Details:', details);
          
          if (details.custom) {
            const customFieldsRaw = (details.custom as any).customFieldsRaw || [];
            const storeKeyField = customFieldsRaw.find((field: any) => field.name === 'store-key');
            
            if (storeKeyField) {
              const customStoreKey = storeKeyField.value;
              console.log('Found custom store key in customer:', customStoreKey);
              if (mounted) {
                setStoreKey(customStoreKey);
                try {
                  const exists = await checkStoreByKey(customStoreKey);
                  if (mounted) {
                    setStoreExists(exists);
                  }
                } catch (error) {
                  console.error('Failed to check store existence:', error);
                  if (mounted) {
                    setStoreExists(false);
                  }
                }
              } else {
                console.log('No custom store key found in customer');
                if (mounted) {
                  setStoreKey(null);
                  setStoreExists(null);
                }
              }
            } else {
              console.log('No custom store key found in customer');
              if (mounted) {
                setStoreKey(null);
                setStoreExists(null);
              }
            }
          } else {
            console.log('No custom fields in customer');
            if (mounted) {
              setStoreKey(null);
              setStoreExists(null);
            }
          }
        }
      };
      getDetails();
    }
    
    return () => {
      mounted = false;
    };
  }, [loggedInCustomer, customerDetails, fetchCustomer, checkStoreByKey]);

  // Set up redirect to dashboard
  useEffect(() => {
    if (loggedInCustomer) {
      const timer = setTimeout(() => {
        setRedirectToDashboard(true);
      }, 1000); // 1 second delay (reduced from 3 seconds)
      
      return () => clearTimeout(timer);
    }
  }, [loggedInCustomer]);
  
  // Handle navigation in the dashboard
  const handleNavigation = (route: string) => {
    console.log(`Navigating to: ${route}`);
    // In a real app, you would use a router here
    // For now, just log the navigation
  };
  
  if (redirectToDashboard) {
    return <SellerDashboard 
      onNavigate={handleNavigation} 
      storeKey={storeKey || 'default-store'} 
    />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result?.customer) {
        // Check for required custom fields
        if (!result.customer.custom?.customFieldsRaw || 
            !result.customer.custom.customFieldsRaw.find((field: any) => field.name === 'store-key')) {
          setErrorKey('accessDenied');
          console.error('Customer missing required custom fields');
          return;
        }

        // Helper function to handle Maybe type
        const getMaybeValue = <T,>(value: Maybe<T>): T | undefined => {
          return value === null ? undefined : value;
        };

        // Convert TCustomer to CustomerDetails
        const convertedDetails = convertToCustomerDetails(result.customer);
        setCustomerDetails(convertedDetails);
        
        // Set logged in customer
        const loggedInCustomerData: CustomerObj = {
          id: result.customer.id,
          email: result.customer.email,
          firstName: getMaybeValue(result.customer.firstName),
          lastName: getMaybeValue(result.customer.lastName),
        };
        setLoggedInCustomer(loggedInCustomerData);
        
        // Clear form
        setEmail('');
        setPassword('');
      } else {
        setErrorKey('loginError');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorKey('loginError');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle error display
  const getErrorMessage = () => {
    if (!errorKey) return null;
    
    return intl.formatMessage(messages[errorKey], {
      id: errorKey,
      defaultMessage: messages[errorKey].defaultMessage
    });
  };

  const loading = authLoading || customerLoading || storeLoading;

  return (
    <div className={styles.pageContainer}>
      <Constraints.Horizontal max={16}>
        <Spacings.Stack scale="xl" alignItems="center">
          <div className={styles.logoContainer}>
            <img
              src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png"
              alt="commercetools logo"
              width="300"
              height="auto"
            />
          </div>
          <Text.Headline as="h1" intlMessage={messages.title} />
          <Text.Subheadline as="h4" intlMessage={messages.subtitle} />
          
          <div className={styles.loginContainer}>
            {loggedInCustomer ? (
              <div className={styles.successWrap}>
                <div className={styles.successMessage}>
                  <Spacings.Inline alignItems="center" scale="xs">
                    <CheckActiveIcon color="primary" size="medium" />
                    <Text.Body isBold>
                      {intl.formatMessage(messages.loginSuccess)}
                    </Text.Body>
                  </Spacings.Inline>
                </div>
                
                {customerLoading ? (
                  <Text.Body>
                    {intl.formatMessage(messages.loadingDetails)}
                  </Text.Body>
                ) : detailsError ? (
                  <div className={styles.errorMessage}>
                    <ErrorMessage>
                      {intl.formatMessage(messages.detailsError, { error: detailsError.message })}
                    </ErrorMessage>
                  </div>
                ) : (
                  <div className={styles.welcomeCard}>
                    <Spacings.Stack scale="m" alignItems="center">
                      <Text.Headline as="h2">
                        {intl.formatMessage(messages.welcomeUser, {
                          name: loggedInCustomer.firstName || loggedInCustomer.email
                        })}
                      </Text.Headline>
                      <Text.Body tone="secondary">
                        {intl.formatMessage(messages.authSuccess)}
                      </Text.Body>
                      
                      {storeKey && (
                        <div className={styles.storeInfo}>
                          <Spacings.Stack scale="s" alignItems="center">
                            <Text.Body>
                              {intl.formatMessage(messages.storeWelcome)}
                            </Text.Body>
                            <Text.Subheadline as="h4" tone="primary">
                              {storeKey}
                            </Text.Subheadline>
                          </Spacings.Stack>
                        </div>
                      )}
                      
                      <div className={styles.redirectingMessage}>
                        {intl.formatMessage(messages.redirecting)}
                      </div>
                      
                      <div className={styles.spacingTop}>
                        <PrimaryButton
                          label={intl.formatMessage(messages.signOut)}
                          onClick={() => {
                            setLoggedInCustomer(null);
                            setCustomerDetails(null);
                            setStoreKey(null);
                            setStoreExists(null);
                            setRedirectToDashboard(false);
                          }}
                        />
                      </div>
                    </Spacings.Stack>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.loginForm}>
                <Spacings.Stack scale="l">
                  {errorKey && (
                    <div className={styles.errorMessage}>
                      <ErrorMessage>
                        {getErrorMessage()}
                      </ErrorMessage>
                    </div>
                  )}
                  
                  <TextField
                    id="email"
                    name="email"
                    value={email}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                    title={intl.formatMessage(messages.emailLabel)}
                    placeholder={intl.formatMessage(messages.emailPlaceholder)}
                    isRequired
                    horizontalConstraint="scale"
                  />
                  
                  <div>
                    <label htmlFor="password">
                      {intl.formatMessage(messages.passwordLabel)}{' '}
                      <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => 
                        setPassword(event.target.value)
                      }
                      placeholder={intl.formatMessage(messages.passwordPlaceholder)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--color-neutral)',
                        borderRadius: 'var(--border-radius-6)',
                        fontSize: '16px',
                        marginTop: '4px',
                      }}
                      className="password-field"
                    />
                  </div>
                  
                  <Spacings.Inline justifyContent="center">
                    {loading ? (
                      <div className={styles.loadingContainer}>
                        <LoadingSpinner scale="s" />
                      </div>
                    ) : (
                      <PrimaryButton
                        label={intl.formatMessage(messages.loginButton)}
                        onClick={() => {}} // PrimaryButton needs onClick, though we're handling via form submit
                        type="submit"
                        isDisabled={loading || !email || !password}
                      />
                    )}
                  </Spacings.Inline>
                </Spacings.Stack>
              </form>
            )}
          </div>
        </Spacings.Stack>
      </Constraints.Horizontal>
    </div>
  );
};
Welcome.displayName = 'Welcome';

export default Welcome;
