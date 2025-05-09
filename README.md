<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
</p>

# sellertools

sellertools is a powerful multi-vendor application built on the commercetools Merchant Center Apps framework, offering businesses the tools they need to streamline B2B2C, marketplace, franchise, field sales, and other multi-seller models. The platform provides third-party sellers with a dedicated dashboard featuring order management, intuitive product selection, store configuration tools, and promotional capabilities—empowering sellers to efficiently manage their complete business operations while maintaining brand consistency and operational control across your distributed selling network.

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

### Store Configuration
- Complete store configuration management interface
- Update store information:
  - Store name and branding details
  - Address information (street, city, state, zipcode)
  - Contact information (phone number)
  - Business hours (opening and closing times)
  - Payment processing details (Stripe Account ID)
- Real-time validation and feedback
- Automatic detection of changes with optimistic UI updates
- Robust error handling with clear user messaging
- BusinessUnit data integration with GraphQL
- Custom fields support for extensible data storage

### Order Management
- Comprehensive order listing with:
  - Date and time information
  - Order numbers and customer details
  - Order totals and status indicators
- Advanced filtering and sorting capabilities
- Real-time refresh of order data
- Enhanced order details view with:
  - Product images from commercetools platform
  - Line item breakdown with pricing
  - Shipping and billing address information
  - Customer details for each order
- Interactive status dropdown for order state changes
- Visual indicators for different order statuses
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
  - Advanced features:
    - Fuzzy matching enabled for partial word search
    - Locale-specific handling (en-US prioritized with fallbacks)
    - Zero-delay keystroke processing (immediate search triggering)
    - Advanced race condition handling:
      - Request abandonment for outdated searches when typing quickly
      - Search token tracking to process only the latest results
      - Pending search counter for proper loading state management
    - Robust error handling and recovery
    - Cache-busting for product images to prevent browser caching issues
    - Unique image identification via product ID to handle identical image URLs
  - User experience optimizations:
    - Immediate search feedback
    - Contextual empty state messaging based on search terms
    - Loading indicators during search operations
    - Result count display showing matches found

- **Product Creation**:
  - Form-based interface for creating new products
  - Direct integration with commercetools GraphQL API
  - Fields for name, description, SKU, price, and images
  - Automatic currency formatting and validation
  - Image URL preview functionality
  - Proper locale handling for multi-language support (en-us)
  - Automatic product publishing with `publish: true` flag
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
  - Automatic addition to the store's product selection

- **Price Management**:
  - Channel-specific pricing for products in a seller's store
  - Update prices for individual products with real-time validation
  - View both current (published) and staged (unpublished) prices
  - Clear visual indication of products with and without pricing
  - Secure pricing updates with optimistic UI feedback
  - Comprehensive validation for duplicate price scopes

### Promotion Management
- Create and manage store-specific product discounts
- Support for percentage and fixed amount discount types
- Apply discounts to all products or specific products with conditions:
  - Filter by SKUs or categories
  - Combine multiple conditions with AND logic
  - Channel-specific filtering for seller's products
- Status management with toggle controls for activation/deactivation
- Editing capabilities with pre-populated forms and field comparison
- Bulk actions (activate, deactivate, delete) with confirmation dialogs
- Delete functionality with proper resource cleanup
- User experience enhancements:
  - Money input with proper decimal handling
  - Streamlined UI with improved visual hierarchy
  - Real-time validation and feedback

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

The Store Configuration form currently supports two custom fields:

1. **Hours of Operation**: For setting the opening and closing times of the store
2. **Stripe Account ID**: For connecting the store to a payment processing account

This implementation can be extended to support additional custom fields based on project requirements. The form architecture allows for defining different sets of custom fields without modifying the core configuration component.

To add new custom fields, you would need to:
1. Define the custom type in commercetools
2. Update the form to handle the new fields
3. Add appropriate validation and transformers for the field type

This flexible approach makes the Store Configuration adaptable to different business needs across projects.

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

## Development Resources
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)
