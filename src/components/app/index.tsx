import React from 'react';
import { Route } from 'react-router-dom';
import { Switch } from 'react-router-dom';
import Welcome from '../welcome/welcome';
import SellerDashboard from '../seller-dashboard/seller-dashboard';
import { useAuthContext } from '../../contexts/auth-context';

const App = () => {
  const { isLoggedIn, storeKey } = useAuthContext();
  return (
    <>
      {isLoggedIn && storeKey ? (
        <Switch>
          <Route>
            <SellerDashboard storeKey={storeKey} onNavigate={() => {}} />
            {/* Add Routes here */}
          </Route>
        </Switch>
      ) : (
        <Switch>
          <Route>
            <Welcome />
          </Route>
        </Switch>
      )}
    </>
  );
};

export default App;
