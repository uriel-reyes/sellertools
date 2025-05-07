import React, { useEffect, useState, useRef } from 'react';
import { useIntl } from 'react-intl';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon, PlusBoldIcon, SearchIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import TextField from '@commercetools-uikit/text-field';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import messages from './messages';
import styles from './products.module.css';
import ProductForm from './product-form';
import { useAuthContext } from '../../contexts/auth-context';
import logger from '../../utils/logger';

interface ProductsProps {
  onBack: () => void;
  linkToWelcome: string;
}

// Product type definition
interface ProductData {
  id: string;
  name: string;
  image: string;
  sku: string;
  isSelected?: boolean;
}

// Interface for search filters
interface SearchFilterInput {
  model: string;
  value: any;
}

// Custom cell renderer for the image column
const ImageCell = ({ value }: { value: string }) => {
  const [error, setError] = useState(false);
  const imageUrl = value || 'https://via.placeholder.com/80';
  
  return (
    <div className={styles.imageCell}>
      <img 
        src={error ? 'https://via.placeholder.com/80' : imageUrl} 
        alt="Product" 
        className={styles.productImage}
        onError={() => {
          logger.error(`Failed to load image: ${imageUrl}`);
          setError(true);
        }}
      />
    </div>
  );
};

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

const Products: React.FC<ProductsProps> = ({ linkToWelcome, onBack }) => {
  const { storeKey } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreProductsLoading, setIsStoreProductsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [storeProductsError, setStoreProductsError] = useState<Error | null>(null);
  const [masterProducts, setMasterProducts] = useState<ProductData[]>([]);
  const [storeProducts, setStoreProducts] = useState<ProductData[]>([]);
  const [filteredStoreProducts, setFilteredStoreProducts] = useState<ProductData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStoreProducts, setSelectedStoreProducts] = useState<string[]>([]);
  const [isAddingProducts, setIsAddingProducts] = useState(false);
  const [isRemovingProducts, setIsRemovingProducts] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isStoreSearching, setIsStoreSearching] = useState(false);
  const [pendingSearches, setPendingSearches] = useState(0);
  
  // Refs for tracking the most recent search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storeSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestSearchQueryRef = useRef<string>('');
  
  const { fetchStoreProducts, addProductsToStore, removeProductsFromStore, createProduct, searchProducts } = useStoreProducts();
  
  const intl = useIntl();
  
  // Clean up the search timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (storeSearchTimeoutRef.current) {
        clearTimeout(storeSearchTimeoutRef.current);
      }
    };
  }, []);
  
  const fetchMasterProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      logger.info('Fetching products for master-store');
      const result = await fetchStoreProducts('master-store');
      
      if (result) {
        logger.info(`Fetched ${result.length} products from master-store`);
        // Mark previously selected products
        const updatedProducts = result.map(product => ({
          ...product,
          isSelected: selectedProducts.includes(product.id)
        }));
        const filteredProducts = updatedProducts.filter(product => !storeProducts.find(p => p.id === product.id));
        setMasterProducts(filteredProducts);
      } else {
        logger.info('No products returned for master-store');
        setMasterProducts([]);
      }
    } catch (err) {
      logger.error('Error fetching master-store products:', err);
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
      logger.info(`Fetching products for user store: ${storeKey}`);
      const result = await fetchStoreProducts(storeKey);
      
      if (result) {
        logger.info(`Fetched ${result.length} products from user store: ${storeKey}`);
        setStoreProducts(result);
      } else {
        logger.info(`No products returned for user store: ${storeKey}`);
        setStoreProducts([]);
      }
    } catch (err) {
      logger.error(`Error fetching products for store ${storeKey}:`, err);
      setStoreProductsError(err instanceof Error ? err : new Error(`Unknown error fetching products for store ${storeKey}`));
    } finally {
      setIsStoreProductsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserStoreProducts();
  }, [storeKey]);
  
  useEffect(() => {
    fetchMasterProducts();
  }, [storeProducts]);
  
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
      const success = await removeProductsFromStore(storeKey!, selectedStoreProducts);
      
      if (success) {
        // Refresh the store products to show the updated list
        await fetchUserStoreProducts();
        // Clear selections after successful removal
        setSelectedStoreProducts([]);
      }
    } catch (err) {
      logger.error('Error removing products from store:', err);
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

  // Handle product search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search is empty, fetch regular master products list
      fetchMasterProducts();
      return;
    }
    
    // Keep track of the current search query
    latestSearchQueryRef.current = searchQuery;
    
    // Increase the pending searches counter
    setPendingSearches(prev => prev + 1);
    setIsSearching(true);
    setError(null);
    
    // Store the current search query for this request
    const currentSearchQuery = searchQuery;
    
    try {
      logger.info(`Executing search with query: "${currentSearchQuery}"`);
      const searchResults = await searchProducts(currentSearchQuery);
      
      // Only process the results if this is still the latest search query
      if (currentSearchQuery !== latestSearchQueryRef.current) {
        logger.info('Search query changed since search started, abandoning results');
        return;
      }
      
      logger.info('Search results received:', searchResults);
      
      // Mark previously selected products
      const updatedProducts = searchResults.map(product => ({
        ...product,
        isSelected: selectedProducts.includes(product.id)
      }));
      
      // Don't filter out products already in store - just show all search results
      // This way users can see all matching products, even if they're already in their store
      setMasterProducts(updatedProducts);
    } catch (err) {
      // Only set error if this is still the latest search query
      if (currentSearchQuery === latestSearchQueryRef.current) {
        logger.error('Error searching products:', err);
        setError(err instanceof Error ? err : new Error('Error searching products'));
      }
    } finally {
      // Decrease the pending searches counter
      setPendingSearches(prev => {
        const newCount = prev - 1;
        // Only update loading state when all searches are done
        if (newCount === 0 && currentSearchQuery === latestSearchQueryRef.current) {
          setIsSearching(false);
        }
        return newCount;
      });
    }
  };

  // Set initial filtered store products
  useEffect(() => {
    setFilteredStoreProducts(storeProducts);
  }, [storeProducts]);
  
  // Filter store products based on search query
  const handleStoreSearch = () => {
    if (!storeSearchQuery.trim()) {
      setFilteredStoreProducts(storeProducts);
      return;
    }
    
    setIsStoreSearching(true);
    
    try {
      // Simple client-side filtering for store products
      const searchTermLower = storeSearchQuery.toLowerCase();
      logger.info(`Filtering store products with query: "${searchTermLower}"`);
      
      const filtered = storeProducts.filter(product => 
        product.name.toLowerCase().includes(searchTermLower) || 
        product.sku.toLowerCase().includes(searchTermLower)
      );
      
      logger.info(`Found ${filtered.length} store products matching "${storeSearchQuery}"`);
      
      // Update store products with filtered results
      setFilteredStoreProducts(filtered);
    } catch (error) {
      logger.error('Error during store product filtering:', error);
    } finally {
      setIsStoreSearching(false);
    }
  };

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        {view === 'form' ? (
          <ProductForm 
            channelKey={storeKey!}
            onBack={() => setView('list')}
            onSubmit={async (productData) => {
              const success = await createProduct(productData);
              if (success) {
                // Refresh product lists after creating a new product
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
                  
                  {/* Search bar */}
                  <div className={styles.searchContainer}>
                    <form 
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSearch();
                      }}
                      style={{ flex: 1, maxWidth: '600px' }}
                    >
                      <TextField
                        value={searchQuery}
                        onChange={(event) => {
                          const newValue = event.target.value;
                          setSearchQuery(newValue);
                          
                          // Immediately trigger search without debounce
                          if (!newValue.trim()) {
                            fetchMasterProducts();
                          } else {
                            handleSearch();
                          }
                        }}
                        title={intl.formatMessage(messages.searchButton)}
                        horizontalConstraint="scale"
                        placeholder="Search products..."
                      />
                    </form>
                  </div>
                  
                  <Text.Body>{intl.formatMessage(messages.masterProductsDescription)}</Text.Body>
                  
                  <Spacings.Inline justifyContent="space-between" alignItems="center">
                    <Text.Body>
                      {searchQuery
                        ? intl.formatMessage(messages.searchResults, { 
                            count: masterProducts.length,
                            query: searchQuery 
                          })
                        : intl.formatMessage(messages.masterProductsCount, { count: masterProducts.length })
                      }
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
                              const success = await addProductsToStore(storeKey!, selectedProducts);
                              
                              if (success) {
                                // Refresh the store products to show the newly added items
                                await fetchUserStoreProducts();
                                // Clear selections after successful addition
                                setSelectedProducts([]);
                              }
                            } catch (err) {
                              logger.error('Error adding products to store:', err);
                            } finally {
                              setIsAddingProducts(false);
                            }
                          }}
                          isDisabled={isAddingProducts}
                        />
                      </Spacings.Inline>
                    )}
                  </Spacings.Inline>

                  {isLoading || isSearching ? (
                    <div className={styles.loadingContainer}>
                      <LoadingSpinner scale="l" />
                      <Text.Body>{
                        isSearching 
                          ? intl.formatMessage(messages.searchingProducts) 
                          : intl.formatMessage(messages.loadingMasterProducts)
                      }</Text.Body>
                    </div>
                  ) : error ? (
                    <ErrorMessage>
                      {intl.formatMessage(messages.errorMasterProducts, { error: error.message })}
                    </ErrorMessage>
                  ) : masterProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Text.Headline as="h3">
                        {searchQuery 
                          ? intl.formatMessage(messages.noSearchResults, { query: searchQuery }) 
                          : intl.formatMessage(messages.noMasterProducts)
                        }
                      </Text.Headline>
                      <Text.Body>
                        {searchQuery 
                          ? intl.formatMessage(messages.tryDifferentSearch) 
                          : intl.formatMessage(messages.noMasterProductsDesc)
                        }
                      </Text.Body>
                    </div>
                  ) : (
                    <div className={styles.tableContainer}>
                      {isSearching && (
                        <div className={styles.searchOverlay}>
                          <LoadingSpinner scale="s" />
                          <Text.Body>{intl.formatMessage(messages.searchingProducts)}</Text.Body>
                        </div>
                      )}
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
                  
                  {/* Store Products Search bar */}
                  <div className={styles.searchContainer}>
                    <form 
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleStoreSearch();
                      }}
                      style={{ flex: 1, maxWidth: '600px' }}
                    >
                      <TextField
                        value={storeSearchQuery}
                        onChange={(event) => {
                          const newValue = event.target.value;
                          setStoreSearchQuery(newValue);
                          
                          // Immediately trigger search without debounce
                          if (!newValue.trim()) {
                            setFilteredStoreProducts(storeProducts);
                          } else {
                            handleStoreSearch();
                          }
                        }}
                        title={intl.formatMessage(messages.searchButton)}
                        horizontalConstraint="scale"
                        placeholder="Filter store products..."
                      />
                    </form>
                  </div>
                  
                  <Text.Body>{intl.formatMessage(messages.storeProductsDescription)}</Text.Body>
                  
                  <Spacings.Inline justifyContent="space-between" alignItems="center">
                    <Text.Body>
                      {storeSearchQuery
                        ? intl.formatMessage(messages.searchResults, { 
                            count: filteredStoreProducts.length,
                            query: storeSearchQuery 
                          })
                        : intl.formatMessage(messages.storeProductsCount, { count: storeProducts.length })
                      }
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

                  {isStoreProductsLoading || isStoreSearching ? (
                    <div className={styles.loadingContainer}>
                      <LoadingSpinner scale="l" />
                      <Text.Body>
                        {isStoreSearching
                          ? intl.formatMessage(messages.searchingProducts)
                          : intl.formatMessage(messages.loadingStoreProducts)
                        }
                      </Text.Body>
                    </div>
                  ) : storeProductsError ? (
                    <ErrorMessage>
                      {intl.formatMessage(messages.errorStoreProducts, { error: storeProductsError.message })}
                    </ErrorMessage>
                  ) : filteredStoreProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Text.Headline as="h3">
                        {storeSearchQuery
                          ? intl.formatMessage(messages.noSearchResults, { query: storeSearchQuery })
                          : intl.formatMessage(messages.noStoreProducts)
                        }
                      </Text.Headline>
                      <Text.Body>
                        {storeSearchQuery
                          ? intl.formatMessage(messages.tryDifferentSearch)
                          : intl.formatMessage(messages.noStoreProductsDesc)
                        }
                      </Text.Body>
                    </div>
                  ) : (
                    <div className={styles.tableContainer}>
                      {isStoreSearching && (
                        <div className={styles.searchOverlay}>
                          <LoadingSpinner scale="s" />
                          <Text.Body>{intl.formatMessage(messages.searchingProducts)}</Text.Body>
                        </div>
                      )}
                      <DataTable
                        columns={storeProductColumns}
                        rows={filteredStoreProducts}
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