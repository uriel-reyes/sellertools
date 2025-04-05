<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# sellertools

sellertools is an early marketplace seller dashboard proof of concept built on the commercetools Merchant Center Apps framework. It empowers store owners to manage their store operations efficiently, providing a dedicated dashboard for sellers with store-based authentication, comprehensive order management capabilities, and product selection management.

## Purpose

This application addresses the need for store-specific management tools in a multi-vendor commercetools environment. It allows sellers to:

- Authenticate with their store credentials
- View and manage orders specific to their store
- Track order statuses and update them as needed
- Access customer information associated with their orders
- Manage product selections for their store, adding or removing products from a master catalog

## Features

### Store-Based Authentication
- Secure login system for sellers and store managers
- Authentication through standard customerSignIn implementation
- Store association verification after login
- Support for detecting store references through customer's custom fields
- Automatic redirect to dashboard after successful authentication

### Order Management
- Comprehensive order listing with:
  - Date and time information
  - Order numbers
  - Customer details
  - Order totals and status
- Advanced filtering and sorting capabilities
- Real-time refresh of order data
- Reorganized order details view for improved readability
- Enhanced line item display with product images

### Detailed Order Information
- Modal view with complete order details
- Product images from the commercetools platform
- Line item breakdown with pricing
- Shipping and billing address information
- Customer details associated with each order
- Clean, organized sections with intuitive icons
- Enhanced visual styling for different order statuses

### Status Management
- Interactive status dropdown for order state changes
- Real-time status updates to the commercetools backend
- Visual indicators for different order statuses, with improved readability

### Customer Management
- View customers associated with the seller's store
- Detailed customer profile information with intuitive card-based interface
- Address information displayed in user-friendly cards
- Recently placed orders displayed within the customer profile
- Custom fields display for extended customer information
- Streamlined account details for better focus on key information

### Product Selection Management
- Dual-table interface for managing product selections
- View master catalog products and select items to add to your store
- View your store's current product selection
- Add products to your store with a single click
- Remove products from your store's selection
- Real-time updates and synchronization with the commercetools platform
- Selection checkboxes with clear visual feedback
- Table side-by-side layout for easy comparison

### UI Improvements
- Consistent card-based interfaces across the application
- Enhanced typography with improved readability
- Responsive layouts that work on various screen sizes
- Visual indicators using color coding for statuses
- Separate sections for different types of information
- Clean navigation between dashboard, orders, and customer details
- Side-by-side layouts for related information

### Error Handling
- Detailed error messages for authentication failures
- Loading indicators for data fetching operations
- Graceful handling of missing data
- Visual feedback for user actions (status updates, product selection, etc.)

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

After authentication, the application checks for a custom field in the customer record to determine store association. This custom field approach provides a simple but effective way to associate customers (sellers) with their respective stores.

### Product Selection Implementation
The application uses Product Selections to manage which products are available in a store:

```graphql
mutation UpdateProductSelection($id: String!, $version: Long!, $actions: [ProductSelectionUpdateAction!]!) {
  updateProductSelection(id: $id, version: $version, actions: $actions) {
    id
    version
  }
}
```

This allows sellers to:
1. View products from a master catalog
2. Add selected products to their store's selection
3. Remove products from their store's selection when needed

### Required Custom Types

When using the fallback authentication method, this application requires a Custom Type at the Customer level with the following configuration:

1. **Custom Type Name**: `seller-store-association` (or similar)
2. **Field Definition**:
   - Field Name: `store-key`
   - Type: String
   - Required: No
   - Label: "Store Key"

This custom field is used as a fallback method to associate customers (sellers) with their respective stores when direct store references are not available.

## Configuration Requirements

### Store Setup

This application requires a specific configuration for stores, channels, and product selections:

1. **Store Creation**:
   - Create a store in commercetools with a unique key (e.g., `seller-store-1`)
   - The store key is used as the identifier for all seller-related operations

2. **Channel Alignment**:
   - Create a distribution channel with the same key as the store (e.g., `seller-store-1`)
   - Associate this channel with the store

3. **Product Selection Setup**:
   - Create a product selection with the same key as the store (e.g., `seller-store-1`)
   - This alignment of keys (store, channel, product selection) is essential for the application to function correctly

### Customer Association

Sellers (customers who manage stores) are not directly assigned to stores in this implementation. Instead:

1. **Custom Type Requirements**:
   - Create a custom type for customers named `seller-store-association` (or similar)
   - Add a field named `store-key` of type String to this custom type
   - Label: "Store Key"
   - Required: No

2. **Customer Configuration**:
   - For each seller, apply the custom type to their customer record
   - Set the `store-key` field value to match the store key they should have access to (e.g., `seller-store-1`)

3. **Authentication Flow**:
   - When a seller logs in, the application reads this custom field
   - If the field exists and contains a valid store key, the seller is granted access to manage that store

This indirect association provides flexibility and allows for easier management of store access permissions.

## Getting Started

### Prerequisites
- commercetools project with appropriate API scopes
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
- `view_product_selections`
- `manage_product_selections`

## Development

For more information about developing Custom Applications, please refer to:
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)
