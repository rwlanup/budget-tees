/** Centered card shell for auth pages (sign-in / sign-up / verify). The (auth)
 *  layout supplies the logo + centering; this only renders the titled card. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-lg sm:p-8">{children}</div>
      {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
