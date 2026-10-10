import { useRouter } from 'expo-router';

import { Dashboard } from '../../features/dashboard/Dashboard';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <Dashboard
      onAddEmployee={() => router.push('/employees/new')}
      onOpenDirectory={() => router.navigate('/employees')}
      onOpenProfile={() => router.navigate('/profile')}
    />
  );
}
