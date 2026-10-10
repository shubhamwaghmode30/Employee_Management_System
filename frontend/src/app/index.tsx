import { Redirect } from 'expo-router';

import { useAuth } from '../auth/auth-session';
import { StatusMessage } from '../components/StatusMessage';

export default function IndexRoute() {
  const { state } = useAuth();

  if (state.status === 'restoring') {
    return <StatusMessage title="Loading…" isLoading />;
  }
  return <Redirect href={state.status === 'signed_in' ? '/dashboard' : '/login'} />;
}
