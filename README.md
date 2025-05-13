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

### Seller Dashboard

The Seller Dashboard serves as the central hub for third-party sellers, providing easy access to all seller tools through an intuitive, card-based interface.

#### Dashboard Structure

- **Header Section**:
  - Clean, organized layout with prominent title
  - Logout button in the top-right corner for quick access
  - Business Unit Selector below the dashboard title for multi-business unit accounts

- **Business Unit Management**:
  - Dropdown selector for users with multiple business units
  - Displays all business units associated with the logged-in seller
  - Automatically selects the first business unit by default
  - Preserves selection between sessions for consistent user experience
  - Updates the store context throughout the application when changed

- **Technical Implementation**:
  - React context-based architecture:
    - `business-unit-context.tsx` manages business unit state
    - `auth-context.tsx` handles store selection and propagation
  - GraphQL integration for real-time data:
    - Fetches business units associated with the current user
    - Retrieves store information for each business unit
  - Performance optimizations:
    - Memoized business unit options
    - State update batching to prevent unnecessary renders
    - Store information caching to reduce API calls
    - Selective updates only when values change

- **Navigation Cards**:
  - Large, clearly labeled cards for easy access to different tools
  - Visual icons representing each functional area
  - Interactive hover effects for improved user experience
  - Streamlined navigation to specialized management views

#### Business Unit Selection Flow

The dashboard employs a sophisticated business unit selection mechanism:

1. **Initialization Process**:
   - On user login, the system fetches all business units associated with the user
   - For first-time users, it automatically selects the first business unit
   - For returning users, it restores their previous selection from session storage

2. **Store Context Handling**:
   - Each business unit is associated with specific stores in the commercetools platform
   - When a business unit is selected, the system fetches its associated stores
   - The first store is automatically set as the active store in the auth context
   - This active store context is used by all other components for queries and mutations

3. **State Persistence**:
   - Business unit selections are saved to session storage
   - This ensures consistent user experience across page refreshes and navigation
   - The system handles edge cases like deleted business units or changed associations

4. **User Experience**:
   - Clear visual feedback when switching between business units
   - Consistent store context across the entire application
   - Proper error handling for missing or inaccessible business units

The seller dashboard provides a unified entry point to all seller functionality while maintaining proper context isolation between different business units and their associated stores.

## Configuration Requirements

### Store Setup

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

### Customer Association

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

The Store Configuration feature now leverages a dynamic approach for business unit management:

1. **Customer-Based Business Unit Discovery**:
   - Business units are fetched based on the customer ID of the logged-in user
   - Uses GraphQL query with `associates(customer(id="..."))` filter
   - No hardcoded business unit IDs required in the codebase

2. **Multiple Business Units Support**:
   - Automatically handles scenarios where a customer is associated with multiple business units
   - Provides a dropdown selector for choosing between business units
   - Persists selections across user sessions

3. **Technical Implementation**:
   - Custom hook (`useCustomerBusinessUnits`) that manages the business unit lifecycle
   - GraphQL queries for both customer verification and business unit fetching
   - Support for updating business unit data with properly structured update actions
   - Proper error handling for various scenarios (missing customer ID, no business units, etc.)

This approach makes the application more flexible and maintainable by eliminating hardcoded references and supporting a wider range of business scenarios where sellers might be associated with multiple business units.

## UI Design Patterns

The application implements consistent UI patterns across all features to ensure a cohesive user experience:

### Enhanced Search Experience

The application features an optimized search user experience across product and price management:

- **Persistent Table During Search**:
  - Tables remain visible during active searches, maintaining context
  - Semi-transparent overlay with loading indicator provides visual feedback
  - Prevents disruptive UI shifts when performing searches
  - Implemented in both Product Management and Price Management

- **Search Field Optimization**:
  - Width-constrained search fields (600px maximum) for better visual balance
  - Properly debounced search to prevent excessive API calls
  - Immediate visual feedback for search operations

- **Table Rendering Improvements**:
  - Eliminated horizontal scrollbars with `overflow: hidden`
  - Optimized column width distribution (percentages add up to 100%)
  - Enhanced cell styling with proper overflow handling
  - Fixed image dimensions for consistent presentation
  - Added responsive horizontal scrolling for small screen support

- **CSS Refinements**:
  - Table container improvements to ensure proper width distribution
  - Box-sizing rules for consistent column rendering
  - Text overflow handling for long content in cells
  - Mobile-responsive adjustments for smaller screens

These UI enhancements create a more stable, responsive interface that maintains context during searches, reducing user confusion and providing clearer visual feedback throughout the application.

### Header Components

All section headers follow a consistent structure with:
- **Left Section**: Contains the title and navigation elements
  - Title (Text.Headline)
  - Back button (when applicable)
  - Context information (store/channel key)
- **Right Section**: Contains action buttons and controls
  - Primary actions (Add, Create, etc.)
  - Secondary actions (Refresh, Filter, etc.)

Example header implementation:
```jsx
<div className={styles.header}>
  <div>
    <Text.Headline as="h1">{sectionTitle}</Text.Headline>
    <Text.Subheadline>
      Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
    </Text.Subheadline>
  </div>
  <Spacings.Inline scale="s">
    <PrimaryButton
      label="Action" 
      onClick={handleAction}
      iconLeft={<PlusIcon />}
    />
  </Spacings.Inline>
</div>
```

### Form Patterns

Forms follow a card-based sectional layout:
- Each logical group of fields is contained in a separate Card component
- Section titles use consistent Text.Subheadline styling
- Consistent spacing (scale="m" for sections, scale="s" for fields)
- Standard field validation patterns with clear error messages
- Consistent button placement (Cancel on left, Submit on right)

Example form section:
```jsx
<Card>
  <Spacings.Stack scale="m">
    <div className={styles.sectionTitle}>
      <Text.Subheadline as="h4">Section Title</Text.Subheadline>
    </div>
    <Spacings.Stack scale="s">
      <TextField
        title="Field Label"
        value={value}
        onChange={handleChange}
        isRequired
        horizontalConstraint="scale"
      />
    </Spacings.Stack>
  </Spacings.Stack>
</Card>
```

### Data Tables

All data tables follow these patterns:
- Consistent column definitions with standardized cell formatters
- Unified selection behavior (checkbox in first column)
- Standard actions placement (right-aligned in the last column)
- Consistent loading and empty states
- Standardized pagination controls

### Modal Patterns

Modals follow a consistent implementation:
- Standardized header with title and close button
- Content area with proper padding and scrolling behavior
- Footer with consistently placed action buttons
- Size appropriate to content (small, medium, large)

## Error Handling

The application implements a comprehensive error handling strategy across all components:

### API Error Handling
- GraphQL error extraction and formatting for user-friendly display
- Network error detection and appropriate messaging
- Detailed error logging in the console for debugging

### Form Validation
- Field-level validation with immediate feedback
- Form-level validation before submission
- Clear error messages with actionable guidance

### Optimistic UI Updates
- Temporary state updates before API confirmation
- Rollback on error with appropriate notifications
- Loading indicators during async operations

### Error Presentation
- Consistent use of ContentNotification components for errors
- Contextual error messages based on operation type
- Different visual treatments for warnings vs. critical errors

Example error handling implementation:
```jsx
try {
  // API operation
  const result = await apiCall();
  setSuccessMessage("Operation completed successfully");
} catch (error) {
  // Error handling
  if (error.graphQLErrors?.length > 0) {
    const messages = error.graphQLErrors.map(err => err.message).join(", ");
    setError(`API Error: ${messages}`);
  } else if (error.networkError) {
    setError("Network error. Please check your connection and try again.");
  } else {
    setError(`Unexpected error: ${error.message}`);
  }
} finally {
  setLoading(false);
}
```

## Performance Optimizations

### Logging Control

The application implements a centralized logging utility to optimize performance and reduce console clutter in production:

- **Logging Utility**: Located in `src/utils/logger.ts`
- **Environment-Aware**: Automatically detects development vs. production environments
- **Log Levels**: Supports different logging levels (log, info, warn, error, debug, performance)
- **Production Behavior**: 
  - Informational logs are suppressed in production
  - Warnings appear with minimal information
  - Errors are always logged in full detail

This approach ensures that detailed logging is available during development while preventing excessive console output that could impact performance in production.

**Usage:**

```typescript
import logger from '../utils/logger';

// Instead of console.log:
logger.info(`Fetched ${products.length} products`);

// Critical errors are always logged:
logger.error('Failed to process order', error);

// Performance measurement:
const startTime = performance.now();
// ... operation to measure ...
logger.performance('Data processing', startTime);
```

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

### Error Handling

The implementation includes comprehensive error handling for both GraphQL and network errors:

- Detailed error logs for debugging
- Proper type checking and validation
- Custom error messages for different failure scenarios

This approach ensures that the Store Configuration remains robust and adaptable to different business scenarios while providing clear feedback during development and usage.

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