import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from './store/authStore';
import { fetchProfile } from './services/auth';
import { FullScreenLoader } from './components/FullScreenLoader';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ChatPage } from './features/chat/ChatPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { useAuthActions } from './services/auth';
import { useTheme } from './hooks/useTheme';

const ProtectedLayout = () => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Outlet />
    </Suspense>
  );
};

const LoadProfile = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const { logout } = useAuthActions();

  useEffect(() => {
    if (!token) {
      queryClient.removeQueries({ queryKey: ['profile'] });
      return;
    }

    fetchProfile()
      .then((user) => setUser(user))
      .catch(() => {
        setUser(null);
        logout();
      });
  }, [logout, queryClient, setUser, token]);

  return null;
};

const ThemeProvider = () => {
  useTheme();
  return null;
};

const App = () => (
  <>
    <ThemeProvider />
    <LoadProfile />
    <Routes>
      <Route
        element={
          <Suspense fallback={<FullScreenLoader />}>
            <Outlet />
          </Suspense>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  </>
);

export default App;

