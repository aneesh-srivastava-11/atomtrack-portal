import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerCheckInsPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Team check-ins</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Team quarterly check-ins appear here after employees submit planned and actual achievement data.
      </CardContent>
    </Card>
  );
}
