import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import Orders from '../orders/orders';
import Customers from '../customers/customers';

import styles from './seller-dashboard.module.css';

type DashboardCardProps = {
  title: string;
  emoji: string;
  onClick: () => void;
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, emoji, onClick }) => (
  <Card className={styles.dashboardCard} onClick={onClick}>
    <Spacings.Stack alignItems="center" scale="m">
      <div className={styles.iconContainer}>
        <span className={styles.emoji}>{emoji}</span>
      </div>
      <Text.Headline as="h3">{title}</Text.Headline>
    </Spacings.Stack>
  </Card>
);

type SellerDashboardProps = {
  onNavigate: (route: string) => void;
  storeKey: string;
};

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate, storeKey }) => {
  const [activeView, setActiveView] = useState<string | null>(null);

  const handleNavigation = (route: string) => {
    setActiveView(route);
    onNavigate(route);
  };

  const goBackToDashboard = () => {
    setActiveView(null);
  };

  // If we're in a specific view, show that component
  if (activeView === '/orders') {
    return <Orders storeKey={storeKey} onBack={goBackToDashboard} />;
  }

  if (activeView === '/customers') {
    return <Customers storeKey={storeKey} onBack={goBackToDashboard} />;
  }

  // Otherwise show the dashboard
  const dashboardItems = [
    {
      id: 'orders',
      title: 'View Orders',
      emoji: '📋',
      onClick: () => handleNavigation('/orders'),
    },
    {
      id: 'customers',
      title: 'Manage Customers',
      emoji: '👥',
      onClick: () => handleNavigation('/customers'),
    },
    {
      id: 'products',
      title: 'Select Products',
      emoji: '🛒',
      onClick: () => handleNavigation('/products'),
    },
    {
      id: 'prices',
      title: 'Manage Prices',
      emoji: '💰',
      onClick: () => handleNavigation('/prices'),
    },
    {
      id: 'pricelists',
      title: 'Manage Price Lists',
      emoji: '📊',
      onClick: () => handleNavigation('/price-lists'),
    },
    {
      id: 'promotions',
      title: 'Manage Promotions',
      emoji: '🏷️',
      onClick: () => handleNavigation('/promotions'),
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Spacings.Stack scale="xl">
        <div className={styles.dashboardTitle}>
          <Text.Headline as="h1">Seller Dashboard</Text.Headline>
        </div>
        
        <div className={styles.dashboardGrid}>
          {dashboardItems.map((item) => (
            <DashboardCard
              key={item.id}
              title={item.title}
              emoji={item.emoji}
              onClick={item.onClick}
            />
          ))}
        </div>
      </Spacings.Stack>
    </div>
  );
};

export default SellerDashboard; 