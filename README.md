<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://commercetools.com/_build/images/logos/commercetools-logo-2024.svg?v4">
  </a>
</p>

# sellertools

sellertools is a powerful multi-vendor application built on the commercetools Merchant Center Apps framework, offering businesses the tools they need to streamline B2B2C, marketplace, franchise, field sales, and other multi-seller models. The platform provides third-party sellers with a dedicated dashboard featuring order management, intuitive product selection, store configuration tools, and promotional capabilities—empowering sellers to efficiently manage their complete business operations while maintaining brand consistency and operational control across your distributed selling network.

## Features

### Order Management
- Comprehensive order list, including a detailed view
  - Line item breakdown with pricing
  - Shipping and billing address information
  - Customer details for each order
- Real-time refresh of order data
- Interactive status dropdown for order state changes
- Real-time updates to the commercetools backend

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

- **Price Management**:
  - Channel-specific pricing for products in a seller's store
  - Clear visual indication of products with and without pricing

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

### Customer Management
- View customers associated with the seller's store
- Detailed customer profile information with intuitive card-based interface
- Address information displayed in user-friendly cards
- Recently placed orders displayed within the customer profile
- Custom fields display for extended customer information
- Streamlined account details for better focus on key information

### Store Configuration
- Complete store configuration management interface
- Update store information
- Custom fields support for extensible data storage

## Setup & Configuration

### Seller Setup

This application requires a specific configuration for stores, channels, and product selections:

1. **Store Creation**:
   - Create a store in commercetools with a unique key (e.g., `seller-store-1`)
   - The store key is used as the identifier for all seller-related operations

2. **Channel Alignment**:
   - Create a distribution channel with the same key as the store
   - Associate this channel with the store
   - Ensure the channel has roles of "InventorySupply" and "ProductDistribution"
   - This alignment is essential for proper pricing and product distribution

3. **Product Selection Setup**:
   - Create a product selection with the same key as the store
   - This alignment of keys (store, channel, product selection) is essential

4. **Product Variant Configuration**:
   - The application manages pricing exclusively through the master variant
   - All channel-specific prices are attached to the master variant
   - This approach simplifies price management while allowing seller-specific pricing

### Seller Association

Sellers (customers who manage stores) are not directly assigned to stores in this implementation. Instead:

1. **Custom Type Requirements**:
   - Create a custom type for customers named `seller-store-association`
   - Add a field named `store-key` of type String to this custom type
   - Label: "Store Key", Required: No

2. **Customer Configuration**:
   - Apply the custom type to seller customer records
   - Set the `store-key` field to match the store key they should manage

3. **Authentication Flow**:
   - When a seller logs in, the application reads this custom field
   - If valid, the seller is granted access to manage that store

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

### Business Unit as Seller Data Container

The business unit structure serves as the container for seller-specific information, enabling robust extensibility:

- Payment gateway credentials (e.g., Stripe account IDs)
- Shipping provider account information 
- Commission rates and payment terms
- Seller contact and support details

**Custom Type Framework**:
- Business units are extended with a `seller-store-configuration` custom type
- This type can be expanded with any field needed for seller operations
- Provides structured data storage with appropriate typing

**Data Access Pattern**:
- The `useCustomerBusinessUnits` hook provides a centralized access point
- Handles authentication, authorization, and data validation
- Maintains proper state management throughout the application

#### Adding New Seller Capabilities

To extend business units with new seller functionality:

1. Add necessary custom fields to the `seller-store-configuration` type
2. Update the configuration form to capture the new data
3. Integrate the new fields with relevant application features

This extensible approach enables the platform to rapidly adapt to different business models and seller requirements without requiring core application changes.

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

## UI & Implementation Patterns

The application implements consistent design and implementation patterns across all features:

### Enhanced User Experience
- **Search Experience**:
  - Persistent tables during search with loading indicators
  - Debounced search to prevent excessive API calls
  - Width-constrained search fields (600px maximum) for better visual balance

- **Table Rendering**:
  - Optimized column width distribution
  - Enhanced cell styling with proper overflow handling
  - Fixed image dimensions for consistent presentation
  - Responsive horizontal scrolling for small screen support

- **CSS Refinements**:
  - Table container improvements for proper width distribution
  - Box-sizing rules for consistent column rendering
  - Text overflow handling for long content in cells
  - Mobile-responsive adjustments for smaller screens

### Component Patterns
- **Header Components**:
  - Left section: Title and navigation elements
  - Right section: Action buttons and controls
  - Consistent context information display

- **Form Patterns**:
  - Card-based sectional layout
  - Consistent field spacing and validation
  - Standard button placement (Cancel on left, Submit on right)

- **Modal Patterns**:
  - Standardized header with title and close button
  - Properly padded content areas with appropriate scrolling
  - Size appropriate to content (small, medium, large)

### Error Handling
- **API Error Handling**:
  - GraphQL error extraction and formatting
  - Network error detection with appropriate messaging
  - Detailed error logging in development

- **Form Validation**:
  - Field-level validation with immediate feedback
  - Form-level validation before submission
  - Clear, actionable error messages

- **Optimistic UI Updates**:
  - Temporary state updates before API confirmation
  - Rollback on error with appropriate notifications
  - Loading indicators during async operations

### Performance Optimizations
- **Logging Control**:
  - Environment-aware logging (development vs. production)
  - Different log levels (log, info, warn, error, debug, performance)
  - Suppressed informational logs in production

## Development Resources
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)