import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import Spacings from '@commercetools-uikit/spacings';
import Card from '@commercetools-uikit/card';
import Text from '@commercetools-uikit/text';
import Orders from '../orders/orders';
import Customers from '../customers/customers';
import Products from '../products/products';
import Prices from '../prices/prices';
import Promotions from '../promotions/promotions';
import styles from './seller-dashboard.module.css';
import messages from './messages';

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
  const intl = useIntl();
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
  
  if (activeView === '/products') {
    console.log('Navigating to Products view with storeKey:', storeKey);
    return <Products storeKey={storeKey} onBack={goBackToDashboard} />;
  }

  if (activeView === '/prices') {
    return <Prices storeKey={storeKey} onBack={goBackToDashboard} />;
  }

  if (activeView === '/promotions') {
    console.log('Navigating to Promotions view with channelKey:', storeKey);
    return <Promotions channelKey={storeKey} onBack={goBackToDashboard} />;
  }

  if (activeView === '/content') {
    console.log('Navigating to Content view with storeKey:', storeKey);
    // TODO: Replace with actual content component when created
    return (
      <div>
        <h1>Content Management</h1>
        <button onClick={goBackToDashboard}>Back to Dashboard</button>
      </div>
    );
  }

  // Otherwise show the dashboard
  const dashboardItems = [
    {
      id: 'orders',
      title: intl.formatMessage(messages.viewOrders),
      emoji: '📋',
      onClick: () => handleNavigation('/orders'),
    },
    {
      id: 'customers',
      title: intl.formatMessage(messages.manageCustomers),
      emoji: '👥',
      onClick: () => handleNavigation('/customers'),
    },
    {
      id: 'products',
      title: intl.formatMessage(messages.selectProducts),
      emoji: '🛒',
      onClick: () => handleNavigation('/products'),
    },
    {
      id: 'prices',
      title: intl.formatMessage(messages.managePrices),
      emoji: '💰',
      onClick: () => handleNavigation('/prices'),
    },
    {
      id: 'pricelists',
      title: intl.formatMessage(messages.managePriceLists),
      emoji: '📊',
      onClick: () => handleNavigation('/price-lists'),
    },
    {
      id: 'promotions',
      title: intl.formatMessage(messages.managePromotions),
      emoji: '🏷️',
      onClick: () => handleNavigation('/promotions'),
    },
    {
      id: 'content',
      title: intl.formatMessage(messages.manageContent),
      emoji: '📝',
      onClick: () => handleNavigation('/content'),
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Spacings.Stack scale="xl">
        <div className={styles.dashboardTitle}>
          <Text.Headline as="h1">{intl.formatMessage(messages.title)}</Text.Headline>
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