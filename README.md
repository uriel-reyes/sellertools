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
- Support for both percentage and fixed amount discount types:
  - Percentage discounts use permyriad value (10000 = 100%)
  - Fixed amount discounts specify currency and cent amount
- Apply discounts to all products or specific products based on conditions
- Multiple condition types with operators:
  - Product SKUs with various operators (is, is not, contains, does not contain)
  - Category keys with containment predicates
- Combine multiple conditions with AND logic
- Channel-specific filtering for seller's products
- Sort order control to prioritize discounts
- Real-time validation and feedback
- **Active Status Management**:
  - Interactive toggle controls to immediately activate or deactivate promotions
  - Visual status indicators showing current state (active/inactive)
  - Optimistic UI updates with backend synchronization
  - Prevention of race conditions through toggle state tracking
  - Automatic data refresh after status changes
  - Real-time error handling with clear user feedback
- **Promotion Editing**:
  - Edit existing promotions by clicking on their row in the table
  - All fields are available for modification including name, description, and conditions
  - Pre-populated form with existing promotion values
  - Intelligent comparison to only send changed fields to the API
  - Proper handling of different discount types (percentage vs. fixed amount)
  - Support for parsing and editing existing promotion predicates
- **Multi-select and Bulk Actions**:
  - Select multiple promotions using checkboxes in the table
  - Bulk action dropdown with options to Activate, Deactivate, or Delete multiple promotions
  - Confirmation dialogs to prevent accidental bulk operations
  - Efficient batch processing of multiple promotions
  - Clear feedback on bulk operation results
- **Delete Functionality**:
  - Individual promotion deletion via actions menu
  - Bulk deletion of multiple selected promotions
  - Confirmation dialogs to prevent accidental deletion
  - Proper cleanup of promotion resources in commercetools
- **Enhanced User Experience**:
  - Improved money input field for fixed amount discounts
  - Native number input controls with proper decimal handling
  - Support for entering precise dollar amounts (e.g., $12.25)
  - Proper conversion between dollars and cents for the commercetools API
  - Consistent formatting and input validation
  - Simplified and streamlined UI with improved visual hierarchy
  - Automatic retry mechanism for handling sort order conflicts

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

The Store Configuration form has been designed to be scalable and adaptable to different project requirements. This section explains how to extend it to support additional or different custom fields.

### Current Implementation

The current Store Configuration component (`src/components/configuration/configuration.tsx`) handles:

1. **Basic Store Information**:
   - Store name from BusinessUnit

2. **Address Information**:
   - Street number, street name, city, state, zipcode, phone number

3. **Custom Fields**:
   - Hours of operation (opening and closing times)
   - Stripe Account ID

### Making the Form Scalable

To make the Store Configuration form support different custom fields based on project requirements:

#### 1. Dynamic Custom Field Detection

Implement a dynamic approach to detect and render custom fields:

```typescript
// Example of dynamic custom field handling
useEffect(() => {
  if (businessUnit && businessUnit.custom && businessUnit.custom.customFieldsRaw) {
    // Create a map of all available custom fields
    const customFieldsMap = businessUnit.custom.customFieldsRaw.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {} as Record<string, any>);
    
    // Update form state with all detected custom fields
    setFormCustomFields(customFieldsMap);
  }
}, [businessUnit]);
```

#### 2. Custom Field Registry

Create a registry of supported custom fields with their UI components:

```typescript
// Custom field registry with field definitions
const CUSTOM_FIELD_REGISTRY = {
  'hours-of-operation': {
    type: 'timeRange',
    label: 'Hours of Operation',
    component: TimeRangeField,
    valueTransformer: (value) => [value[0].substring(0, 5), value[1].substring(0, 5)],
    submitTransformer: (value) => [`${value[0]}:00`, `${value[1]}:00`],
  },
  'stripeAccountId': {
    type: 'text',
    label: 'Stripe Account ID',
    component: TextField,
    description: 'Your Stripe payment processing account ID',
  },
  // Add more custom fields as needed
};
```

#### 3. Dynamic Field Rendering

Render fields dynamically based on the registry:

```jsx
// Dynamic field rendering example
{Object.entries(CUSTOM_FIELD_REGISTRY).map(([fieldName, fieldConfig]) => {
  const FieldComponent = fieldConfig.component;
  return (
    <FieldComponent
      key={fieldName}
      title={intl.formatMessage({ id: `Configuration.${fieldName}`, defaultMessage: fieldConfig.label })}
      value={formData[fieldName] || ''}
      onChange={handleCustomFieldChange(fieldName)}
      description={fieldConfig.description}
      horizontalConstraint={13}
      isDisabled={isSaving}
    />
  );
})}
```

#### 4. Project-Specific Configuration

Create a project-specific configuration file to define which custom fields should be enabled:

```typescript
// src/config/store-config-fields.ts
export const ENABLED_CUSTOM_FIELDS = [
  'hours-of-operation',
  'stripeAccountId',
  // Project-specific fields
  'deliveryRadius',
  'minimumOrderValue',
  'acceptedPaymentMethods',
];

// Conditionally include fields based on project
export const shouldShowField = (fieldName: string): boolean => {
  return ENABLED_CUSTOM_FIELDS.includes(fieldName);
};
```

#### 5. Field Type Handling

Implement handlers for different field types:

```typescript
// Field type-specific handlers
const getFieldHandler = (fieldType: string) => {
  switch (fieldType) {
    case 'timeRange':
      return handleTimeRangeChange;
    case 'multiSelect':
      return handleMultiSelectChange;
    case 'money':
      return handleMoneyChange;
    default:
      return handleTextChange;
  }
};
```

#### 6. Custom Field Value Processing

Implement proper transformers for saving different field types:

```typescript
// Prepare custom fields for saving
const prepareCustomFieldsForSave = () => {
  const customFields: Record<string, any> = {};
  
  Object.entries(formData.customFields || {}).forEach(([fieldName, fieldValue]) => {
    const fieldConfig = CUSTOM_FIELD_REGISTRY[fieldName];
    if (fieldConfig && fieldConfig.submitTransformer) {
      // Transform the value using field-specific logic
      customFields[fieldName] = fieldConfig.submitTransformer(fieldValue);
    } else {
      // Use the value as-is
      customFields[fieldName] = fieldValue;
    }
  });
  
  return customFields;
};
```

### Implementation Steps for New Custom Fields

To add a new custom field to the Store Configuration form:

1. **Define the Custom Type in commercetools**:
   - Create or update the BusinessUnit custom type with the new field

2. **Add to Field Registry**:
   - Add the field definition to the CUSTOM_FIELD_REGISTRY
   - Define appropriate component, label, and transformers

3. **Add to Enabled Fields**:
   - Add the field name to ENABLED_CUSTOM_FIELDS in the config

4. **Add Localization**:
   - Add labels and placeholders to messages.ts for internationalization

5. **Implement Field-Specific Logic**:
   - Add any special handling required for the field type

6. **Test the Field Functionality**:
   - Verify the field appears correctly
   - Confirm data is saved and retrieved properly

This architecture allows for completely different custom fields in different projects without modifying the core configuration component.

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
