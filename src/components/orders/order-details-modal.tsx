import React from 'react';
import { FormModalPage } from '@commercetools-frontend/application-components';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import { ContentNotification } from '@commercetools-uikit/notifications';
import Card from '@commercetools-uikit/card';
import Constraints from '@commercetools-uikit/constraints';
import Table from '@commercetools-uikit/data-table';
import {
  InformationIcon,
  UsersIcon,
  WorldIcon,
  CartIcon,
  CoinsIcon,
  CloseIcon
} from '@commercetools-uikit/icons';
import styles from './orders.module.css';

interface OrderDetailsModalProps {
  order: {
    id: string;
    version: number;
    orderNumber?: string;
    createdAt: string;
    lastModifiedAt?: string;
    totalPrice: {
      centAmount: number;
      currencyCode: string;
    };
    orderState: string;
    customerId?: string;
    customerEmail?: string;
    customerName?: string;
    lineItems?: Array<{
      id: string;
      name: string;
      productId: string;
      quantity: number;
      variant?: {
        images?: Array<{
          url: string;
        }>;
      };
      price: {
        value: {
          centAmount: number;
          currencyCode: string;
        }
      };
      totalPrice: {
        centAmount: number;
        currencyCode: string;
      }
    }>;
    shippingAddress?: {
      firstName?: string;
      lastName?: string;
      streetName?: string;
      streetNumber?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
    billingAddress?: {
      firstName?: string;
      lastName?: string;
      streetName?: string;
      streetNumber?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  formatPrice: (cents: number, currency: string) => string;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  formatPrice,
}) => {
  const orderTotal = formatPrice(
    order.totalPrice.centAmount,
    order.totalPrice.currencyCode
  );

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

  // Define columns for line items table
  const lineItemColumns = [
    { 
      key: 'image', 
      label: 'Image',
      renderItem: (row: any) => {
        const imageUrl = row.imageUrl;
        return imageUrl ? (
          <img 
            src={imageUrl} 
            alt={row.name} 
            className={styles.productImage} 
          />
        ) : (
          <div className={styles.noImage}>No image</div>
        );
      }
    },
    { key: 'name', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'price', label: 'Unit Price' },
    { key: 'total', label: 'Total' },
  ];

  // Map line items to table rows
  const lineItemRows = order.lineItems?.map(item => ({
    id: item.id,
    name: item.name,
    imageUrl: item.variant?.images && item.variant.images.length > 0 
      ? item.variant.images[0].url 
      : null,
    quantity: item.quantity,
    price: formatPrice(item.price.value.centAmount, item.price.value.currencyCode),
    total: formatPrice(item.totalPrice.centAmount, item.totalPrice.currencyCode),
  })) || [];

  return (
    <FormModalPage
      data-testid="order-details-modal"
      title={`Order ${order.orderNumber || order.id}`}
      isOpen={isOpen}
      onClose={onClose}
      isPrimaryButtonDisabled={true}
      isSecondaryButtonDisabled={true}
      labelPrimaryButton=""
      labelSecondaryButton=""
      onSecondaryButtonClick={() => {}}
      onPrimaryButtonClick={() => {}}
    >
      <Constraints.Horizontal max={16}>
        <Spacings.Stack scale="m">
          <Card>
            <Spacings.Stack scale="m">
              <Spacings.Inline justifyContent="space-between">
                <Text.Headline as="h3">Order Details</Text.Headline>
                <div className={`${styles.orderStatus} ${styles[order.orderState.toLowerCase()]}`}>
                  {order.orderState}
                </div>
              </Spacings.Inline>

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <InformationIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline isBold>Order Information</Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Order ID</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.id}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
                
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Created</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.createdAt}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>

                {order.lastModifiedAt && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Last Modified</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body truncate>{order.lastModifiedAt}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}
              </Spacings.Stack>

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" scale="xs">
                  <UsersIcon size="medium" color="neutral60" />
                  <div className={styles.sectionHeader}>
                    <Text.Subheadline isBold>Customer Information</Text.Subheadline>
                  </div>
                </Spacings.Inline>
              </div>

              <Spacings.Stack scale="s">
                {order.customerName && (
                  <Spacings.Inline alignItems="flex-start">
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>
                        <Text.Body isBold>Customer Name</Text.Body>
                      </div>
                      <div className={styles.detailValue}>
                        <Text.Body>{order.customerName}</Text.Body>
                      </div>
                    </div>
                  </Spacings.Inline>
                )}
                
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Customer Email</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.customerEmail || 'N/A'}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
                
                <Spacings.Inline alignItems="flex-start">
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>
                      <Text.Body isBold>Customer ID</Text.Body>
                    </div>
                    <div className={styles.detailValue}>
                      <Text.Body>{order.customerId || 'N/A'}</Text.Body>
                    </div>
                  </div>
                </Spacings.Inline>
              </Spacings.Stack>

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
                    <Text.Body isBold>Shipping Address</Text.Body>
                  </div>
                  <div className={styles.detailValue}>
                    <Text.Body>{formatAddress(order.shippingAddress)}</Text.Body>
                  </div>
                </div>
                
                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>
                    <Text.Body isBold>Billing Address</Text.Body>
                  </div>
                  <div className={styles.detailValue}>
                    <Text.Body>{formatAddress(order.billingAddress)}</Text.Body>
                  </div>
                </div>
              </Spacings.Stack>

              {order.lineItems && order.lineItems.length > 0 && (
                <>
                  <div className={styles.sectionDivider}>
                    <Spacings.Inline alignItems="center" scale="xs">
                      <CartIcon size="medium" color="neutral60" />
                      <div className={styles.sectionHeader}>
                        <Text.Subheadline isBold>Line Items</Text.Subheadline>
                      </div>
                    </Spacings.Inline>
                  </div>

                  <Table
                    columns={lineItemColumns}
                    rows={lineItemRows}
                    maxHeight="400px"
                  />
                </>
              )}

              <div className={styles.sectionDivider}>
                <Spacings.Inline alignItems="center" justifyContent="space-between">
                  <Spacings.Inline alignItems="center" scale="xs">
                    <CoinsIcon size="medium" color="neutral60" />
                    <div className={styles.sectionHeader}>
                      <Text.Subheadline isBold>Order Total</Text.Subheadline>
                    </div>
                  </Spacings.Inline>
                  <Text.Headline as="h3" tone="primary">{orderTotal}</Text.Headline>
                </Spacings.Inline>
              </div>
            </Spacings.Stack>
          </Card>
        </Spacings.Stack>
      </Constraints.Horizontal>
    </FormModalPage>
  );
};

export default OrderDetailsModal; 