import React from 'react';
import { FormModalPage } from '@commercetools-frontend/application-components';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import Card from '@commercetools-uikit/card';
import Constraints from '@commercetools-uikit/constraints';
import {
  InformationIcon,
  UsersIcon,
  WorldIcon,
  GearIcon,
  TagIcon
} from '@commercetools-uikit/icons';
import styles from './customers.module.css';

interface CustomerDetailsModalProps {
  customer: {
    id: string;
    version: number;
    email: string;
    firstName?: string;
    lastName?: string;
    customerNumber?: string;
    createdAt: string;
    lastModifiedAt?: string;
    isEmailVerified: boolean;
    stores?: Array<{
      key: string;
    }>;
    addresses?: Array<{
      id: string;
      firstName?: string;
      lastName?: string;
      streetName?: string;
      streetNumber?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      phone?: string;
      email?: string;
    }>;
    defaultShippingAddress?: string;
    defaultBillingAddress?: string;
    custom?: {
      customFieldsRaw: Array<{
        name: string;
        value: string;
      }>;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const formatAddress = (address: any) => {
    if (!address) return 'Not available';
    
    const parts = [];
    if (address.firstName || address.lastName) {
      parts.push(`${address.firstName || ''} ${address.lastName || ''}`.trim());
    }
    
    if (address.streetName) {
      let street = address.streetName;
      if (address.streetNumber) street += ` ${address.streetNumber}`;
      parts.push(street);
    }
    
    if (address.city || address.postalCode) {
      parts.push(`${address.city || ''} ${address.postalCode || ''}`.trim());
    }
    
    if (address.country) {
      parts.push(address.country);
    }
    
    return parts.join(', ') || 'Not available';
  };

  const getCustomField = (name: string) => {
    if (!customer.custom || !customer.custom.customFieldsRaw) return null;
    
    const field = customer.custom.customFieldsRaw.find(f => f.name === name);
    return field ? field.value : null;
  };

  const getDefaultAddress = (addressId?: string) => {
    if (!addressId || !customer.addresses) return 'None set';
    
    const address = customer.addresses.find(addr => addr.id === addressId);
    return address ? formatAddress(address) : 'Address not found';
  };

  const getStores = () => {
    if (!customer.stores || customer.stores.length === 0) return 'None';
    return customer.stores.map(store => store.key).join(', ');
  };

  return (
    <FormModalPage
      title={`Customer: ${customer.firstName || customer.lastName ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : customer.email}`}
      isOpen={isOpen}
      onClose={onClose}
      isPrimaryButtonDisabled={true}
      isSecondaryButtonDisabled={false}
      labelPrimaryButton=""
      labelSecondaryButton="Close"
      onSecondaryButtonClick={onClose}
      onPrimaryButtonClick={() => {}}
    >
      <Constraints.Horizontal max={16}>
        <Spacings.Stack scale="m">
          <Card>
            <Spacings.Stack scale="m">
              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <InformationIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline isBold>Customer Information</Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Customer ID</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{customer.id}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
                
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Email</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{customer.email}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                {(customer.firstName || customer.lastName) && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Name</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body>{`${customer.firstName || ''} ${customer.lastName || ''}`.trim()}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}

                {customer.customerNumber && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Customer Number</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body>{customer.customerNumber}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}
              </Spacings.Stack>

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <GearIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline isBold>Account Details</Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Created At</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{customer.createdAt}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                {customer.lastModifiedAt && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Last Modified</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body truncate>{customer.lastModifiedAt}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Email Verified</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{customer.isEmailVerified ? 'Yes' : 'No'}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Stores</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{getStores()}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
              </Spacings.Stack>

              {customer.addresses && customer.addresses.length > 0 && (
                <>
                  <div className={styles.sectionDivider}>
                    <Spacings.Inline alignItems="center" scale="xs">
                      <WorldIcon size="medium" color="neutral60" />
                      <div className={styles.sectionHeader}>
                        <Text.Subheadline isBold>Addresses</Text.Subheadline>
                      </div>
                    </Spacings.Inline>
                  </div>

                  <Spacings.Stack scale="s">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Default Shipping Address</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body>{getDefaultAddress(customer.defaultShippingAddress)}</Text.Body>
                      </div>
                    </div>
                    
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Default Billing Address</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body>{getDefaultAddress(customer.defaultBillingAddress)}</Text.Body>
                      </div>
                    </div>

                    {customer.addresses.map((address, index) => (
                      <div key={address.id} className={styles.detailSection}>
                        <div className={styles.detailLabel}>
                          <Text.Body isBold>Address {index + 1}</Text.Body>
                        </div>
                        <div className={styles.detailValue}>
                          <Text.Body>{formatAddress(address)}</Text.Body>
                        </div>
                      </div>
                    ))}
                  </Spacings.Stack>
                </>
              )}

              {customer.custom && customer.custom.customFieldsRaw && customer.custom.customFieldsRaw.length > 0 && (
                <>
                  <div className={styles.sectionDivider}>
                    <Spacings.Inline alignItems="center" scale="xs">
                      <TagIcon size="medium" color="neutral60" />
                      <div className={styles.sectionHeader}>
                        <Text.Subheadline isBold>Custom Fields</Text.Subheadline>
                      </div>
                    </Spacings.Inline>
                  </div>

                  <Spacings.Stack scale="s">
                    {customer.custom.customFieldsRaw.map((field, index) => (
                      <div key={index} className={styles.detailSection}>
                        <div className={styles.detailLabel}>
                          <Text.Body isBold>{field.name}</Text.Body>
                        </div>
                        <div className={styles.detailValue}>
                          <Text.Body>{field.value}</Text.Body>
                        </div>
                      </div>
                    ))}
                  </Spacings.Stack>
                </>
              )}
            </Spacings.Stack>
          </Card>
        </Spacings.Stack>
      </Constraints.Horizontal>
    </FormModalPage>
  );
};

export default CustomerDetailsModal; 