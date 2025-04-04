<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# sellertools

sellertools is an early marketplace seller dashboard proof of concept built on the commercetools Merchant Center Apps framework. It empowers store owners to manage their store operations efficiently, providing a dedicated dashboard for sellers with store-based authentication and comprehensive order management capabilities.

## Purpose

This application addresses the need for store-specific management tools in a multi-vendor commercetools environment. It allows sellers to:

- Authenticate with their store credentials
- View and manage orders specific to their store
- Track order statuses and update them as needed
- Access customer information associated with their orders

## Features

### Store-Based Authentication
- Secure login system that validates store association
- Custom authentication flow that respects store permissions
- Dynamic retrieval of store-specific data
- Utilizes customer custom fields to establish store association

### Order Management
- Comprehensive order listing with:
  - Date and time information
  - Order numbers
  - Customer details
  - Order totals and status
- Advanced filtering and sorting capabilities
- Real-time refresh of order data

### Detailed Order Information
- Modal view with complete order details
- Product images from the commercetools platform
- Line item breakdown with pricing
- Shipping and billing address information
- Customer details associated with each order

### Status Management
- Interactive status dropdown for order state changes
- Real-time status updates to the commercetools backend
- Visual indicators for different order statuses

### Customer Management
- View customers associated with the seller's store
- Detailed customer profile information
- Address and contact details for each customer

## Technical Implementation

This application leverages:
- commercetools API and Custom Applications framework
- React and TypeScript for modern frontend development
- GraphQL for efficient data fetching
- UI Kit components for consistent design language

### Authentication Implementation
The application implements customer authentication through standard commercetools customer sign-in:

```graphql
mutation CustomerSignIn($draft: CustomerSignInDraft!) {
  customerSignIn(draft: $draft) {
    customer {
      id
      email
      firstName
      lastName
      isEmailVerified
    }
  }
}
```

After authentication, the application checks for a custom field in the customer record to determine store association. This was implemented as a workaround for issues encountered with `KeyReferenceInput`.

### Required Custom Types

This application requires a Custom Type at the Customer level with the following configuration:

1. **Custom Type Name**: `seller-store-association` (or similar)
2. **Field Definition**:
   - Field Name: `store-key`
   - Type: String
   - Required: No
   - Label: "Store Key"

This custom field is used to associate customers (sellers) with their respective stores, since direct store-based authentication with `KeyReferenceInput` couldn't be implemented.

## Getting Started

### Prerequisites
- commercetools project with appropriate API scopes (`view_orders`, `view_customers`, `view_stores`, `manage_stores`)
- Custom Type for Customers with a `store-key` field
- Node.js (v14+) and npm

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Build for production
npm run build
```

### Configuration

Ensure you have the following scopes configured in your custom-application-config.mjs:
- `view_products`
- `view_orders`
- `manage_orders`
- `view_customers`
- `view_stores`
- `manage_stores`

## Development

For more information about developing Custom Applications, please refer to:
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)
