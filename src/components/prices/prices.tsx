import React, { useEffect, useState, useRef } from 'react';
import { useIntl } from 'react-intl';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import usePriceManagement from '../../hooks/use-price-management/use-price-management';
import styles from './prices.module.css';

interface PricesProps {
  storeKey: string;
  onBack: () => void;
}

// Product type definition with price information
interface ProductPriceData {
  id: string;
  name: string;
  image: string;
  sku: string;
  version: number;
  currentPrice?: {
    id: string;
    value: number;
    currencyCode: string;
  };
}

// Custom cell renderer for the image column
const ImageCell = ({ value }: { value: string }) => (
  <div className={styles.imageContainer}>
    <img src={value} alt="Product" className={styles.productImage} />
  </div>
);

// Custom cell renderer for the price input
const PriceInputCell = ({ 
  product, 
  storeKey,
  onPriceChange 
}: { 
  product: ProductPriceData;
  storeKey: string;
  onPriceChange: (productId: string, version: number, price: number, channelKey: string, priceId?: string) => void;
}) => {
  const [price, setPrice] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    // Set the component as mounted
    isMounted.current = true;
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handlePriceSubmit = async () => {
    const numericPrice = parseFloat(price);
    if (!isNaN(numericPrice) && numericPrice > 0) {
      setIsUpdating(true);
      try {
        await onPriceChange(
          product.id, 
          product.version, 
          numericPrice, 
          storeKey, 
          product.currentPrice?.id
        );
      } finally {
        // Only update state if the component is still mounted
        if (isMounted.current) {
          setIsUpdating(false);
          // Clear the input field after successful submission
          setPrice('');
        }
      }
    }
  };

  return (
    <div className={styles.priceInputContainer}>
      <input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={handlePriceChange}
        placeholder="Enter price"
        className={styles.priceInput}
        disabled={isUpdating}
      />
      <PrimaryButton
        label={isUpdating ? "Updating..." : "Update"}
        onClick={handlePriceSubmit}
        isDisabled={isUpdating || !price || parseFloat(price) <= 0}
        size="small"
      />
    </div>
  );
};

const Prices: React.FC<PricesProps> = ({ storeKey, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [products, setProducts] = useState<ProductPriceData[]>([]);
  
  const { fetchProductsWithPrices, updateProductPrice } = usePriceManagement();
  
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchProductsWithPrices(storeKey);
      setProducts(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching products'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, [storeKey]);
  
  const handlePriceChange = async (
    productId: string, 
    version: number, 
    newPrice: number, 
    channelKey: string, 
    priceId?: string
  ) => {
    try {
      const success = await updateProductPrice(
        productId,
        version,
        newPrice,
        channelKey,
        priceId
      );
      
      if (success) {
        // Refresh the products list to show updated prices
        await fetchProducts();
      }
    } catch (err) {
      console.error('Error updating price:', err);
    }
  };
  
  const columns = [
    { 
      key: 'image', 
      label: 'Image', 
      renderItem: (item: ProductPriceData) => <ImageCell value={item.image} />,
      width: "80px"
    },
    { key: 'name', label: 'Product Name', width: "30%" },
    { key: 'sku', label: 'SKU', width: "15%" },
    { 
      key: 'currentPrice', 
      label: 'Current Price', 
      renderItem: (item: ProductPriceData) => (
        <Text.Body>
          {item.currentPrice 
            ? `$${item.currentPrice.value.toFixed(2)} ${item.currentPrice.currencyCode}`
            : 'Price not set'}
        </Text.Body>
      ),
      width: "15%"
    },
    { 
      key: 'newPrice', 
      label: 'New Price', 
      renderItem: (item: ProductPriceData) => (
        <PriceInputCell 
          product={item}
          storeKey={storeKey}
          onPriceChange={handlePriceChange} 
        />
      ),
      width: "20%"
    },
  ];

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Manage Prices</Text.Headline>
            <Text.Subheadline as="h4">
              Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
            </Text.Subheadline>
          </div>
          <Spacings.Inline scale="s">
            <SecondaryButton
              iconLeft={<RefreshIcon />}
              label="Refresh"
              onClick={fetchProducts}
              isDisabled={isLoading}
            />
            <PrimaryButton
              label="Back to Dashboard"
              onClick={onBack}
            />
          </Spacings.Inline>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading products and prices...</Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>
            Error loading products: {error.message}
          </ErrorMessage>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h3">No products found</Text.Headline>
            <Text.Body>There are no products in your store's catalog.</Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <DataTable
              columns={columns}
              rows={products}
              maxHeight="70vh"
              maxWidth="100%"
            />
          </div>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Prices; 