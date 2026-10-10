import { Redirect } from 'expo-router';

import { useAuth } from '../auth/auth-session';
import { StatusMessage } from '../components/StatusMessage';
import { LoginScreen } from '../features/auth/LoginScreen';

export default function LoginRoute() {
  const { state, signIn } = useAuth();

  if (state.status === 'restoring') {
    return <StatusMessage title="Loading…" isLoading />;
  }
  if (state.status === 'signed_in') {
    return <Redirect href="/dashboard" />;
  }
  return <LoginScreen signIn={signIn} notice={state.notice} />;
}
