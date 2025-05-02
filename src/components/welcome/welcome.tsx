import Constraints from '@commercetools-uikit/constraints';
import { CheckActiveIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import PrimaryButton from '@commercetools-uikit/primary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import TextField from '@commercetools-uikit/text-field';
import React, { ChangeEvent, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAuthContext } from '../../contexts/auth-context';
import useCustomerAuth from '../../hooks/use-customer-auth';
import { Maybe, TCustomer } from '../../types/generated/ctp';
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

  const storeKey = storeKeyField?.value?.toString();
  console.log('Converting customer to details, found store key:', storeKey);

  if (!storeKey) {
    console.warn('⚠️ WARNING: No store-key custom field found for customer:', customer.id);
  }

  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    storeKey: storeKey,
    stores: customer.stores?.map(store => store.key || '').filter(Boolean) || []
  };
};

const Welcome: React.FC = () => {
  const intl = useIntl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);
  const { setAuthState, isLoggedIn } = useAuthContext();

  const { login, loading: authLoading, error: authError, errorCode } = useCustomerAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKey(null);

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

        // Get store key from custom fields
        const storeKeyField = result.customer.custom.customFieldsRaw.find(
          (field: any) => field.name === 'store-key'
        );
        const customStoreKey = storeKeyField?.value?.toString();
        console.log('Login - Found custom store key:', customStoreKey);

        // Directly set the store key in state as well
        if (!customStoreKey) {
          setErrorKey('loginError');
        } 

        // Convert TCustomer to CustomerDetails
        const convertedDetails = convertToCustomerDetails(result.customer);

        setAuthState(true, convertedDetails, customStoreKey!);

        // Clear form
        setEmail('');
        setPassword('');
      } else {
        setErrorKey('loginError');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorKey('loginError');
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

  const loading = authLoading;

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
            {isLoggedIn ? (
              <div className={styles.successWrap}>
                <div className={styles.successMessage}>
                  <Spacings.Inline alignItems="center" scale="xs">
                    <CheckActiveIcon color="primary" size="medium" />
                    <Text.Body isBold>
                      {intl.formatMessage(messages.loginSuccess)}
                    </Text.Body>
                  </Spacings.Inline>
                </div>

               
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
                        onClick={() => { }} // PrimaryButton needs onClick, though we're handling via form submit
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
