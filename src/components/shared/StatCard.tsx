import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideProps } from 'lucide-react';
import type React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType<LucideProps>;
  unit?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, icon: Icon, unit, isLoading = false }: StatCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-5 w-5 text-accent" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
           <div className="h-8 w-3/4 animate-pulse rounded bg-muted-foreground/20"></div>
        ) : (
          <div className="text-2xl font-bold text-foreground">
            {value}
            {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
