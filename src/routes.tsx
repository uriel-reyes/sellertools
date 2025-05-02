import Spacings from '@commercetools-uikit/spacings';
import type { ReactNode } from 'react';
import { useRouteMatch } from 'react-router-dom';
import App from './components/app';
import { AuthProvider } from './contexts/auth-context';
type ApplicationRoutesProps = {
  children?: ReactNode;
};
const ApplicationRoutes = (_props: ApplicationRoutesProps) => {
  const match = useRouteMatch();

  /**
   * When using routes, there is a good chance that you might want to
   * restrict the access to a certain route based on the user permissions.
   * You can evaluate user permissions using the `useIsAuthorized` hook.
   * For more information see https://docs.commercetools.com/merchant-center-customizations/development/permissions
   *
   * NOTE that by default the Custom Application implicitly checks for a "View" permission,
   * otherwise it won't render. Therefore, checking for "View" permissions here
   * is redundant and not strictly necessary.
   */

  return (
    <AuthProvider>
      <Spacings.Inset scale="l">
        <App />
      </Spacings.Inset>
    </AuthProvider>
  );
};
ApplicationRoutes.displayName = 'ApplicationRoutes';

export default ApplicationRoutes;
