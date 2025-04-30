import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon, PlusBoldIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import messages from './messages';
import styles from './products.module.css';
import ProductForm from './product-form';

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
  productId,
  tableId
}: { 
  isSelected?: boolean; 
  onToggle: () => void;
  productId: string;
  tableId: string;
}) => (
  <div className={styles.checkboxContainer}>
    <div className={styles.checkboxLabelHidden}>
      <label htmlFor={`${tableId}-product-${productId}`}>select product {productId}</label>
    </div>
    <label htmlFor={`${tableId}-product-${productId}`} className={styles.checkboxLabel}>
      <input 
        type="checkbox" 
        aria-checked={isSelected || false}
        id={`${tableId}-product-${productId}`}
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
  const [selectedStoreProducts, setSelectedStoreProducts] = useState<string[]>([]);
  const [isAddingProducts, setIsAddingProducts] = useState(false);
  const [isRemovingProducts, setIsRemovingProducts] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  const { fetchStoreProducts, addProductsToStore, removeProductsFromStore, createProduct } = useStoreProducts();
  
  const intl = useIntl();
  
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
  
  // Similar effect for store products selection
  useEffect(() => {
    setStoreProducts(prev => 
      prev.map(product => ({
        ...product,
        isSelected: selectedStoreProducts.includes(product.id)
      }))
    );
  }, [selectedStoreProducts]);
  
  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const handleStoreProductSelection = (productId: string) => {
    setSelectedStoreProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const handleRemoveProductsFromStore = async () => {
    if (!selectedStoreProducts.length) return;
    
    setIsRemovingProducts(true);
    try {
      const success = await removeProductsFromStore(storeKey, selectedStoreProducts);
      
      if (success) {
        // Refresh the store products to show the updated list
        await fetchUserStoreProducts();
        // Clear selections after successful removal
        setSelectedStoreProducts([]);
      }
    } catch (err) {
      console.error('Error removing products from store:', err);
    } finally {
      setIsRemovingProducts(false);
    }
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
          tableId="master"
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
      key: 'select', 
      label: 'Select', 
      renderItem: (item: ProductData) => (
        <CheckboxCell 
          isSelected={item.isSelected} 
          onToggle={() => handleStoreProductSelection(item.id)} 
          productId={item.id}
          tableId="store"
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

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        {view === 'form' ? (
          <ProductForm 
            channelKey={storeKey}
            onBack={() => setView('list')}
            onSubmit={async (productData) => {
              const success = await createProduct(productData);
              if (success) {
                // Refresh product lists after creating a new product
                fetchMasterProducts();
                fetchUserStoreProducts();
                setView('list');
              }
            }}
          />
        ) : (
          <>
            <div className={styles.header}>
              <div>
                <Text.Headline as="h1">{intl.formatMessage(messages.title)}</Text.Headline>
                <Text.Subheadline as="h4">
                  Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
                </Text.Subheadline>
                <div className={styles.actionButtonContainer}>
                  <PrimaryButton
                    label={intl.formatMessage(messages.addProduct)}
                    onClick={() => setView('form')}
                    iconLeft={<PlusBoldIcon />}
                    size="small"
                  />
                </div>
              </div>
              <Spacings.Inline scale="s">
                <SecondaryButton
                  iconLeft={<RefreshIcon />}
                  label={intl.formatMessage(messages.refreshButton)}
                  onClick={() => {
                    fetchMasterProducts();
                    fetchUserStoreProducts();
                  }}
                  isDisabled={isLoading || isStoreProductsLoading}
                />
                <PrimaryButton
                  label={intl.formatMessage(messages.backButton)}
                  onClick={onBack}
                />
              </Spacings.Inline>
            </div>

            {/* Side-by-side tables layout */}
            <Spacings.Inline alignItems="stretch" scale="m">
              {/* Master Store Products Section */}
              <div className={styles.tableSection}>
                <Spacings.Stack scale="l">
                  <Text.Subheadline as="h4">{intl.formatMessage(messages.masterProductsTitle)}</Text.Subheadline>
                  <Text.Body>{intl.formatMessage(messages.masterProductsDescription)}</Text.Body>
                  
                  <Spacings.Inline justifyContent="space-between" alignItems="center">
                    <Text.Body>
                      {intl.formatMessage(messages.masterProductsCount, { count: masterProducts.length })}
                    </Text.Body>
                    
                    {selectedProducts.length > 0 && (
                      <Spacings.Inline scale="s" alignItems="center">
                        <Text.Body tone="secondary">
                          {intl.formatMessage(messages.selectedProducts, {
                            count: selectedProducts.length,
                            plural: selectedProducts.length !== 1 ? 's' : ''
                          })}
                        </Text.Body>
                        <PrimaryButton
                          label={isAddingProducts 
                            ? intl.formatMessage(messages.adding) 
                            : intl.formatMessage(messages.addToStore)
                          }
                          onClick={async () => {
                            if (selectedProducts.length === 0) return;
                            
                            setIsAddingProducts(true);
                            try {
                              const success = await addProductsToStore(storeKey, selectedProducts);
                              
                              if (success) {
                                // Refresh the store products to show the newly added items
                                await fetchUserStoreProducts();
                                // Clear selections after successful addition
                                setSelectedProducts([]);
                              }
                            } catch (err) {
                              console.error('Error adding products to store:', err);
                            } finally {
                              setIsAddingProducts(false);
                            }
                          }}
                          isDisabled={isAddingProducts}
                        />
                      </Spacings.Inline>
                    )}
                  </Spacings.Inline>

                  {isLoading ? (
                    <div className={styles.loadingContainer}>
                      <LoadingSpinner scale="l" />
                      <Text.Body>{intl.formatMessage(messages.loadingMasterProducts)}</Text.Body>
                    </div>
                  ) : error ? (
                    <ErrorMessage>
                      {intl.formatMessage(messages.errorMasterProducts, { error: error.message })}
                    </ErrorMessage>
                  ) : masterProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Text.Headline as="h3">{intl.formatMessage(messages.noMasterProducts)}</Text.Headline>
                      <Text.Body>{intl.formatMessage(messages.noMasterProductsDesc)}</Text.Body>
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
                  <Text.Subheadline as="h4">{intl.formatMessage(messages.storeProductsTitle)}</Text.Subheadline>
                  <Text.Body>{intl.formatMessage(messages.storeProductsDescription)}</Text.Body>
                  
                  <Spacings.Inline justifyContent="space-between" alignItems="center">
                    <Text.Body>
                      {intl.formatMessage(messages.storeProductsCount, { count: storeProducts.length })}
                    </Text.Body>
                    
                    {selectedStoreProducts.length > 0 && (
                      <Spacings.Inline scale="s" alignItems="center">
                        <Text.Body tone="secondary">
                          {intl.formatMessage(messages.selectedProducts, {
                            count: selectedStoreProducts.length,
                            plural: selectedStoreProducts.length !== 1 ? 's' : ''
                          })}
                        </Text.Body>
                        <SecondaryButton
                          label={isRemovingProducts 
                            ? intl.formatMessage(messages.removing) 
                            : intl.formatMessage(messages.removeFromStore)
                          }
                          onClick={handleRemoveProductsFromStore}
                          isDisabled={isRemovingProducts}
                        />
                      </Spacings.Inline>
                    )}
                  </Spacings.Inline>

                  {isStoreProductsLoading ? (
                    <div className={styles.loadingContainer}>
                      <LoadingSpinner scale="l" />
                      <Text.Body>{intl.formatMessage(messages.loadingStoreProducts)}</Text.Body>
                    </div>
                  ) : storeProductsError ? (
                    <ErrorMessage>
                      {intl.formatMessage(messages.errorStoreProducts, { error: storeProductsError.message })}
                    </ErrorMessage>
                  ) : storeProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Text.Headline as="h3">{intl.formatMessage(messages.noStoreProducts)}</Text.Headline>
                      <Text.Body>{intl.formatMessage(messages.noStoreProductsDesc)}</Text.Body>
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
          </>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Products; 