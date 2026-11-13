import { AppProvider, useApp } from './AppContext';
import { AdminRoute } from './AdminRoute';
import OriginalPresentation from '../original/OriginalPresentation';

const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

function UserFrontend() {
  const { authUser } = useApp();
  return <OriginalPresentation key={authUser?.id ?? 'guest'} />;
}

export default function AppRoot() {
  return (
    <AppProvider>
      {isAdminPath ? <AdminRoute /> : <UserFrontend />}
    </AppProvider>
  );
}
