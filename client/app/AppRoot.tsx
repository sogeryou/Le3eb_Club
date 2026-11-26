import { AppProvider, useApp } from './AppContext';
import { AdminRoute } from './AdminRoute';
import OriginalPresentation from '../original/OriginalPresentation';
import { WelcomeAuth } from '../components/auth/WelcomeAuth';

const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

function UserFrontend() {
  const { authUser, authSessionReady } = useApp();
  if (!authSessionReady) return <main className="welcome-auth" aria-busy="true" />;
  if (!authUser) return <WelcomeAuth />;
  return <OriginalPresentation key={authUser.id} />;
}

export default function AppRoot() {
  return (
    <AppProvider>
      {isAdminPath ? <AdminRoute /> : <UserFrontend />}
    </AppProvider>
  );
}
