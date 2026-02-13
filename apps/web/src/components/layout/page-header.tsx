import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="h-1 w-16 gradient-bar rounded-full" />
      <div className="flex items-start justify-between pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy/8">
                <Icon className="h-4.5 w-4.5 text-navy" />
              </div>
            )}
            <h1 className="text-page-title text-navy">{title}</h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground pl-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
