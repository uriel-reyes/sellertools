import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import styles from './products.module.css';

interface ProductsProps {
  storeKey: string;
  onBack: () => void;
}

// Product type definition
interface ProductData {
  id: string;
  name: string;
  image: string;
  sku: string;
  isSelected?: boolean;
}

// Custom cell renderer for the image column
const ImageCell = ({ value }: { value: string }) => (
  <div className={styles.imageCell}>
    <img src={value} alt="Product" className={styles.productImage} />
  </div>
);

// Custom cell renderer for the checkbox column
const CheckboxCell = ({ 
  isSelected, 
  onToggle,
  productId
}: { 
  isSelected?: boolean; 
  onToggle: () => void;
  productId: string;
}) => (
  <div className={styles.checkboxContainer}>
    <div className={styles.checkboxLabelHidden}>
      <label htmlFor={`product-${productId}`}>select product {productId}</label>
    </div>
    <label htmlFor={`product-${productId}`} className={styles.checkboxLabel}>
      <input 
        type="checkbox" 
        aria-checked={isSelected || false}
        id={`product-${productId}`}
        checked={isSelected || false}
        onChange={onToggle}
        className={styles.checkbox}
        value=""
      />
      <div className={styles.checkboxVisual}>
        <div className={isSelected ? styles.checkboxChecked : ''}></div>
      </div>
    </label>
  </div>
);

const Products: React.FC<ProductsProps> = ({ storeKey, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreProductsLoading, setIsStoreProductsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [storeProductsError, setStoreProductsError] = useState<Error | null>(null);
  const [masterProducts, setMasterProducts] = useState<ProductData[]>([]);
  const [storeProducts, setStoreProducts] = useState<ProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const { fetchStoreProducts } = useStoreProducts();
  
  const fetchMasterProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching products for master-store');
      const result = await fetchStoreProducts('master-store');
      
      if (result) {
        console.log(`Fetched ${result.length} products from master-store`);
        // Mark previously selected products
        const updatedProducts = result.map(product => ({
          ...product,
          isSelected: selectedProducts.includes(product.id)
        }));
        setMasterProducts(updatedProducts);
      } else {
        console.log('No products returned for master-store');
        setMasterProducts([]);
      }
    } catch (err) {
      console.error('Error fetching master-store products:', err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching master-store products'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserStoreProducts = async () => {
    if (!storeKey) return;
    
    setIsStoreProductsLoading(true);
    setStoreProductsError(null);
    
    try {
      console.log(`Fetching products for user store: ${storeKey}`);
      const result = await fetchStoreProducts(storeKey);
      
      if (result) {
        console.log(`Fetched ${result.length} products from user store: ${storeKey}`);
        setStoreProducts(result);
      } else {
        console.log(`No products returned for user store: ${storeKey}`);
        setStoreProducts([]);
      }
    } catch (err) {
      console.error(`Error fetching products for store ${storeKey}:`, err);
      setStoreProductsError(err instanceof Error ? err : new Error(`Unknown error fetching products for store ${storeKey}`));
    } finally {
      setIsStoreProductsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMasterProducts();
    fetchUserStoreProducts();
  }, [storeKey]);
  
  useEffect(() => {
    // Update selected state when selectedProducts changes
    setMasterProducts(prev => 
      prev.map(product => ({
        ...product,
        isSelected: selectedProducts.includes(product.id)
      }))
    );
  }, [selectedProducts]);
  
  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const columns = [
    { 
      key: 'select', 
      label: 'Select', 
      renderItem: (item: ProductData) => (
        <CheckboxCell 
          isSelected={item.isSelected} 
          onToggle={() => handleProductSelection(item.id)} 
          productId={item.id}
        />
      ),
      width: "90px"
    },
    { 
      key: 'image', 
      label: 'Image', 
      renderItem: (item: ProductData) => <ImageCell value={item.image} />,
      width: "120px"
    },
    { key: 'name', label: 'Product Name', width: "50%" },
    { key: 'sku', label: 'SKU', width: "30%" },
  ];
  
  const storeProductColumns = [
    { 
      key: 'image', 
      label: 'Image', 
      renderItem: (item: ProductData) => <ImageCell value={item.image} />,
      width: "120px"
    },
    { key: 'name', label: 'Product Name', width: "50%" },
    { key: 'sku', label: 'SKU', width: "30%" },
  ];

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Products</Text.Headline>
            <Text.Subheadline>
              Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
            </Text.Subheadline>
          </div>
          <Spacings.Inline scale="s">
            <SecondaryButton
              iconLeft={<RefreshIcon />}
              label="Refresh"
              onClick={() => {
                fetchMasterProducts();
                fetchUserStoreProducts();
              }}
              isDisabled={isLoading || isStoreProductsLoading}
            />
            <PrimaryButton
              label="Back to Dashboard"
              onClick={onBack}
            />
          </Spacings.Inline>
        </div>

        {selectedProducts.length > 0 && (
          <Spacings.Inline scale="s" justifyContent="flex-end">
            <Text.Body tone="secondary">
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
            </Text.Body>
            <PrimaryButton
              label={`Add ${selectedProducts.length} Selected Product${selectedProducts.length !== 1 ? 's' : ''} to Store`}
              onClick={() => {
                // TODO: Implement the action to add selected products to the store
                console.log(`Adding ${selectedProducts.length} products to store ${storeKey}`);
              }}
            />
          </Spacings.Inline>
        )}
        
        {/* Side-by-side tables layout */}
        <Spacings.Inline alignItems="stretch" scale="m">
          {/* Master Store Products Section */}
          <div className={styles.tableSection}>
            <Spacings.Stack scale="l">
              <Text.Subheadline as="h4">Master Store Products</Text.Subheadline>
              <Text.Body>Select products to add to your store</Text.Body>
              
              <Text.Body>Showing {masterProducts.length} products from master catalog</Text.Body>

              {isLoading ? (
                <div className={styles.loadingContainer}>
                  <LoadingSpinner scale="l" />
                  <Text.Body>Loading master products...</Text.Body>
                </div>
              ) : error ? (
                <ErrorMessage>
                  Error loading master products: {error.message}
                </ErrorMessage>
              ) : masterProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text.Headline as="h3">No master products found</Text.Headline>
                  <Text.Body>There are no products in the master catalog.</Text.Body>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <DataTable
                    columns={columns}
                    rows={masterProducts}
                    maxHeight="60vh"
                    maxWidth="100%"
                  />
                </div>
              )}
            </Spacings.Stack>
          </div>
          
          {/* Store Products Section */}
          <div className={styles.tableSection}>
            <Spacings.Stack scale="l">
              <Text.Subheadline as="h4">Your Store Products</Text.Subheadline>
              <Text.Body>Products currently in your store's catalog</Text.Body>
              
              <Text.Body>Showing {storeProducts.length} products from your store</Text.Body>

              {isStoreProductsLoading ? (
                <div className={styles.loadingContainer}>
                  <LoadingSpinner scale="l" />
                  <Text.Body>Loading store products...</Text.Body>
                </div>
              ) : storeProductsError ? (
                <ErrorMessage>
                  Error loading store products: {storeProductsError.message}
                </ErrorMessage>
              ) : storeProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <Text.Headline as="h3">No store products</Text.Headline>
                  <Text.Body>Select products from the master catalog to add them here.</Text.Body>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <DataTable
                    columns={storeProductColumns}
                    rows={storeProducts}
                    maxHeight="60vh"
                    maxWidth="100%"
                  />
                </div>
              )}
            </Spacings.Stack>
          </div>
        </Spacings.Inline>
      </Spacings.Stack>
    </div>
  );
};

export default Products; 