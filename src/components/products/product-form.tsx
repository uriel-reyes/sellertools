import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import TextField from '@commercetools-uikit/text-field';
import NumberInput from '@commercetools-uikit/number-input';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { BackIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import { v4 as uuidv4 } from 'uuid';
import messages from './messages';
import styles from './products.module.css';

interface ProductFormProps {
  channelKey: string;
  onBack: () => void;
  onSubmit: (data: any) => void;
}

// Product type definition (from provided JSON)
const PRODUCT_TYPE_ID = '73ff8823-7771-45c8-89bd-acb7521c42bf';

// Product data structure
interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  price: string;
  imageUrl: string;
  imageLabel: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  channelKey,
  onBack,
  onSubmit
}) => {
  const intl = useIntl();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    price: '0.00',
    imageUrl: '',
    imageLabel: 'Product Image'
  });

  // Handle form input changes
  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Price input handler with formatting
  const [priceInputValue, setPriceInputValue] = useState<string>('0.00');

  const handlePriceChange = (value: string) => {
    // Update displayed value immediately for user feedback
    setPriceInputValue(value);
    
    // Process for actual data - remove non-numeric chars except decimal point
    const validInput = value.replace(/[^\d.]/g, '');
    
    // Handle special cases for incomplete inputs
    if (validInput === '' || validInput === '.') {
      handleInputChange('price', '0');
      return;
    }
    
    // Ensure only one decimal point
    const parts = validInput.split('.');
    let formattedValue = validInput;
    if (parts.length > 2) {
      formattedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Parse and update
    const parsedValue = parseFloat(formattedValue);
    if (!isNaN(parsedValue)) {
      handleInputChange('price', parsedValue.toString());
    }
  };

  // Form validation
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.sku.trim() !== '' &&
      parseFloat(formData.price) > 0
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Generate a unique slug
      const slug = `product_slug_${uuidv4()}`;
      
      // Convert price to cent amount (multiply by 100)
      const priceValue = Math.round(parseFloat(formData.price) * 100);
      
      // Construct the product draft
      const productDraft = {
        productType: {
          id: PRODUCT_TYPE_ID,
          typeId: "product-type"
        },
        name: [
          { locale: "en-us", value: formData.name }
        ],
        description: [
          { locale: "en-us", value: formData.description || " " }
        ],
        slug: [
          { locale: "en-us", value: slug }
        ],
        masterVariant: {
          sku: formData.sku,
          prices: [
            {
              value: {
                centPrecision: {
                  currencyCode: "USD",
                  centAmount: priceValue
                }
              },
              channel: {
                typeId: "channel",
                key: "uri-store"
              }
            }
          ],
          images: formData.imageUrl ? [
            {
              url: formData.imageUrl,
              label: "Product Image",
              dimensions: {
                width: 500,
                height: 500
              }
            }
          ] : []
        },
        variants: [],
        publish: true
      };
      
      console.log('Submitting product:', productDraft);
      
      // Call the onSubmit callback
      await onSubmit(productDraft);
      
      // Show success message
      setSuccessMessage(intl.formatMessage(messages.productCreateSuccess));
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        sku: '',
        price: '0.00',
        imageUrl: '',
        imageLabel: 'Product Image'
      });
      setPriceInputValue('0.00');
      
      // Go back to the product list after a delay
      setTimeout(() => {
        onBack();
      }, 2000);
      
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err instanceof Error ? err.message : 'Unknown error creating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Spacings.Stack scale="l">
        <Spacings.Inline alignItems="center">
          <SecondaryButton
            label={intl.formatMessage(messages.backButton)}
            onClick={onBack}
            iconLeft={<BackIcon />}
          />
        </Spacings.Inline>
        
        <Text.Headline as="h2">{intl.formatMessage(messages.createProduct)}</Text.Headline>
        
        {successMessage && (
          <ContentNotification type="success">
            <Text.Body>{successMessage}</Text.Body>
          </ContentNotification>
        )}
        
        {error && (
          <ContentNotification type="error">
            <Text.Body>{error}</Text.Body>
          </ContentNotification>
        )}
        
        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">{intl.formatMessage(messages.productBasicInfo)}</Text.Subheadline>
            </div>
            
            <Spacings.Stack scale="s">
              <TextField
                title={intl.formatMessage(messages.productName)}
                value={formData.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                isRequired
                horizontalConstraint="scale"
              />
              
              <TextField
                title={intl.formatMessage(messages.productDescription)}
                value={formData.description}
                onChange={(event) => handleInputChange('description', event.target.value)}
                horizontalConstraint="scale"
              />
            </Spacings.Stack>
          </Spacings.Stack>
        </Card>
        
        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">{intl.formatMessage(messages.masterVariant)}</Text.Subheadline>
            </div>
            
            <Spacings.Stack scale="s">
              <TextField
                title={intl.formatMessage(messages.variantSku)}
                value={formData.sku}
                onChange={(event) => handleInputChange('sku', event.target.value)}
                isRequired
                horizontalConstraint="scale"
              />
              
              <Spacings.Stack scale="xs">
                <Text.Subheadline as="h4">{intl.formatMessage(messages.price)}</Text.Subheadline>
                <Spacings.Inline alignItems="center">
                  <Text.Body>$</Text.Body>
                  <div className={styles.customMoneyInput}>
                    <input
                      type="text"
                      value={priceInputValue}
                      onChange={(event) => handlePriceChange(event.target.value)}
                      onBlur={() => {
                        // Format on blur
                        const value = Math.max(0, parseFloat(formData.price) || 0);
                        setPriceInputValue(value.toFixed(2));
                        handleInputChange('price', value.toString());
                      }}
                      placeholder="0.00"
                      className={styles.moneyInputField}
                    />
                  </div>
                </Spacings.Inline>
                <Text.Detail tone="secondary">
                  {intl.formatMessage(messages.priceHint)}
                </Text.Detail>
              </Spacings.Stack>
            </Spacings.Stack>
          </Spacings.Stack>
        </Card>
        
        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">{intl.formatMessage(messages.productImage)}</Text.Subheadline>
            </div>
            
            <Spacings.Stack scale="s">
              <TextField
                title={intl.formatMessage(messages.imageUrl)}
                value={formData.imageUrl}
                onChange={(event) => handleInputChange('imageUrl', event.target.value)}
                horizontalConstraint="scale"
              />
              
              <TextField
                title={intl.formatMessage(messages.imageLabel)}
                value={formData.imageLabel}
                onChange={(event) => handleInputChange('imageLabel', event.target.value)}
                horizontalConstraint="scale"
              />
              
              {formData.imageUrl && (
                <div className={styles.imagePreviewContainer}>
                  <Text.Detail tone="secondary">{intl.formatMessage(messages.imagePreview)}</Text.Detail>
                  <div className={styles.imagePreview}>
                    <img 
                      src={formData.imageUrl}
                      alt={formData.imageLabel}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL';
                      }}
                    />
                  </div>
                </div>
              )}
            </Spacings.Stack>
          </Spacings.Stack>
        </Card>
        
        <Spacings.Inline justifyContent="flex-end">
          <SecondaryButton
            label={intl.formatMessage(messages.cancel)}
            onClick={onBack}
            isDisabled={isSubmitting}
          />
          
          <PrimaryButton
            label={intl.formatMessage(messages.createProductButton)}
            onClick={handleSubmit}
            isDisabled={!isFormValid() || isSubmitting}
          />
        </Spacings.Inline>
        
        {isSubmitting && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner scale="l" />
          </div>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default ProductForm; 