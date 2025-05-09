import React from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import Spacings from '@commercetools-uikit/spacings';
import Card from '@commercetools-uikit/card';
import Text from '@commercetools-uikit/text';
import { 
  CartIcon, 
  UsersIcon, 
  ListWithSearchIcon, 
  CoinsIcon, 
  TagIcon, 
  FrontendStudioIcon, 
  GraphIcon,
  LogoutIcon,
  GearIcon
} from '@commercetools-uikit/icons';
import PrimaryButton from '@commercetools-uikit/primary-button';
import SecondaryButton from '@commercetools-uikit/secondary-button';
import { useAuthContext } from '../../contexts/auth-context';
import styles from './seller-dashboard.module.css';
import messages from './messages';

type DashboardCardProps = {
  title: string;
  icon: React.ReactElement;
  onClick: () => void;
};

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, onClick }) => (
  <Card className={styles.dashboardCard} onClick={onClick}>
    <Spacings.Stack alignItems="center" scale="m">
      <div className={styles.iconContainer}>
        <div className={styles.iconWrapper}>
          {React.cloneElement(icon, { size: "big", color: "surface" })}
        </div>
      </div>
      <Text.Headline as="h3">{title}</Text.Headline>
    </Spacings.Stack>
  </Card>
);

type SellerDashboardProps = {
  onNavigate: (route: string) => void;
};

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const intl = useIntl();
  const history = useHistory();
  const { logout } = useAuthContext();

  const handleNavigation = (route: string) => {
    onNavigate(route);
  };

  const handleLogout = () => {
    logout();
    // Redirect to the root/welcome page
    history.push('/');
  };

  // Dashboard items with UI Kit icons
  const dashboardItems = [
    {
      id: 'orders',
      title: intl.formatMessage(messages.viewOrders),
      icon: <CartIcon />,
      onClick: () => handleNavigation('/orders'),
    },
    {
      id: 'customers',
      title: intl.formatMessage(messages.manageCustomers),
      icon: <UsersIcon />,
      onClick: () => handleNavigation('/customers'),
    },
    {
      id: 'products',
      title: intl.formatMessage(messages.selectProducts),
      icon: <ListWithSearchIcon />,
      onClick: () => handleNavigation('/products'),
    },
    {
      id: 'prices',
      title: intl.formatMessage(messages.managePrices),
      icon: <CoinsIcon />,
      onClick: () => handleNavigation('/prices'),
    },
    // Temporarily hiding price list management card
    // {
    //   id: 'pricelists',
    //   title: intl.formatMessage(messages.managePriceLists),
    //   icon: <CoinsIcon />,
    //   onClick: () => handleNavigation('/price-lists'),
    // },
    {
      id: 'promotions',
      title: intl.formatMessage(messages.managePromotions),
      icon: <TagIcon />,
      onClick: () => handleNavigation('/promotions'),
    },
    {
      id: 'content',
      title: intl.formatMessage(messages.manageContent),
      icon: <FrontendStudioIcon />,
      onClick: () => handleNavigation('/content'),
    },
    {
      id: 'reports',
      title: intl.formatMessage(messages.viewReports),
      icon: <GraphIcon />,
      onClick: () => handleNavigation('/reports'),
    },
    {
      id: 'configuration',
      title: intl.formatMessage(messages.storeConfiguration),
      icon: <GearIcon />,
      onClick: () => handleNavigation('/configuration'),
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Spacings.Stack scale="xl">
        <div className={styles.logoutContainer}>
          <SecondaryButton
            label={intl.formatMessage(messages.logout)}
            onClick={handleLogout}
            iconLeft={<LogoutIcon />}
            className={styles.logoutButton}
          />
        </div>

        <div className={styles.dashboardTitle}>
          <Text.Headline as="h1">{intl.formatMessage(messages.title)}</Text.Headline>
        </div>
        
        <div className={styles.dashboardGrid}>
          {dashboardItems.map((item) => (
            <DashboardCard
              key={item.id}
              title={item.title}
              icon={item.icon}
              onClick={item.onClick}
            />
          ))}
        </div>
      </Spacings.Stack>
    </div>
  );
};

export default SellerDashboard; 