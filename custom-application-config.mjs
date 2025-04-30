import { PERMISSIONS, entryPointUriPath } from './src/constants';

/**
 * @type {import('@commercetools-frontend/application-config').ConfigOptionsForCustomApplication}
 */
const config = {
  name: 'sellertools',
  entryPointUriPath,
  cloudIdentifier: 'gcp-us',
  env: {
    development: {
      initialProjectKey: 'us-store',
    },
    production: {
      applicationId: 'TODO',
      url: 'https://your_app_hostname.com',
    },
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
  icon: '${path:@commercetools-frontend/assets/application-icons/rocket.svg}',
  mainMenuLink: {
    defaultLabel: 'sellertools',
    labelAllLocales: [],
    permissions: [PERMISSIONS.View],
  },
};

export default config;
