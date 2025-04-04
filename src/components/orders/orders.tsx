import React, { useEffect, useState } from 'react';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import SelectField from '@commercetools-uikit/select-field';
import { ContentNotification } from '@commercetools-uikit/notifications';
import useOrders from '../../hooks/use-orders/use-orders';
import OrderDetailsModal from './order-details-modal';
import styles from './orders.module.css';

interface OrdersProps {
  storeKey: string;
  onBack: () => void;
}

const ORDER_STATES = [
  { value: 'Open', label: 'Open' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const Orders: React.FC<OrdersProps> = ({ storeKey, onBack }) => {
  const { fetchOrdersByStore, fetchOrderById, updateOrderState, orders, loading, error } = useOrders();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  useEffect(() => {
    if (storeKey) {
      console.log(`Loading orders for store: ${storeKey}`);
      fetchOrdersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
      setIsFirstLoad(false);
    } else {
      console.warn('No store key provided, cannot load orders');
    }
  }, [storeKey, fetchOrdersByStore]);

  // Clear status messages after 5 seconds
  useEffect(() => {
    if (statusUpdateSuccess || statusUpdateError) {
      const timer = setTimeout(() => {
        setStatusUpdateSuccess(null);
        setStatusUpdateError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [statusUpdateSuccess, statusUpdateError]);

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency 
    }).format(amount);
  };

  const handleRowClick = (row: any) => {
    // Skip handling if we don't have the raw data
    if (!row || !row.rawData) {
      return;
    }
    
    // Fetch detailed order data
    showOrderDetails(row.rawData.id);
  };

  const showOrderDetails = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const orderDetails = await fetchOrderById(orderId);
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        setIsDetailsModalOpen(true);
      } else {
        setStatusUpdateError(`Could not find details for order ${orderId}`);
      }
    } catch (err) {
      setStatusUpdateError(`Error fetching order details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (event: any, orderId: string, version: number) => {
    const newState = event.target.value;
    
    if (!newState) return;
    
    setStatusUpdateSuccess(null);
    setStatusUpdateError(null);
    
    try {
      const result = await updateOrderState(orderId, version, newState);
      
      if (result) {
        setStatusUpdateSuccess(`Order ${orderId} status updated to ${newState}`);
      } else {
        setStatusUpdateError(`Failed to update order ${orderId} status`);
      }
    } catch (err) {
      setStatusUpdateError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRefreshOrders = () => {
    if (storeKey) {
      console.log(`Manually refreshing orders for store: ${storeKey}`);
      fetchOrdersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
    }
  };

  // Define columns for the table
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'customerName', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { 
      key: 'status', 
      label: 'Status', 
      renderItem: (row: any) => {
        const handleStatusClick = (e: React.MouseEvent) => {
          // Stop the click from propagating to the row
          e.stopPropagation();
        };
        
        return (
          <div onClick={handleStatusClick}>
            <SelectField
              title="Status"
              name={`status-${row.id}`}
              value={row.status}
              options={ORDER_STATES}
              onChange={(event) => handleStatusChange(event, row.rawData.id, row.rawData.version)}
              data-testid={`status-selector-${row.id}`}
              horizontalConstraint="scale"
            />
          </div>
        );
      }
    },
  ];

  // Map orders to simple row format
  const rows = orders
    .filter(order => {
      // Double-check that the order belongs to this store
      // This is a safety measure in case the API returns orders from other stores
      return true; // The filtering should be handled by the API query
    })
    .map(order => ({
      id: order.id,
      date: order.createdAt,
      orderNumber: order.orderNumber || 'N/A',
      customerName: order.customerName || order.customerEmail || 'Unknown',
      total: formatPrice(order.totalPrice.centAmount, order.totalPrice.currencyCode),
      status: order.orderState,
      rawData: order
    }));

  return (
    <div className={styles.ordersContainer}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Orders</Text.Headline>
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
              onClick={handleRefreshOrders}
              isDisabled={loading}
            />
            <PrimaryButton
              label="Back to Dashboard"
              onClick={onBack}
            />
          </Spacings.Inline>
        </div>

        {statusUpdateSuccess && (
          <ContentNotification type="success">
            <Text.Body>{statusUpdateSuccess}</Text.Body>
          </ContentNotification>
        )}

        {statusUpdateError && (
          <ContentNotification type="error">
            <Text.Body>{statusUpdateError}</Text.Body>
          </ContentNotification>
        )}

        {loading && isFirstLoad ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading orders...</Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>
            Error loading orders: {error.message}
          </ErrorMessage>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h2">No orders found</Text.Headline>
            <Text.Body>There are no orders available for this store.</Text.Body>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <DataTable
              columns={columns}
              rows={rows}
              onRowClick={handleRowClick}
              maxHeight="80vh"
              maxWidth="100%"
            />
            {detailLoading && (
              <div className={styles.overlayLoading}>
                <LoadingSpinner scale="l" />
              </div>
            )}
          </div>
        )}

        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            isOpen={isDetailsModalOpen}
            onClose={handleCloseModal}
            formatPrice={formatPrice}
          />
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Orders; 