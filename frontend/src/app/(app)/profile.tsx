import { useRouter } from 'expo-router';

import { changePassword } from '../../api/auth-api';
import { useAuth } from '../../auth/auth-session';
import { useSessionUser } from '../../auth/session-user-context';
import { ProfilePage } from '../../features/profile/ProfilePage';

export default function ProfileScreen() {
  const router = useRouter();
  const { apiClient } = useAuth();
  const user = useSessionUser();

  return (
    <ProfilePage
      submitPasswordChange={(currentPassword, newPassword) =>
        changePassword(apiClient, currentPassword, newPassword)
      }
      onOpenRecord={() => router.push(`/employees/${user.id}`)}
    />
  );
}
