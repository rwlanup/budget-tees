'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AuthCard } from '@/components/shared/auth-card';
import { Button } from '@/components/ui/button';
import { authApi } from '@/modules/auth/api';

function VerifyInner() {
  const token = useSearchParams().get('token');
  const [status, setStatus] = React.useState<'pending' | 'ok' | 'error'>('pending');

  React.useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    let active = true;
    authApi
      .verifyEmail(token)
      .then(() => active && setStatus('ok'))
      .catch(() => active && setStatus('error'));
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <AuthCard title="Email verification">
      <div className="flex flex-col items-center gap-4 text-center">
        {status === 'pending' && (
          <Loader2 className="size-10 animate-spin text-muted-foreground" aria-hidden />
        )}
        {status === 'ok' && (
          <>
            <CheckCircle2 className="size-10 text-success" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Your email is verified. You can sign in now.
            </p>
            <Button asChild className="w-full">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="size-10 text-destructive" aria-hidden />
            <p className="text-sm text-muted-foreground">
              This verification link is invalid or has expired.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
