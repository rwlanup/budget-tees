'use client';

import * as React from 'react';
import { TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ApiError } from '@/lib/api/client';
import { useDeactivateAccount } from '@/modules/account/queries';

export function DeactivateAccountCard() {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const deactivate = useDeactivateAccount();

  const handleConfirm = () => {
    setError(null);
    deactivate.mutate(undefined, {
      onError: (err) =>
        setError(
          err instanceof ApiError ? err.messages.join(' ') : 'Could not deactivate your account.',
        ),
    });
  };

  return (
    <Card className="max-w-lg border-destructive/30">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Deactivate account</CardTitle>
        <CardDescription>
          Hide your profile and sign out everywhere. Nothing is deleted — your orders and addresses
          are kept, and your account is reactivated automatically the next time you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          <TriangleAlert className="size-4" aria-hidden />
          Deactivate account
        </Button>
      </CardContent>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Deactivate your account?"
        description="You'll be signed out immediately. Your account — including orders and addresses — is kept and reactivated automatically the next time you sign in."
        confirmLabel="Deactivate"
        destructive
        loading={deactivate.isPending}
        errorMessage={error}
        onConfirm={handleConfirm}
      />
    </Card>
  );
}
