import { ProfilePage } from '@/modules/account/components/profile-page';

export const metadata = {
  title: 'My account',
  description: 'Manage your Budget Tees profile, orders, and addresses.',
};

export default function AccountPage() {
  return <ProfilePage />;
}
