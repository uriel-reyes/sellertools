import React, { useEffect, useState } from 'react';
import DataTable from '@commercetools-uikit/data-table';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { RefreshIcon } from '@commercetools-uikit/icons';
import { ErrorMessage } from '@commercetools-uikit/messages';
import useStoreCustomers from '../../hooks/use-store-customers';
import CustomerDetailsModal from './customer-details-modal';
import styles from './customers.module.css';

interface CustomersProps {
  storeKey: string;
  onBack: () => void;
}

const Customers: React.FC<CustomersProps> = ({ storeKey, onBack }) => {
  const { fetchCustomersByStore, fetchCustomerById, customers, loading, error } = useStoreCustomers();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  useEffect(() => {
    if (storeKey) {
      console.log(`Loading customers for store: ${storeKey}`);
      fetchCustomersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
      setIsFirstLoad(false);
    } else {
      console.warn('No store key provided, cannot load customers');
    }
  }, [storeKey, fetchCustomersByStore]);

  const handleRowClick = (row: any) => {
    // Skip handling if we don't have the raw data
    if (!row || !row.rawData) {
      return;
    }
    
    // Fetch detailed customer data
    showCustomerDetails(row.rawData.id);
  };

  const showCustomerDetails = async (customerId: string) => {
    setDetailLoading(true);
    try {
      const customerDetails = await fetchCustomerById(customerId);
      if (customerDetails) {
        setSelectedCustomer(customerDetails);
        setIsDetailsModalOpen(true);
      } else {
        console.error(`Could not find details for customer ${customerId}`);
      }
    } catch (err) {
      console.error(`Error fetching customer details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleRefreshCustomers = () => {
    if (storeKey) {
      console.log(`Manually refreshing customers for store: ${storeKey}`);
      fetchCustomersByStore(storeKey).then(() => {
        setLastRefreshed(new Date().toLocaleString());
      });
    }
  };

  // Define columns for the table
  const columns = [
    { key: 'date', label: 'Registration Date' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Customer Name' },
    { key: 'customerNumber', label: 'Customer Number' },
    { key: 'verified', label: 'Verified' },
  ];

  // Map customers to simple row format
  const rows = customers
    .filter(() => true) // Placeholder for additional filtering if needed
    .map(customer => ({
      id: customer.id,
      date: customer.createdAt,
      email: customer.email,
      name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A',
      customerNumber: customer.customerNumber || 'N/A',
      verified: customer.isEmailVerified ? 'Yes' : 'No',
      rawData: customer
    }));

  return (
    <div className={styles.customersContainer}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Customers</Text.Headline>
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
              onClick={handleRefreshCustomers}
              isDisabled={loading}
            />
            <PrimaryButton
              label="Back to Dashboard"
              onClick={onBack}
            />
          </Spacings.Inline>
        </div>

        {loading && isFirstLoad ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner scale="l" />
            <Text.Body>Loading customers...</Text.Body>
          </div>
        ) : error ? (
          <ErrorMessage>
            Error loading customers: {error.message}
          </ErrorMessage>
        ) : customers.length === 0 ? (
          <div className={styles.emptyState}>
            <Text.Headline as="h2">No customers found</Text.Headline>
            <Text.Body>There are no customers associated with this store.</Text.Body>
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

        {selectedCustomer && (
          <CustomerDetailsModal
            customer={selectedCustomer}
            isOpen={isDetailsModalOpen}
            onClose={handleCloseModal}
          />
        )}
      </Spacings.Stack>
    </div>
  );
};

export default Customers; 