import type { LucideProps } from 'lucide-react';
import type React from 'react';

interface SectionTitleProps {
  title: string;
  icon?: React.ElementType<LucideProps>;
  iconClassName?: string;
}

export function SectionTitle({ title, icon: Icon, iconClassName }: SectionTitleProps) {
  return (
    <h2 className="font-headline text-3xl font-bold mb-6 flex items-center text-primary">
      {Icon && <Icon className={cn("mr-3 h-8 w-8", iconClassName)} />}
      {title}
    </h2>
  );
}

// Helper for conditional classnames, assuming cn is available or can be defined.
// If not, this can be simplified or cn can be imported from "@/lib/utils"
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
