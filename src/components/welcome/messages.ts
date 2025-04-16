import { defineMessages } from 'react-intl';

export default defineMessages({
  title: {
    id: 'Welcome.title',
    defaultMessage: 'Welcome to sellertools',
  },
  subtitle: {
    id: 'Welcome.subtitle',
    defaultMessage:
      'Please log in with your customer account to access the application.',
  },
  emailLabel: {
    id: 'Login.emailLabel',
    defaultMessage: 'Email',
  },
  emailPlaceholder: {
    id: 'Login.emailPlaceholder',
    defaultMessage: 'Enter your email address',
  },
  passwordLabel: {
    id: 'Login.passwordLabel',
    defaultMessage: 'Password',
  },
  passwordPlaceholder: {
    id: 'Login.passwordPlaceholder',
    defaultMessage: 'Enter your password',
  },
  loginButton: {
    id: 'Login.loginButton',
    defaultMessage: 'Login',
  },
  loginError: {
    id: 'Login.loginError',
    defaultMessage: 'Authentication failed. Please check your credentials.',
  },
  invalidCredentials: {
    id: 'Login.invalidCredentials',
    defaultMessage: 'Account with the given credentials not found. Please check your email and password.',
  },
  loginNotFound: {
    id: 'Login.loginNotFound',
    defaultMessage: 'Customer account not found.',
  },
  insufficientScope: {
    id: 'Login.insufficientScope',
    defaultMessage: 'API Permission error: Missing manage_customers scope. Please check the custom-application-config.mjs file.',
  },
  storeAccessError: {
    id: 'Login.storeAccessError',
    defaultMessage: 'Cannot sign in because this account is associated with a store. Due to technical limitations, store-associated accounts cannot be accessed in this environment.',
  },
  accessDenied: {
    id: 'Login.accessDenied',
    defaultMessage: 'Access denied. This account does not have the required store association.',
  },
  loginSuccess: {
    id: 'Login.loginSuccess',
    defaultMessage: 'Login successful!',
  },
  loadingDetails: {
    id: 'Login.loadingDetails',
    defaultMessage: 'Loading customer details...',
  },
  detailsError: {
    id: 'Login.detailsError',
    defaultMessage: 'Error loading customer details: {error}',
  },
  welcomeUser: {
    id: 'Login.welcomeUser',
    defaultMessage: 'Welcome, {name}!',
  },
  authSuccess: {
    id: 'Login.authSuccess',
    defaultMessage: 'You are successfully authenticated.',
  },
  redirecting: {
    id: 'Login.redirecting',
    defaultMessage: 'Redirecting to Seller Dashboard...',
  },
  signOut: {
    id: 'Login.signOut',
    defaultMessage: 'Sign Out',
  },
  storeWelcome: {
    id: 'Welcome.storeWelcome',
    defaultMessage: 'Welcome to your store:',
  },
  cardDocumentationTitle: {
    id: 'Welcome.cardDocumentationTitle',
    defaultMessage: 'Documentation',
  },
  cardDocumentationContent: {
    id: 'Welcome.cardDocumentationContent',
    defaultMessage: 'Learn more about Custom Applications.',
  },
  cardDesignSystemTitle: {
    id: 'Welcome.cardDesignSystemTitle',
    defaultMessage: 'Design System',
  },
  cardDesignSystemContent: {
    id: 'Welcome.cardDesignSystemContent',
    defaultMessage:
      'Explore the UI components to develop Custom Applications and learn more about the Design System.',
  },
  cardChannelsTitle: {
    id: 'Welcome.cardChannelsTitle',
    defaultMessage: 'Fetching channels',
  },
  cardChannelsContent: {
    id: 'Welcome.cardChannelsContent',
    defaultMessage:
      'Demo example to fetch some data using GraphQL and displaying it in a paginated table.',
  },
});
