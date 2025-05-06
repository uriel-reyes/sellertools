import Spacings from '@commercetools-uikit/spacings';
import React from 'react'
import styles from './content.module.css';
import Text from '@commercetools-uikit/text';
import PrimaryButton from '@commercetools-uikit/primary-button';
import CsmWrapper from './csm-wrapper';
import { useAuthContext } from '../../contexts/auth-context';
import { useApplicationContext } from '@commercetools-frontend/application-shell-connectors';
type Props = {
    onBack: () => void;
    linkToWelcome: string;
}

const Content = ({onBack}: Props) => {
  const {storeKey} = useAuthContext();
  const { environment }: { environment: { CMS_API_URL: string } } = useApplicationContext();
  return (
    <Spacings.Stack scale="l">
        <div className={styles.header}>
          <div>
            <Text.Headline as="h1">Contentools</Text.Headline>
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
        {storeKey && (
          <CsmWrapper
            baseurl={environment.CMS_API_URL}
            business-unit-key={storeKey}
            content-item-app-enabled='true'
            locale='en-US'
            available-locales='["en-US"]'
        />
        )}
    </Spacings.Stack>
  )
}

export default Content