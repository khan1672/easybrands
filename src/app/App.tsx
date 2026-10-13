import React, { useCallback, useState } from 'react';
import { AppNavigation } from '@navigation/AppNavigation';
import { AppProviders } from '@app/providers/AppProviders';
import { SplashScreen } from '@app/SplashScreen';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback((): void => setShowSplash(false), []);

  return (
    <AppProviders>
      <AppNavigation />
      {showSplash ? <SplashScreen onFinish={hideSplash} /> : null}
    </AppProviders>
  );
};

export default App;