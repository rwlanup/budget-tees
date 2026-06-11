import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/** Form-level error banner (non-field errors, e.g. "Invalid credentials"). */
export function FormError({ messages }: { messages?: string[] | null }) {
  if (!messages || messages.length === 0) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="size-4" aria-hidden />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>
        {messages.length === 1 ? (
          messages[0]
        ) : (
          <ul className="list-inside list-disc">
            {messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
