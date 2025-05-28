import Card from '@commercetools-uikit/card';
import {
  CartIcon,
  CoinsIcon,
  FrontendStudioIcon,
  GearIcon,
  GraphIcon,
  ListWithSearchIcon,
  TagIcon,
  UsersIcon,
} from '@commercetools-uikit/icons';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';
import SelectField from '@commercetools-uikit/select-field';
import Spacings from '@commercetools-uikit/spacings';
import Text from '@commercetools-uikit/text';
import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useBusinessUnitContext } from '../../contexts/business-unit-context';
import messages from './messages';
import styles from './seller-dashboard.module.css';

type DashboardCardProps = {
  title: string;
  icon: React.ReactElement;
  onClick: () => void;
};

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  onClick,
}) => (
  <Card className={styles.dashboardCard} onClick={onClick}>
    <Spacings.Stack alignItems="center" scale="m">
      <div className={styles.iconContainer}>
        <div className={styles.iconWrapper}>
          {React.cloneElement(icon, { size: 'big', color: 'surface' })}
        </div>
      </div>
      <Text.Headline as="h3">{title}</Text.Headline>
    </Spacings.Stack>
  </Card>
);

type SellerDashboardProps = {
  onNavigate: (route: string) => void;
};

// Define the custom event type for SelectField
type TCustomEvent = {
  target: {
    id?: string;
    name?: string;
    value?: string | string[] | null;
  };
  persist: () => void;
};

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const intl = useIntl();
  const {
    businessUnits,
    selectedBusinessUnit,
    loading,
    error,
    selectBusinessUnit,
  } = useBusinessUnitContext();

  const handleNavigate = (route: string) => {
    onNavigate(route);
  };

  // Memoize business unit options to prevent unnecessary re-renders
  const businessUnitOptions = useMemo(() => {
    return businessUnits.map((bu) => ({
      label: bu.name,
      value: bu.id,
    }));
  }, [businessUnits]);

  const handleBusinessUnitChange = (event: TCustomEvent) => {
    const businessUnitId = event.target.value as string;
    if (businessUnitId) {
      // Only update if value has changed
      if (businessUnitId !== selectedBusinessUnit?.id) {
        selectBusinessUnit(businessUnitId);
      }
    }
  };

  // Dashboard items with UI Kit icons
  const dashboardItems = [
    {
      id: 'orders',
      title: intl.formatMessage(messages.viewOrders),
      icon: <CartIcon />,
      onClick: () => handleNavigate('/orders'),
    },
    {
      id: 'customers',
      title: intl.formatMessage(messages.manageCustomers),
      icon: <UsersIcon />,
      onClick: () => handleNavigate('/customers'),
    },
    {
      id: 'products',
      title: intl.formatMessage(messages.selectProducts),
      icon: <ListWithSearchIcon />,
      onClick: () => handleNavigate('/products'),
    },
    {
      id: 'prices',
      title: intl.formatMessage(messages.managePrices),
      icon: <CoinsIcon />,
      onClick: () => handleNavigate('/prices'),
    },
    // Temporarily hiding price list management card
    // {
    //   id: 'pricelists',
    //   title: intl.formatMessage(messages.managePriceLists),
    //   icon: <CoinsIcon />,
    //   onClick: () => handleNavigate('/price-lists'),
    // },
    {
      id: 'promotions',
      title: intl.formatMessage(messages.managePromotions),
      icon: <TagIcon />,
      onClick: () => handleNavigate('/promotions'),
    },
    {
      id: 'content',
      title: intl.formatMessage(messages.manageContent),
      icon: <FrontendStudioIcon />,
      onClick: () => handleNavigate('/content'),
    },
    {
      id: 'reports',
      title: intl.formatMessage(messages.viewReports),
      icon: <GraphIcon />,
      onClick: () => handleNavigate('/reports'),
    },
    {
      id: 'configuration',
      title: intl.formatMessage(messages.storeConfiguration),
      icon: <GearIcon />,
      onClick: () => handleNavigate('/configuration'),
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Spacings.Stack scale="xl">
        <div className={styles.headerContainer}>
          <div className={styles.dashboardTitle}>
            <Text.Headline as="h1">
              {intl.formatMessage(messages.title)}
            </Text.Headline>
          </div>
        </div>

        <div className={styles.businessUnitContainer}>
          {loading ? (
            <Spacings.Inline alignItems="center">
              <LoadingSpinner />
              <Text.Body>
                {intl.formatMessage(messages.loadingBusinessUnits)}
              </Text.Body>
            </Spacings.Inline>
          ) : businessUnits.length > 0 ? (
            <div className={styles.businessUnitSelector}>
              <SelectField
                title={intl.formatMessage(messages.businessUnitSelector)}
                name="businessUnitSelector"
                value={selectedBusinessUnit?.id || ''}
                options={businessUnitOptions}
                onChange={handleBusinessUnitChange}
                horizontalConstraint={13}
                iconLeft={<UsersIcon />}
              />
            </div>
          ) : (
            <Text.Body>
              {intl.formatMessage(messages.noBusinessUnits)}
            </Text.Body>
          )}
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
