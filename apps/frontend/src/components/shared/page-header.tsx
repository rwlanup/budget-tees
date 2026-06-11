interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned action slot (e.g. a "New" button). */
  action?: React.ReactNode;
  children?: React.ReactNode;
}

/** Standard admin page header: title + optional description and action. */
export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      {children}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
