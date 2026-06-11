'use client';

import * as React from 'react';
import { X } from 'lucide-react';

/** Thin promo bar above the header. Dismissible (persisted for the session). */
export function AnnouncementBar({ message }: { message?: string }) {
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setDismissed(sessionStorage.getItem('bt-announce-dismissed') === '1');
  }, []);

  if (!message || dismissed) return null;

  return (
    <div className="relative bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-10 py-2 text-center text-xs font-medium sm:text-sm">
        {message}
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          sessionStorage.setItem('bt-announce-dismissed', '1');
          setDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-80 hover:opacity-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
