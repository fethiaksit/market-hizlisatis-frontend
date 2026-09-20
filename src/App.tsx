import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PosProvider } from './context/PosContext';
import { LoginView } from './views/LoginView';
import { PosView } from './views/PosView';
import { EndOfDayView } from './views/EndOfDayView';
import { AdminView } from './views/AdminView';

const AppContent: React.FC = () => {
  const { activeView } = useAuth();

  switch (activeView) {
    case 'LOGIN':
      return <LoginView />;
    case 'EOD':
      return <EndOfDayView />;
    case 'ADMIN':
      return <AdminView />;
    case 'POS':
    default:
      return (
        <PosProvider>
          <PosView />
        </PosProvider>
      );
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
