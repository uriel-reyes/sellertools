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

### Price Management
- Channel-specific pricing for products in a seller's store
- Update prices for individual products with real-time validation
- View both current (published) and staged (unpublished) prices
- Clear visual indication of products with and without pricing
- Automatically handles currency conversion and formatting
- Secure pricing updates with optimistic UI feedback
- Comprehensive error handling for duplicate price scopes and other validation issues
- Support for both new price creation and existing price updates

### Product Discount Management
- Create and manage store-specific product discounts
- Support for both percentage and fixed amount discount types
- Decimal precision for both discount types (percentages and monetary values)
- Apply discounts to all products or specific products based on various conditions
- Multiple condition types:
  - Product attributes (with various comparison operators)
  - Product SKUs (exact match, contains, etc.)
  - Category keys (with containment predicates)
- Combine multiple conditions with AND logic
- Intuitive user interface for building complex discount predicates
- Automatic handling of channel-specific discounts for the seller's store
- Sort order control to prioritize discounts
- Support for all commercetools product discount predicate operators:
  - Equality (=, !=)
  - Containment (contains)
  - Numeric comparisons (>, <)
- Proper handling of category predicates through the contains operator
- Real-time validation and feedback for discount creation

### Product Discount Implementation
The application provides a comprehensive interface for creating and managing product discounts:

```graphql
mutation CreateProductDiscount($draft: ProductDiscountDraft!) {
  createProductDiscount(draft: $draft) {
    id
    key
    name(locale: "en-US")
    description(locale: "en-US")
    value {
      ... on RelativeDiscountValue {
        permyriad
        type
      }
      ... on AbsoluteDiscountValue {
        money {
          centAmount
          currencyCode
        }
        type
      }
    }
    predicate
    sortOrder
    isActive
  }
}
```

The product discount system:
1. Creates channel-specific discounts for each seller's store
2. Supports both relative (percentage) and absolute (fixed amount) discount types:
   - Percentage discounts use the permyriad value (10000 = 100%)
   - Fixed amount discounts specify currency and cent amount
3. Builds complex product predicates with support for:
   - Channel-specific filtering (always included to limit to seller's products)
   - Product attributes with various operators (=, !=, >, <, contains)
   - SKU-based conditions with exact match or containment
   - Category-based conditions using proper containment predicates
4. Handles the different predicate operators required for different field types:
   - Standard fields use equality operators (=, !=)
   - Array fields like categories use containment operators (contains)
5. Provides a user-friendly interface for building these complex predicates
6. Implements proper validation and error handling for commercetools API requirements

This implementation ensures store-specific discounts are correctly applied with properly formatted predicates that handle all the various field types and comparison operators supported by commercetools.

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
   - This channel is used for both inventory distribution and store-specific pricing
   - Ensure the channel has roles of "InventorySupply" and "ProductDistribution"

3. **Product Selection Setup**:
   - Create a product selection with the same key as the store (e.g., `seller-store-1`)
   - This alignment of keys (store, channel, product selection) is essential for the application to function correctly

4. **Product Variant Configuration**:
   - The application manages pricing exclusively through the master variant (variantId: 1) of each product
   - All channel-specific prices are attached to the master variant
   - No additional product variants need to be created for seller-specific pricing
   - This approach simplifies price management while allowing seller-specific pricing through channels

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
- `manage_products`
- `view_orders`
- `manage_orders`
- `view_customers`
- `view_stores`
- `manage_stores`
- `view_product_selections`
- `manage_product_selections`
- `view_published_products`
- `view_product_discounts`
- `manage_product_discounts`

## Development

For more information about developing Custom Applications, please refer to:
- [commercetools Custom Applications Documentation](https://docs.commercetools.com/merchant-center-customizations/custom-applications)
- [commercetools UI Kit](https://uikit.commercetools.com/)
- [commercetools Frontend SDK](https://docs.commercetools.com/merchant-center-customizations)

### UI Components and Patterns

#### Standard Header Pattern
The application implements a consistent header pattern across all main section components (Products, Promotions, etc.) that should be followed when creating new sections:

1. **Header Container Structure**:
   ```jsx
   <div className={styles.header}>
     <div>
       {/* Left content */}
     </div>
     <Spacings.Inline scale="s">
       {/* Right content */}
     </Spacings.Inline>
   </div>
   ```

2. **Left Section Elements**:
   - Primary title using `<Text.Headline as="h1">`
   - Context information (store/channel key) using `<Text.Subheadline>`
   - Optional "Last refreshed" timestamp using `<Text.Detail tone="secondary">`
   - Optional action buttons specific to the section

3. **Right Section Elements**:
   - Utility buttons like "Refresh" using `<SecondaryButton>`
   - Primary navigation button (usually "Back to Dashboard") using `<PrimaryButton>`

4. **CSS Implementation**:
   ```css
   .header {
     display: flex;
     justify-content: space-between;
     align-items: center;
     margin-bottom: var(--spacing-l);
     padding-bottom: var(--spacing-m);
     border-bottom: 1px solid var(--color-neutral-60);
   }

   .storeKeyHighlight {
     font-weight: bold;
     color: var(--color-primary);
     padding: 0 4px;
   }
   ```

5. **Example Implementation**:
   ```jsx
   <div className={styles.header}>
     <div>
       <Text.Headline as="h1">{sectionTitle}</Text.Headline>
       <Text.Subheadline>
         Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
       </Text.Subheadline>
       {lastRefreshed && (
         <Text.Detail tone="secondary">
           Last refreshed: {lastRefreshed}
         </Text.Detail>
       )}
     </div>
     <Spacings.Inline scale="s">
       <SecondaryButton
         iconLeft={<RefreshIcon />}
         label="Refresh"
         onClick={handleRefresh}
         isDisabled={isLoading}
       />
       <PrimaryButton
         label="Back to Dashboard"
         onClick={onBack}
       />
     </Spacings.Inline>
   </div>
   ```

#### Form Sections Pattern
The application uses a consistent pattern for form-based sections (like Product Discount Form) that should be followed when creating new forms:

1. **Form Container Structure**:
   ```jsx
   <div className={styles.container}>
     <Spacings.Stack scale="l">
       <Spacings.Inline alignItems="center">
         <SecondaryButton
           label="Back"
           onClick={onBack}
           iconLeft={<BackIcon />}
         />
       </Spacings.Inline>
       
       <Text.Headline as="h2">{formTitle}</Text.Headline>
       
       {/* Notification area for success/error messages */}
       {successMessage && (
         <ContentNotification type="success">
           <Text.Body>{successMessage}</Text.Body>
         </ContentNotification>
       )}
       
       {/* Form sections */}
       <Card>
         <Spacings.Stack scale="m">
           <div className={styles.sectionTitle}>
             <Text.Subheadline as="h4">{sectionTitle}</Text.Subheadline>
           </div>
           
           <div className={styles.fieldGroup}>
             {/* Form fields */}
           </div>
         </Spacings.Stack>
       </Card>
       
       {/* Form action buttons */}
       <Spacings.Inline justifyContent="flex-end">
         <SecondaryButton
           label="Cancel"
           onClick={onBack}
           isDisabled={isSubmitting}
         />
         
         <PrimaryButton
           label="Submit"
           onClick={handleSubmit}
           isDisabled={!isValid || isSubmitting}
         />
       </Spacings.Inline>
     </Spacings.Stack>
   </div>
   ```

2. **CSS for Form Components**:
   ```css
   .container {
     padding: 1rem;
     width: 100%;
   }
   
   .sectionTitle {
     margin-bottom: var(--spacing-s);
   }
   
   .fieldGroup {
     display: flex;
     flex-direction: column;
     gap: var(--spacing-m);
   }
   ```

#### Data Table Layout Pattern
For sections displaying tabular data (like Products or Promotions list), use the following pattern:

1. **Table Container Structure**:
   ```jsx
   <div className={styles.tableContainer}>
     {isLoading ? (
       <div className={styles.loadingContainer}>
         <LoadingSpinner scale="l" />
         <Text.Body>Loading data...</Text.Body>
       </div>
     ) : error ? (
       <ErrorMessage>
         Error loading data: {error.message}
       </ErrorMessage>
     ) : data.length === 0 ? (
       <div className={styles.emptyState}>
         <Text.Headline as="h3">No data found</Text.Headline>
         <Text.Body>Empty state message here.</Text.Body>
       </div>
     ) : (
       <DataTable
         columns={columns}
         rows={data}
         maxHeight="600px"
       />
     )}
   </div>
   ```

2. **CSS for Table Layout**:
   ```css
   .tableContainer {
     width: 100%;
     border-radius: var(--border-radius-6);
     overflow: hidden;
     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
     margin-bottom: var(--spacing-m);
     position: relative;
   }
   
   .loadingContainer {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     padding: 40px 0;
     min-height: 300px;
   }
   
   .emptyState {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     padding: 40px 0;
     min-height: 300px;
     text-align: center;
   }
   ```

These UI patterns ensure visual consistency across the application, provide a familiar experience to users regardless of which section they are viewing, and establish clear design guidelines for future development. When creating new components or sections, developers should follow these patterns to maintain a cohesive user experience throughout the application.

### Error Handling
