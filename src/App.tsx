import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PosProvider } from './context/PosContext';
import { LoginView } from './views/LoginView';
import { PosView } from './views/PosView';
import { EndOfDayView } from './views/EndOfDayView';
import { AdminView } from './views/AdminView';

import { GlobalWarningDialog } from './components/GlobalWarningDialog';

const AppContent: React.FC = () => {
  const { activeView } = useAuth();

  switch (activeView) {
    case 'LOGIN':
      return <LoginView />;
    case 'EOD':
      return <EndOfDayView />;
    case 'ADMIN':
      return (
        <PosProvider>
          <AdminView />
        </PosProvider>
      );
    case 'POS':
    default:
      return <PosView />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PosProvider>
        <AppContent />
        <GlobalWarningDialog />
      </PosProvider>
    </AuthProvider>
  );
};

export default App;
