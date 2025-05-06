import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'sellertools',
  entryPointUriPath: '${env:ENTRY_POINT_URI_PATH}',
  cloudIdentifier: '${env:CLOUD_IDENTIFIER}',
  env: {
    production: {
      applicationId: '${env:CUSTOM_APPLICATION_ID}',
      url: '${env:APPLICATION_URL}',
    },
    development: {
      initialProjectKey: '${env:INITIAL_PROJECT_KEY}',
    },
  },
  additionalEnv: {
    CMS_API_URL: '${env:CMS_API_URL}',
  },
  oAuthScopes: {
    view: [
      'view_products', 
      'view_customers', 
      'view_stores', 
      'view_orders', 
      'view_product_selections',
      'view_cart_discounts'
    ],
    manage: [
      'manage_products', 
      'manage_customers', 
      'manage_stores', 
      'manage_orders', 
      'manage_product_selections',
      'manage_cart_discounts'
    ],
  },
  headers:{
    csp: {
      'script-src': ['*.commercetools.app'],
      "connect-src": ['*.commercetools.app'],
    }
  },
  icon: '${path:@commercetools-frontend/assets/application-icons/rocket.svg}',
  mainMenuLink: {
    defaultLabel: 'sellertools',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
};

export default config;
