import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function PageHeader({ title, description, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-3 mb-1">
        {Icon && <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
