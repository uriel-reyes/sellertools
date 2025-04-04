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
  firstName?: string;
  lastName?: string;
  storeKey?: string;
  stores?: string[];
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
  
  const { login, loading: authLoading, error: authError, errorCode } = useCustomerAuth();
  const { fetchCustomer, loading: customerLoading, error: detailsError } = useCustomerDetails();
  const { checkStoreByKey, loading: storeLoading, error: storeError } = useStoreLookup();

  // Fetch customer details when logged in
  useEffect(() => {
    if (loggedInCustomer?.id && !customerDetails) {
      const getDetails = async () => {
        const details = await fetchCustomer(loggedInCustomer.id);
        if (details) {
          setCustomerDetails(details);
          // Log the customer details to console
          console.log('Customer Details:', details);
          
          // Check for custom field with store key
          if (details.custom) {
            // Access customFieldsRaw instead of fields
            const customFieldsRaw = (details.custom as any).customFieldsRaw || [];
            // Find the store-key field
            const storeKeyField = customFieldsRaw.find((field: any) => field.name === 'store-key');
            
            if (storeKeyField) {
              const customStoreKey = storeKeyField.value;
              console.log('Found custom store key in customer:', customStoreKey);
              setStoreKey(customStoreKey);
              
              // Check if store exists in the project
              try {
                const exists = await checkStoreByKey(customStoreKey);
                setStoreExists(exists);
              } catch (error) {
                console.error('Failed to check store existence:', error);
                setStoreExists(false);
              }
            } else {
              console.log('No custom store key found in customer');
              setStoreKey(null);
              setStoreExists(null);
            }
          } else {
            console.log('No custom fields in customer');
            setStoreKey(null);
            setStoreExists(null);
          }
        }
      };
      getDetails();
    }
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    setLoggedInCustomer(null);
    setCustomerDetails(null);
    setStoreKey(null);
    setStoreExists(null);

    if (!email || !password) {
      return;
    }

    try {
      // Simply authenticate with email and password
      console.log('Authenticating with email and password');
      const result = await login(email, password);
      
      if (!result) {
        console.log('Login failed, errorCode:', errorCode, 'authError:', authError?.message);
        
        // Handle different error types
        if (errorCode === 'InvalidCredentials') {
          setErrorKey('invalidCredentials');
        } else if (authError?.message?.includes('customer_not_found')) {
          setErrorKey('loginNotFound');
        } else if (authError?.message?.includes('insufficient_scope')) {
          setErrorKey('insufficientScope');
          console.error('API Error: Insufficient scope, make sure manage_customers permission is added to custom-application-config.mjs');
        } else {
          setErrorKey('loginError');
        }
      } else if (result.customer) {
        console.log('Login successful, customer:', result.customer);
        // Set logged in customer to display success message
        setLoggedInCustomer({
          id: result.customer.id,
          email: result.customer.email,
          firstName: result.customer.firstName || undefined,
          lastName: result.customer.lastName || undefined,
        });
        
        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Error during login process:', error);
      setErrorKey('loginError');
    }
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
                    <Text.Body isBold>Login successful!</Text.Body>
                  </Spacings.Inline>
                </div>
                
                {customerLoading ? (
                  <Text.Body>Loading customer details...</Text.Body>
                ) : detailsError ? (
                  <div className={styles.errorMessage}>
                    <ErrorMessage>
                      Error loading customer details: {detailsError.message}
                    </ErrorMessage>
                  </div>
                ) : (
                  <div className={styles.welcomeCard}>
                    <Spacings.Stack scale="m" alignItems="center">
                      <Text.Headline as="h2">Welcome, {loggedInCustomer.firstName || loggedInCustomer.email}!</Text.Headline>
                      <Text.Body tone="secondary">You are successfully authenticated.</Text.Body>
                      
                      {storeKey && (
                        <div className={styles.storeInfo}>
                          <Spacings.Stack scale="s" alignItems="center">
                            <Text.Body intlMessage={{ id: 'Welcome.storeWelcome', defaultMessage: 'Welcome to your store:' }} />
                            <Text.Subheadline as="h4" tone="primary">{storeKey}</Text.Subheadline>
                          </Spacings.Stack>
                        </div>
                      )}
                      
                      <div className={styles.redirectingMessage}>
                        Redirecting to Seller Dashboard...
                      </div>
                      
                      <div className={styles.spacingTop}>
                        <PrimaryButton
                          label="Sign Out"
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
                        {intl.formatMessage(messages[errorKey])}
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
                  
                  {/* Use a regular input for password - with manual styling to match uikit */}
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
