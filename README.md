<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# sellertools

sellertools is a powerful multi-vendor application built on the commercetools Merchant Center Apps framework, offering businesses the tools they need to streamline B2B2C, marketplace, franchise, field sales, and other multi-seller models. The platform provides third-party sellers with a dedicated dashboard featuring order management, intuitive product selection, store configuration tools, and promotional capabilities—empowering sellers to efficiently manage their complete business operations while maintaining brand consistency and operational control across your distributed selling network.

## Purpose

sellertools addresses the needs of businesses operating multi-seller models by providing a unified management interface built on commercetools. The application enables:

- Streamlined management across multiple business models (B2B2C, marketplaces, franchises, field sales, and more!)
- Empowerment of individual sellers with their own dedicated management tools
- Scalable architecture that adapts to different business requirements
- Simplified integration with the commercetools ecosystem

Third-party sellers can use the platform to:
- View and manage orders specific to their store
- Track order statuses and update them as needed
- Access customer information associated with their orders
- Manage product selections and pricing for their store
- Create and manage store-specific promotions
- View sales reporting
- View, manage and edit store content such as banners, logos, images and more

## Features

### Store Configuration
- Complete store configuration management interface
- Update store information
- Custom fields support for extensible data storage

### Order Management
- Comprehensive order list, including a detailed view
  - Line item breakdown with pricing
  - Shipping and billing address information
  - Customer details for each order
- Real-time refresh of order data
- Interactive status dropdown for order state changes
- Real-time updates to the commercetools backend

### Customer Management
- View customers associated with the seller's store
- Detailed customer profile information with intuitive card-based interface
- Address information displayed in user-friendly cards
- Recently placed orders displayed within the customer profile
- Custom fields display for extended customer information
- Streamlined account details for better focus on key information

### Product Management
- **Product Selection**:
  - Dual-table interface for managing product selections
  - View master catalog products and your store's current selection
  - Add products to your store with a single click
  - Remove products from your store's selection
  - Real-time updates with synchronization to commercetools
  - Selection checkboxes with clear visual feedback

- **Product Search**:
  - Powerful real-time search across both tables:
    - Master Products Search: GraphQL-based search on the commercetools API
    - Store Products Search: Client-side filtering of the store's products
  - Implementation details:
    ```graphql
    # GraphQL search query structure
    query ProductSearch($text: String, $filter: [SearchFilterInput!]) {
      productProjectionSearch(
        markMatchingVariants: true
        text: $text
        filters: $filter
        locale: "en-US"
        limit: 20
        fuzzy: true
      ) {
        results {
          id
          nameAllLocales {
            locale
            value
          }
          masterVariant {
            sku
            images {
              url
            }
          }
        }
      }
    }
    ```

- **Product Creation**:
  - Form-based interface for creating new products
  - Image URL preview functionality
  - Automatic addition to the store's product selection
  - Proper implementation of commercetools' money format:
    ```graphql
    prices: [{
      value: {
        centPrecision: {
          currencyCode: "USD",
          centAmount: 1000
        }
      }
    }]
    ```

- **Price Management**:
  - Channel-specific pricing for products in a seller's store
  - Clear visual indication of products with and without pricing

### Promotion Management
- Create and manage store-specific product discounts
- Support for percentage and fixed amount discount types
- Apply discounts to all products or specific products with conditions:
  - Filter by SKUs or categories
- Combine multiple conditions with AND logic
- Channel-specific filtering for seller's products
- Status management with toggle controls for activation/deactivation
- Editing capabilities with pre-populated forms and field comparison
- Bulk actions (activate, deactivate, delete)

### Business Unit Integration

The application employs a sophisticated business unit selection mechanism:

#### Customer-Based Business Unit Discovery
- Business units are fetched based on the customer ID of the logged-in user
- Uses GraphQL query with `associates(customer(id="..."))` filter
- No hardcoded business unit IDs required in the codebase

#### Multiple Business Units Support
- Automatically handles scenarios where a customer is associated with multiple business units
- Dropdown selector for choosing between business units
- Preserves selection between sessions for consistent user experience
- Automatically selects the first business unit by default

#### Store Context Handling
- Each business unit is associated with specific stores in the commercetools platform
- When a business unit is selected, the system fetches its associated stores
- The first store is automatically set as the active store in the auth context
- This active store context is used by all other components for queries and mutations

#### Technical Implementation
- React context-based architecture:
  - `business-unit-context.tsx` manages business unit state
  - `auth-context.tsx` handles store selection and propagation
- Custom hook (`useCustomerBusinessUnits`) that manages the business unit lifecycle
- GraphQL integration for real-time data fetching
- Performance optimizations:
  - Memoized business unit options
  - State update batching to prevent unnecessary renders
  - Store information caching to reduce API calls

This approach makes the application more flexible and maintainable by eliminating hardcoded references and supporting a wider range of business scenarios where sellers might be associated with multiple business units.

## Extending the Store Configuration

The Store Configuration form supports capturing and updating business unit data including address information and custom fields. The implementation leverages the `useCustomerBusinessUnits` hook which provides a robust GraphQL-based approach for managing business unit data.

### Required Setup for Business Unit Mutations

To properly implement and extend the business unit functionality, the following configurations are required:

1. **Custom Type for Store Configuration**:
   - Create a custom type with key `seller-store-configuration` in commercetools
   - Add fields for any store-specific configuration data:
     - `hours-of-operation`: Field type String (for store opening hours)
     - `stripe-account-id`: Field type String (for payment processing)

2. **GraphQL Schema Permissions**:
   - Ensure your API client has the following permissions:
     - `view_business_units` - Required for fetching business units
     - `manage_business_units` - Required for updating business units

3. **Business Unit Structure**:
   - The implementation assumes a business unit structure with:
     - At least one address per business unit (the first address is used by default)
     - Default address fields: streetNumber, streetName, city, state, postalCode, phone
     - Country code (defaults to "US" in the current implementation)

4. **Mutation Structure**:
   - The mutation implementation builds proper update actions:
   
   ```graphql
   mutation UpdateBusinessUnit($id: String!, $version: Long!, $actions: [BusinessUnitUpdateAction!]!) {
     updateBusinessUnit(id: $id, version: $version, actions: $actions) {
       id
       version
       name
       addresses {
         id
         streetNumber
         streetName
         city
         state
         postalCode
         phone
         country
       }
       custom {
         customFieldsRaw {
           name
           value
         }
       }
     }
   }
   ```

   - For address updates, it uses either:
     - `changeAddress` action when an existing address is found
     - `addAddress` action when no address exists yet
   
   - For custom fields, it uses either:
     - `setCustomType` action when no custom type is assigned yet
     - `setCustomField` actions for individual field updates when the type exists

### Extending with Additional Fields

To add new custom fields to the business unit configuration:

1. **Update the custom type in commercetools**:
   - Add new field definitions to the `seller-store-configuration` type

2. **Update the form component**:
   - Add new form fields in the UI component
   - Include the new fields in the state management

3. **Include the new fields in the update operation**:
   - When calling `updateBusinessUnit`, include the new fields in the customFields object:
   
   ```javascript
   const result = await updateBusinessUnit(
     selectedBusinessUnit.id,
     addressData,
     {
       'hours-of-operation': hoursOfOperation,
       'stripe-account-id': stripeAccountId,
       'your-new-field': newFieldValue,
     }
   );
   ```

The hook automatically handles proper conversion of the field values to JSON strings and builds the correct mutation actions based on whether the custom type already exists on the business unit.

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

### Required API Scopes

Ensure you have the following scopes configured in your custom-application-config.mjs:
- `view_products`, `manage_products`
- `view_orders`, `manage_orders`
- `view_customers`
- `view_stores`, `manage_stores`
- `view_product_selections`, `manage_product_selections`
- `view_published_products`
- `view_product_discounts`, `manage_product_discounts`
- `view_business_units`, `manage_business_units`

## Development Resources
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)