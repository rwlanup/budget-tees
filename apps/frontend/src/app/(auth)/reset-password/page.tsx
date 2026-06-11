import { Suspense } from 'react';
import { ResetPasswordForm } from '@/modules/auth/components/reset-password-form';
export const metadata = { title: 'Reset password', description: 'Set a new password for your Budget Tees account.' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
