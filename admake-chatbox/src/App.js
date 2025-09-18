import React from 'react';
import { UserProvider, useUser } from './UserContext';
import Login from './Login';
import Router from './routes';
import ThemeProvider from './theme';
import ThemeSettings from './components/settings';

function MainApp() {
  const { userId } = useUser();

  if (!userId) return <Login />;

  return (
    <ThemeProvider>
      <ThemeSettings>
        <Router />
      </ThemeSettings>
    </ThemeProvider>
  );
}

function App() {
  return (
    <UserProvider>
      <MainApp />
    </UserProvider>
  );
}

export default App;
