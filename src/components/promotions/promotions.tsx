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
import ToggleInput from '@commercetools-uikit/toggle-input';
import { ContentNotification } from '@commercetools-uikit/notifications';
import usePromotions from '../../hooks/use-promotions/use-promotions';
import ProductDiscountForm from './product-discount-form';
import messages from './messages';
import styles from './promotions.module.css';

interface PromotionsProps {
  channelKey: string;
  onBack: () => void;
}

// Type for the promotion discount data
interface PromotionData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  predicate: string;
  channelKey: string | null;
  valueAmount: string;
  sortOrder: string;
  version: number;
}

// Type for the current view state
type ViewState = 'list' | 'add-product-discount' | 'edit-product-discount';

const Promotions: React.FC<PromotionsProps> = ({ channelKey, onBack }) => {
  const intl = useIntl();
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [togglingPromotions, setTogglingPromotions] = useState<Record<string, boolean>>({});
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionData | null>(null);
  
  const { fetchPromotions, updatePromotionActiveStatus } = usePromotions();
  
  const loadPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching product discounts for channel: ${channelKey}`);
      const result = await fetchPromotions(channelKey);
      
      if (result && result.length > 0) {
        console.log(`Fetched ${result.length} product discounts for channel ${channelKey}`);
        setPromotions(result);
      } else {
        console.log(`No product discounts found for channel ${channelKey}`);
        setPromotions([]);
      }
      
      // Update last refreshed timestamp
      setLastRefreshed(new Date().toLocaleString());
    } catch (err) {
      console.error(`Error fetching product discounts for channel ${channelKey}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error fetching product discounts'));
    } finally {
      setIsLoading(false);
    }
  }, [channelKey, fetchPromotions]);
  
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
  
  const handleToggleActive = async (id: string, version: number, currentStatus: boolean) => {
    // Prevent toggling if this promotion is already being toggled
    if (togglingPromotions[id]) {
      return;
    }
    
    try {
      setToggleError(null);
      
      // Track that this promotion is being toggled
      setTogglingPromotions(prev => ({ ...prev, [id]: true }));
      
      // Optimistically update UI for better user experience
      setPromotions(prev => 
        prev.map(promotion => 
          promotion.id === id ? { ...promotion, isActive: !currentStatus } : promotion
        )
      );
      
      // Call the mutation to update the promotion's active status
      const result = await updatePromotionActiveStatus({
        id,
        version,
        isActive: !currentStatus
      });
      
      if (result) {
        // Refresh the entire list to ensure all data is in sync
        await loadPromotions();
      } else {
        // Revert the optimistic update if the operation failed
        setPromotions(prev => 
          prev.map(promotion => 
            promotion.id === id ? { ...promotion, isActive: currentStatus } : promotion
          )
        );
        
        // Show error message
        setToggleError(intl.formatMessage(messages.errorToggleActiveStatus));
      }
    } catch (err) {
      console.error('Error updating promotion active status:', err);
      
      // Revert the optimistic update
      setPromotions(prev => 
        prev.map(promotion => 
          promotion.id === id ? { ...promotion, isActive: currentStatus } : promotion
        )
      );
      
      setToggleError(intl.formatMessage(messages.errorToggleActiveStatus));
    } finally {
      // Clear the toggling state for this promotion
      setTogglingPromotions(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };
  
  // Handle promotion row click to open edit form
  const handleRowClick = (promotion: PromotionData) => {
    setSelectedPromotion(promotion);
    setViewState('edit-product-discount');
  };
  
  // Define the column structure for the DataTable
  const columns: TColumn<PromotionData>[] = [
    { 
      key: 'active', 
      label: intl.formatMessage(messages.columnActive),
      renderItem: (row: PromotionData): ReactNode => (
        <ToggleInput
          isDisabled={isLoading || togglingPromotions[row.id]}
          isChecked={row.isActive}
          onChange={() => handleToggleActive(row.id, Number(row.version), row.isActive)}
          size="small"
        />
      )
    },
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
    { key: 'predicate', label: intl.formatMessage(messages.columnPredicate) },
    { key: 'valueAmount', label: intl.formatMessage(messages.columnValueAmount) },
    { key: 'sortOrder', label: intl.formatMessage(messages.columnSortOrder) },
  ];

  const handleAddPromotion = () => {
    setSelectedPromotion(null);
    setViewState('add-product-discount');
  };

  const handleBackToList = () => {
    setViewState('list');
    setSelectedPromotion(null);
  };

  const handleSubmitPromotion = (formData: any) => {
    console.log('Submitted product discount form:', formData);
    // After successful creation or update, go back to the list view and refresh promotions
    setViewState('list');
    setSelectedPromotion(null);
    loadPromotions(); // Refresh the promotions list
  };
  
  // Handle manual refresh button click
  const handleRefresh = () => {
    if (!isLoading) {
      loadPromotions();
    }
  };
  
  // Render the main promotions list view with table
  const renderPromotionsList = () => (
    <Spacings.Stack scale="l">
      <div className={styles.header}>
        <div>
          <Text.Headline as="h1">{intl.formatMessage(messages.title)}</Text.Headline>
          <Text.Subheadline>
            Channel: <span className={styles.storeKeyHighlight}>{channelKey}</span>
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
      
      {toggleError && (
        <ContentNotification type="error">
          <Text.Body>{toggleError}</Text.Body>
        </ContentNotification>
      )}
      
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
            maxHeight={600}
            onRowClick={handleRowClick}
          />
        </div>
      )}
    </Spacings.Stack>
  );
  
  // Determine which view to render
  const renderView = () => {
    switch (viewState) {
      case 'add-product-discount':
        return (
          <ProductDiscountForm
            channelKey={channelKey}
            onBack={handleBackToList}
            onSubmit={handleSubmitPromotion}
          />
        );
      case 'edit-product-discount':
        if (!selectedPromotion) {
          return renderPromotionsList();
        }
        return (
          <ProductDiscountForm
            channelKey={channelKey}
            onBack={handleBackToList}
            onSubmit={handleSubmitPromotion}
            promotion={selectedPromotion}
            isEditing={true}
          />
        );
      case 'list':
      default:
        return renderPromotionsList();
    }
  };
  
  return (
    <div className={styles.container}>
      {renderView()}
    </div>
  );
};

export default Promotions; 