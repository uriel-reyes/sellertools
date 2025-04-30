import React, { useState, useRef, useEffect } from 'react';
import { useIntl } from 'react-intl';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import TextField from '@commercetools-uikit/text-field';
import SelectField from '@commercetools-uikit/select-field';
import NumberInput from '@commercetools-uikit/number-input';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { BackIcon, PlusBoldIcon, BinLinearIcon } from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ContentNotification } from '@commercetools-uikit/notifications';
import usePromotions from '../../hooks/use-promotions/use-promotions';
import messages from './messages';
import styles from './tier-discount-form.module.css'; // Reusing the existing styles

interface ProductDiscountFormProps {
  channelKey: string;
  onBack: () => void;
  onSubmit: (data: ProductDiscountData) => void;
}

type ConditionType = 'attribute' | 'sku' | 'category';
type OperatorType = 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isGreaterThan' | 'isLessThan';

interface Condition {
  id: string;
  type: ConditionType;
  operator: OperatorType;
  value: string;
}

interface ProductDiscountData {
  name: string;
  description: string;
  isActive: boolean;
  discountValue: number;
  discountType: 'percentage' | 'absolute';
  sortOrder: string;
  applyTo: 'all' | 'specific';
  conditions: Condition[];
}

const ProductDiscountForm: React.FC<ProductDiscountFormProps> = ({ 
  channelKey, 
  onBack,
  onSubmit
}) => {
  const intl = useIntl();
  const { createProductDiscount, loading, error } = usePromotions();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
  const [discountData, setDiscountData] = useState<ProductDiscountData>({
    name: '',
    description: '',
    isActive: true,
    discountValue: 10,
    discountType: 'percentage',
    sortOrder: '0.5',
    applyTo: 'all',
    conditions: [],
  });

  // Add additional state for current input value
  const [moneyInputValue, setMoneyInputValue] = useState<string>(
    discountData.discountValue.toFixed(2)
  );

  // Update money input value when discount type changes
  useEffect(() => {
    if (discountData.discountType === 'absolute') {
      setMoneyInputValue(discountData.discountValue.toFixed(2));
    }
  }, [discountData.discountType]);

  const discountTypeOptions = [
    { value: 'percentage', label: intl.formatMessage(messages.discountTypePercentage) },
    { value: 'absolute', label: intl.formatMessage(messages.discountTypeAbsolute) },
  ];

  const conditionTypeOptions = [
    { value: 'attribute', label: intl.formatMessage(messages.conditionTypeAttribute) },
    { value: 'sku', label: intl.formatMessage(messages.conditionTypeSku) },
    { value: 'category', label: intl.formatMessage(messages.conditionTypeCategory) },
  ];

  const operatorOptions = [
    { value: 'is', label: intl.formatMessage(messages.operatorIs) },
    { value: 'isNot', label: intl.formatMessage(messages.operatorIsNot) },
    { value: 'contains', label: intl.formatMessage(messages.operatorContains) },
    { value: 'doesNotContain', label: intl.formatMessage(messages.operatorDoesNotContain) },
    { value: 'isGreaterThan', label: intl.formatMessage(messages.operatorGreaterThan) },
    { value: 'isLessThan', label: intl.formatMessage(messages.operatorLessThan) },
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    // Special validation for sort order
    if (field === 'sortOrder') {
      const strValue = String(value);
      const numValue = parseFloat(strValue);
      // Ensure it's a valid number less than 1
      if (!isNaN(numValue) && numValue < 1) {
        setDiscountData({
          ...discountData,
          [field]: strValue,
        });
      }
      // If not valid, don't update the state
      return;
    }
    
    // For other fields, update normally
    setDiscountData({
      ...discountData,
      [field]: value,
    });
  };

  const handleApplyToChange = (event: any) => {
    const value = event.target.value as 'all' | 'specific';
    
    setDiscountData({
      ...discountData,
      applyTo: value,
      // Reset conditions if switching to "all products"
      conditions: value === 'all' ? [] : discountData.conditions.length > 0 ? discountData.conditions : [
        // Add default condition if switching to specific and no conditions exist
        {
          id: `condition-${Date.now()}`,
          type: 'sku',
          operator: 'is',
          value: '',
        }
      ],
    });
  };

  const addCondition = () => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`, // Generate a unique ID
      type: 'sku',
      operator: 'is',
      value: '',
    };

    setDiscountData({
      ...discountData,
      conditions: [...discountData.conditions, newCondition],
    });
  };

  const updateCondition = (conditionId: string, field: keyof Condition, value: string) => {
    setDiscountData({
      ...discountData,
      conditions: discountData.conditions.map((condition) => 
        condition.id === conditionId 
          ? { ...condition, [field]: value as any }
          : condition
      ),
    });
  };

  const removeCondition = (conditionId: string) => {
    setDiscountData({
      ...discountData,
      conditions: discountData.conditions.filter((condition) => condition.id !== conditionId),
    });
  };

  const buildProductPredicate = (): string => {
    // If applying to all products, only include the channel key
    if (discountData.applyTo === 'all') {
      return `channel.key = "${channelKey}"`;
    }

    // Build conditions for specific products
    const conditionStrings = discountData.conditions.map((condition) => {
      let attributeKey: string;
      let operator: string;
      
      // Map condition type to appropriate attribute
      switch (condition.type) {
        case 'attribute':
          attributeKey = `attributes.${condition.value.split(':')[0]}`;
          break;
        case 'sku':
          attributeKey = 'sku';
          break;
        case 'category':
          attributeKey = 'categories.key';
          break;
        default:
          attributeKey = 'sku';
      }
      
      // Map operator type to predicate operator
      switch (condition.operator) {
        case 'is':
          // Special handling for categories
          if (condition.type === 'category') {
            return `${attributeKey} contains "${condition.value}"`;
          }
          operator = '=';
          break;
        case 'isNot':
          // Special handling for categories
          if (condition.type === 'category') {
            return `not(${attributeKey} contains "${condition.value}")`;
          }
          operator = '!=';
          break;
        case 'contains':
          return `${attributeKey} contains "${condition.value}"`;
        case 'doesNotContain':
          return `not(${attributeKey} contains "${condition.value}")`;
        case 'isGreaterThan':
          operator = '>';
          break;
        case 'isLessThan':
          operator = '<';
          break;
        default:
          operator = '=';
      }
      
      // In case of attribute, we need to handle the value specially
      if (condition.type === 'attribute' && condition.value.includes(':')) {
        const [name, value] = condition.value.split(':');
        return `${attributeKey} ${operator} "${value}"`;
      }
      
      return `${attributeKey} ${operator} "${condition.value}"`;
    });
    
    // Always include the channel key condition
    conditionStrings.push(`channel.key = "${channelKey}"`);
    
    // Join all conditions with AND
    return conditionStrings.join(' and ');
  };

  const handleSubmit = async () => {
    setSuccessMessage(null);
    setSubmissionError(null);
    
    try {
      // Create the product predicate with conditions
      const predicate = buildProductPredicate();
      
      // Get the currency code for absolute discounts (using USD as default)
      const currencyCode = discountData.discountType === 'absolute' ? 'USD' : undefined;
      
      // Prepare the input for the mutation
      const input = {
        name: discountData.name,
        description: discountData.description,
        channelKey: channelKey,
        predicate,
        discountValue: discountData.discountType === 'percentage' 
          ? discountData.discountValue
          : Math.round(discountData.discountValue * 100), // Convert dollars to cents for absolute discounts
        discountType: discountData.discountType,
        currencyCode,
        isActive: discountData.isActive,
        sortOrder: discountData.sortOrder,
      };
      
      console.log('Submitting product discount with input:', input);
      
      // Call the mutation
      const result = await createProductDiscount(input);
      
      if (result) {
        // Show success message
        setSuccessMessage(intl.formatMessage(messages.promotionCreateSuccess, { name: discountData.name }));
        
        // Immediately call the onSubmit callback to refresh the promotions list
        onSubmit(discountData);
        
        // Navigate back after a delay
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setSubmissionError(intl.formatMessage(messages.promotionCreateError));
      }
    } catch (err) {
      console.error('Error submitting product discount:', err);
      setSubmissionError(err instanceof Error ? err.message : intl.formatMessage(messages.promotionCreateError));
    }
  };
  
  const handleDiscountTypeChange = (event: any) => {
    // Safely handle the SelectField onChange event
    const value = event.target.value;
    if (typeof value === 'string' && (value === 'percentage' || value === 'absolute')) {
      handleInputChange('discountType', value as 'percentage' | 'absolute');
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
        
        <Text.Headline as="h2">
          {intl.formatMessage(messages.createProductDiscount)}
        </Text.Headline>
        
        {successMessage && (
          <ContentNotification type="success">
            <Text.Body>{successMessage}</Text.Body>
          </ContentNotification>
        )}
        
        {submissionError && (
          <ContentNotification type="error">
            <Text.Body>{submissionError}</Text.Body>
          </ContentNotification>
        )}

        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.basicInformation)}
              </Text.Subheadline>
            </div>
            
            <div className={styles.fieldGroup}>
              <TextField
                title={intl.formatMessage(messages.promotionName)}
                value={discountData.name}
                onChange={(event) => handleInputChange('name', event.target.value)}
                isRequired
                hint={intl.formatMessage(messages.nameHint)}
              />
              
              <TextField
                title={intl.formatMessage(messages.promotionDescription)}
                value={discountData.description}
                onChange={(event) => handleInputChange('description', event.target.value)}
              />
              
              <div className={styles.sortOrderField}>
                <TextField
                  title={intl.formatMessage(messages.sortOrder)}
                  value={discountData.sortOrder}
                  onChange={(event) => handleInputChange('sortOrder', event.target.value)}
                  isRequired
                  hint={intl.formatMessage(messages.sortOrderHint)}
                  errors={
                    discountData.sortOrder && (isNaN(parseFloat(discountData.sortOrder)) || parseFloat(discountData.sortOrder) >= 1) 
                      ? { invalid: true } 
                      : {}
                  }
                  renderError={() => intl.formatMessage(messages.sortOrderError)}
                />
              </div>
            </div>
          </Spacings.Stack>
        </Card>
        
        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.productConditions)}
              </Text.Subheadline>
            </div>
            
            <div className={styles.fieldGroup}>
              <Spacings.Stack>
                <SelectField
                  title={intl.formatMessage(messages.applyTo)}
                  value={discountData.applyTo}
                  onChange={handleApplyToChange}
                  options={[
                    { value: 'all', label: intl.formatMessage(messages.applyToAll) },
                    { value: 'specific', label: intl.formatMessage(messages.applyToSpecific) },
                  ]}
                  horizontalConstraint="scale"
                />
                
                {discountData.applyTo === 'specific' && (
                  <Spacings.Stack scale="s">
                    <Text.Body>
                      {intl.formatMessage(messages.specificProductsDescription)}
                    </Text.Body>
                    
                    <div className={styles.conditionsContainer}>
                      {discountData.conditions.map((condition, index) => (
                        <Spacings.Stack key={condition.id} scale="s">
                          <div className={styles.conditionRow}>
                            <div className={styles.conditionType}>
                              <SelectField
                                title={index === 0 ? intl.formatMessage(messages.conditionType) : ''}
                                value={condition.type}
                                onChange={(event) => updateCondition(condition.id, 'type', event.target.value as string)}
                                options={conditionTypeOptions}
                                horizontalConstraint="scale"
                              />
                            </div>
                            <div className={styles.conditionOperator}>
                              <SelectField
                                title={index === 0 ? intl.formatMessage(messages.conditionOperator) : ''}
                                value={condition.operator}
                                onChange={(event) => updateCondition(condition.id, 'operator', event.target.value as string)}
                                options={operatorOptions}
                                horizontalConstraint="scale"
                              />
                            </div>
                            <div className={styles.conditionValue}>
                              <TextField
                                title={index === 0 ? intl.formatMessage(messages.conditionValue) : ''}
                                value={condition.value}
                                onChange={(event) => updateCondition(condition.id, 'value', event.target.value)}
                                horizontalConstraint="scale"
                                placeholder={
                                  condition.type === 'attribute'
                                    ? intl.formatMessage(messages.attributePlaceholder)
                                    : condition.type === 'sku'
                                    ? intl.formatMessage(messages.skuPlaceholder)
                                    : intl.formatMessage(messages.categoryPlaceholder)
                                }
                              />
                            </div>
                            <div className={styles.conditionRemove}>
                              {discountData.conditions.length > 1 && (
                                <SecondaryButton
                                  label=""
                                  iconLeft={<BinLinearIcon />}
                                  onClick={() => removeCondition(condition.id)}
                                />
                              )}
                            </div>
                          </div>
                          
                          {index < discountData.conditions.length - 1 && (
                            <div className={styles.conditionConnector}>
                              <Text.Body>AND</Text.Body>
                            </div>
                          )}
                        </Spacings.Stack>
                      ))}
                    </div>
                    
                    <Spacings.Inline>
                      <SecondaryButton
                        label={intl.formatMessage(messages.addCondition)}
                        onClick={addCondition}
                        iconLeft={<PlusBoldIcon />}
                      />
                    </Spacings.Inline>
                    
                    {discountData.conditions.length === 0 && (
                      <ContentNotification type="info">
                        <Text.Body>{intl.formatMessage(messages.noConditionsWarning)}</Text.Body>
                      </ContentNotification>
                    )}
                  </Spacings.Stack>
                )}
              </Spacings.Stack>
            </div>
          </Spacings.Stack>
        </Card>
        
        <Card>
          <Spacings.Stack scale="m">
            <div className={styles.sectionTitle}>
              <Text.Subheadline as="h4">
                {intl.formatMessage(messages.discountValue)}
              </Text.Subheadline>
            </div>
            
            <div className={styles.fieldGroup}>
              <div className={styles.discountFormRow}>
                <div>
                  <SelectField
                    title={intl.formatMessage(messages.discountType)}
                    value={discountData.discountType}
                    onChange={handleDiscountTypeChange}
                    options={discountTypeOptions}
                    horizontalConstraint="scale"
                  />
                </div>
                
                <div className={styles.discountValueContainer}>
                  {discountData.discountType === 'percentage' ? (
                    <div className={styles.valueInput}>
                      <Spacings.Stack scale="xs">
                        <Text.Subheadline as="h4">
                          {intl.formatMessage(messages.discountPercentage)}
                        </Text.Subheadline>
                        <NumberInput
                          value={discountData.discountValue}
                          onChange={(event) => handleInputChange('discountValue', event.target.valueAsNumber || 0)}
                          min={0}
                          max={100}
                          step={0.1}
                          horizontalConstraint="scale"
                        />
                      </Spacings.Stack>
                    </div>
                  ) : (
                    <div className={styles.valueInput}>
                      <Spacings.Stack scale="xs">
                        <Text.Subheadline as="h4">
                          {intl.formatMessage(messages.discountAbsolute)}
                        </Text.Subheadline>
                        <Spacings.Inline alignItems="center">
                          <Text.Body>$</Text.Body>
                          <div className={styles.customMoneyInput}>
                            <input
                              type="text"
                              value={moneyInputValue}
                              onChange={(event) => {
                                const input = event.target.value;
                                
                                // First, update the displayed input immediately
                                setMoneyInputValue(input);
                                
                                // Then process the value for the actual data
                                const validInput = input.replace(/[^\d.]/g, '');
                                
                                // Handle special cases for incomplete inputs
                                if (validInput === '' || validInput === '.') {
                                  handleInputChange('discountValue', 0);
                                  return;
                                }
                                
                                // Ensure only one decimal point
                                const parts = validInput.split('.');
                                let formattedValue = validInput;
                                if (parts.length > 2) {
                                  formattedValue = parts[0] + '.' + parts.slice(1).join('');
                                }
                                
                                // Parse the value and update if it's a valid number
                                const parsedValue = parseFloat(formattedValue);
                                if (!isNaN(parsedValue)) {
                                  handleInputChange('discountValue', parsedValue);
                                }
                              }}
                              onBlur={() => {
                                // When the field loses focus, format the value properly
                                const value = Math.max(0, discountData.discountValue);
                                setMoneyInputValue(value.toFixed(2));
                                setDiscountData({
                                  ...discountData,
                                  discountValue: value
                                });
                              }}
                              placeholder="0.00"
                              className={styles.moneyInputField}
                            />
                          </div>
                        </Spacings.Inline>
                      </Spacings.Stack>
                    </div>
                  )}
                </div>
              </div>
              
              <Text.Detail>
                {intl.formatMessage(
                  discountData.discountType === 'percentage' 
                    ? messages.percentageDiscountDescription 
                    : messages.absoluteDiscountDescription
                )}
              </Text.Detail>
              
              <Text.Detail tone="secondary">
                {intl.formatMessage(
                  discountData.discountType === 'percentage' 
                    ? messages.percentageDiscountHint 
                    : messages.absoluteDiscountHint
                )}
              </Text.Detail>
            </div>
          </Spacings.Stack>
        </Card>
        
        <Spacings.Inline justifyContent="flex-end">
          <SecondaryButton
            label={intl.formatMessage(messages.cancel)}
            onClick={onBack}
            isDisabled={loading}
          />
          
          <PrimaryButton
            label={intl.formatMessage(messages.createPromotion)}
            onClick={handleSubmit}
            isDisabled={
              !discountData.name || 
              !discountData.sortOrder || 
              isNaN(parseFloat(discountData.sortOrder)) || 
              parseFloat(discountData.sortOrder) >= 1 || 
              (discountData.applyTo === 'specific' && discountData.conditions.length === 0) ||
              loading
            }
          />
        </Spacings.Inline>
        
        {loading && (
          <div className={styles.loadingOverlay}>
            <LoadingSpinner scale="l" />
          </div>
        )}
      </Spacings.Stack>
    </div>
  );
};

export default ProductDiscountForm; 