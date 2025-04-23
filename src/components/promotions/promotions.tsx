import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';
import DataTable, { TColumn } from '@commercetools-uikit/data-table';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import { ErrorMessage } from '@commercetools-uikit/messages';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import PrimaryButton from '@commercetools-uikit/primary-button';
import { BackIcon, PlusBoldIcon, CloseIcon, RefreshIcon } from '@commercetools-uikit/icons';
import Card from '@commercetools-uikit/card';
import usePromotions from '../../hooks/use-promotions/use-promotions';
import TierDiscountForm from './tier-discount-form';
import messages from './messages';
import styles from './promotions.module.css';

interface PromotionsProps {
  storeKey: string;
  onBack: () => void;
}

// Type for the promotion discount data
interface PromotionData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  cartPredicate: string;
  targetType: string;
  targetDetails: string;
  valueAmount: string;
}

// Type for the current view state
type ViewState = 'list' | 'select-type' | 'tier-discount' | 'customer-group-discount';

const Promotions: React.FC<PromotionsProps> = ({ storeKey, onBack }) => {
  const intl = useIntl();
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  
  const { fetchPromotions } = usePromotions();
  
  const loadPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching promotions for store: ${storeKey}`);
      const result = await fetchPromotions(storeKey);
      
      if (result && result.length > 0) {
        console.log(`Fetched ${result.length} promotions for store ${storeKey}`);
        setPromotions(result);
      } else {
        console.log(`No promotions found for store ${storeKey}`);
        setPromotions([]);
      }
      
      // Update last refreshed timestamp
      setLastRefreshed(new Date().toLocaleString());
    } catch (err) {
      console.error(`Error fetching promotions for store ${storeKey}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching promotions'));
    } finally {
      setIsLoading(false);
    }
  }, [storeKey, fetchPromotions]);
  
  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);
  
  // Format currency amount for display
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100); // Convert cent amount to dollars
  };
  
  // Format percentage for display
  const formatPercentage = (permyriad: number) => {
    return `${(permyriad / 100).toFixed(2)}%`; // Convert permyriad to percentage
  };
  
  // Define the column structure for the DataTable
  const columns: TColumn<PromotionData>[] = [
    { key: 'name', label: intl.formatMessage(messages.columnName) },
    { 
      key: 'isActive', 
      label: intl.formatMessage(messages.columnStatus),
      renderItem: (row: PromotionData): ReactNode => (
        <div className={row.isActive ? styles.statusActive : styles.statusInactive}>
          {row.isActive 
            ? intl.formatMessage(messages.statusActive) 
            : intl.formatMessage(messages.statusInactive)}
        </div>
      )
    },
    { key: 'description', label: intl.formatMessage(messages.columnDescription) },
    { key: 'targetDetails', label: intl.formatMessage(messages.columnTargetDetails) },
    { key: 'valueAmount', label: intl.formatMessage(messages.columnValueAmount) },
    { key: 'targetType', label: intl.formatMessage(messages.columnTargetType) },
  ];

  const handleAddPromotion = () => {
    setViewState('select-type');
  };

  const handleBackToList = () => {
    setViewState('list');
  };

  const handleSelectPromotionType = (type: string) => {
    console.log(`Selected promotion type: ${type}`);
    if (type === 'tier') {
      setViewState('tier-discount');
    } else if (type === 'customerGroup') {
      setViewState('customer-group-discount');
    }
  };

  const handleSubmitTierDiscount = (formData: any) => {
    console.log('Submitted tier discount form:', formData);
    // After successful creation, go back to the list view and refresh promotions
    setViewState('list');
    loadPromotions(); // Refresh the promotions list
  };
  
  // Handle manual refresh button click
  const handleRefresh = () => {
    if (!isLoading) {
      loadPromotions();
    }
  };
  
  // Render the promotion type selection dialog
  const renderPromotionTypeSelection = () => (
    <div className={styles.dialogOverlay}>
      <Card className={styles.dialogCard}>
        <Spacings.Stack scale="m">
          <Spacings.Inline alignItems="center" justifyContent="space-between">
            <Text.Headline as="h3">
              {intl.formatMessage(messages.selectPromotionType)}
            </Text.Headline>
            <SecondaryButton
              onClick={handleBackToList}
              iconLeft={<CloseIcon />}
              label=""
            />
          </Spacings.Inline>
          
          <Text.Body>
            {intl.formatMessage(messages.selectPromotionTypeDescription)}
          </Text.Body>
          
          <Spacings.Inline scale="m" justifyContent="center">
            <Card className={styles.promotionTypeCard} onClick={() => handleSelectPromotionType('tier')}>
              <Spacings.Stack scale="s" alignItems="center">
                <div className={styles.promotionTypeIcon}>
                  <PlusBoldIcon size="big" />
                </div>
                <Text.Subheadline as="h4">
                  {intl.formatMessage(messages.tierBasedPromotion)}
                </Text.Subheadline>
                <Text.Detail>
                  {intl.formatMessage(messages.tierBasedPromotionDescription)}
                </Text.Detail>
              </Spacings.Stack>
            </Card>
            
            <Card className={styles.promotionTypeCard} onClick={() => handleSelectPromotionType('customerGroup')}>
              <Spacings.Stack scale="s" alignItems="center">
                <div className={styles.promotionTypeIcon}>
                  <PlusBoldIcon size="big" />
                </div>
                <Text.Subheadline as="h4">
                  {intl.formatMessage(messages.customerGroupPromotion)}
                </Text.Subheadline>
                <Text.Detail>
                  {intl.formatMessage(messages.customerGroupPromotionDescription)}
                </Text.Detail>
              </Spacings.Stack>
            </Card>
          </Spacings.Inline>
        </Spacings.Stack>
      </Card>
    </div>
  );
  
  // Render the main promotions list view with table
  const renderPromotionsList = () => (
    <Spacings.Stack scale="l">
      <div className={styles.header}>
        <div>
          <Text.Headline as="h1">{intl.formatMessage(messages.title)}</Text.Headline>
          <Text.Subheadline>
            Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
          </Text.Subheadline>
          {lastRefreshed && (
            <Text.Detail tone="secondary">
              Last refreshed: {lastRefreshed}
            </Text.Detail>
          )}
          <div className={styles.actionButtonContainer}>
            <PrimaryButton
              label={intl.formatMessage(messages.addPromotion)}
              onClick={handleAddPromotion}
              iconLeft={<PlusBoldIcon />}
              size="small"
            />
          </div>
        </div>
        <Spacings.Inline scale="s">
          <SecondaryButton
            iconLeft={<RefreshIcon />}
            label={intl.formatMessage(messages.refreshButton)}
            onClick={handleRefresh}
            isDisabled={isLoading}
          />
          <PrimaryButton
            label={intl.formatMessage(messages.backButton)}
            onClick={onBack}
          />
        </Spacings.Inline>
      </div>
      
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <LoadingSpinner scale="l" />
          <Text.Body>
            {intl.formatMessage(messages.loadingPromotions)}
          </Text.Body>
        </div>
      ) : error ? (
        <ErrorMessage>
          {intl.formatMessage(messages.errorFetchingPromotions, { error: error.message })}
        </ErrorMessage>
      ) : promotions.length === 0 ? (
        <Text.Body>
          {intl.formatMessage(messages.noPromotionsFound)}
        </Text.Body>
      ) : (
        <div className={styles.tableContainer}>
          <DataTable<PromotionData>
            columns={columns}
            rows={promotions}
          />
        </div>
      )}
    </Spacings.Stack>
  );
  
  // Main render logic
  return (
    <div className={styles.container}>
      {viewState === 'list' && renderPromotionsList()}
      
      {viewState === 'select-type' && renderPromotionTypeSelection()}
      
      {viewState === 'tier-discount' && (
        <TierDiscountForm 
          storeKey={storeKey}
          onBack={handleBackToList}
          onSubmit={handleSubmitTierDiscount}
        />
      )}
      
      {viewState === 'customer-group-discount' && (
        <div>
          {/* This would be replaced with a CustomerGroupDiscountForm component */}
          <Text.Headline>Customer Group Discount Form</Text.Headline>
          <SecondaryButton
            label={intl.formatMessage(messages.backButton)}
            onClick={handleBackToList}
          />
        </div>
      )}
    </div>
  );
};

export default Promotions; 