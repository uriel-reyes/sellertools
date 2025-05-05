import React from 'react';
import Text from '@commercetools-uikit/text';
import Spacings from '@commercetools-uikit/spacings';
import PrimaryButton from '@commercetools-uikit/primary-button';
import { useAuthContext } from '../../contexts/auth-context';
import styles from './reports.module.css';

type Props = {
  onBack: () => void;
  linkToWelcome: string;
};

const Reports: React.FC<Props> = ({ onBack, linkToWelcome }) => {
  const { storeKey } = useAuthContext();

  return (
    <div className={styles.reportsContainer}>
      <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Reports</Text.Headline>
            <Text.Subheadline>
              Store: <span className={styles.storeKeyHighlight}>{storeKey}</span>
            </Text.Subheadline>
          </div>
          <Spacings.Inline scale="s">
            <PrimaryButton
              label="Back to Dashboard"
              onClick={onBack}
            />
          </Spacings.Inline>
        </div>
        
        <Text.Body>Reports</Text.Body>
      </Spacings.Stack>
    </div>
  );
};

export default Reports; 