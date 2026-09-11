import React from 'react';
import { AppNavigation } from '@navigation/AppNavigation';
import { AppProviders } from '@app/providers/AppProviders';

const App: React.FC = () => {
  return (
    <AppProviders>
      <AppNavigation />
    </AppProviders>
  );
};

export default App;