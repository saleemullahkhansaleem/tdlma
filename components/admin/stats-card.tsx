import { Card, CardContent } from "@/components/ui/card";

export function StatsCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border border-border shadow-sm">
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground py-3 text-2xl font-semibold">
          {value}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
