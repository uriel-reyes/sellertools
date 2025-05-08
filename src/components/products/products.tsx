import { PlusBoldIcon, RefreshIcon } from '@commercetools-uikit/icons';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAuthContext } from '../../contexts/auth-context';
import useStoreProducts from '../../hooks/use-store-products/use-store-products';
import logger from '../../utils/logger';
import MasterProductTable from './master-product-table';
import messages from './messages';
import ProductForm from './product-form';
import styles from './products.module.css';
import StoreProductTable from './store-product-table';
import { useProductWrapper } from './store-products-wrapper';

interface ProductsProps {
  onBack: () => void;
  linkToWelcome: string;
}

// Product type definition
export interface ProductData {
  id: string;
  name: string;
  image: string;
  sku: string;
  isSelected?: boolean;
}

// Custom cell renderer for the image column
export const ImageCell = ({ value }: { value: string }) => {
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
export const CheckboxCell = ({
  isSelected,
  onToggle,
  productId,
  tableId,
}: {
  isSelected?: boolean;
  onToggle: () => void;
  productId: string;
  tableId: string;
}) => (
  <div className={styles.checkboxContainer}>
    <div className={styles.checkboxLabelHidden}>
      <label htmlFor={`${tableId}-product-${productId}`}>
        select product {productId}
      </label>
    </div>
    <label
      htmlFor={`${tableId}-product-${productId}`}
      className={styles.checkboxLabel}
    >
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
  const [view, setView] = useState<'list' | 'form'>('list');

  // Refs for tracking the most recent search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storeSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { createProduct } = useStoreProducts({});
  const { fetchUserStoreProducts } = useProductWrapper();

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
                <Text.Headline as="h1">
                  {intl.formatMessage(messages.title)}
                </Text.Headline>
                <Text.Subheadline as="h4">
                  Store:{' '}
                  <span className={styles.storeKeyHighlight}>{storeKey}</span>
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
                />
                <PrimaryButton
                  label={intl.formatMessage(messages.backButton)}
                  onClick={onBack}
                />
              </Spacings.Inline>
            </div>

            {/* Side-by-side tables layout */}
            <Spacings.Inline alignItems="stretch" scale="m">
              <MasterProductTable />
              <StoreProductTable />
            </Spacings.Inline>
          </>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Products;
