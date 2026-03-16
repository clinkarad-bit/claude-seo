import type { Metadata } from "next";
import { GitCompare } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Gap-Analyse" };

export default function GapAnalysePage() {
  return (
    <div>
      <PageHeader
        title="Gap-Analyse"
        description="Vergleiche dein Backlink-Profil mit dem deiner Wettbewerber"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <GitCompare className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Backlink Gap-Analyse</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Dieses Feature wird gerade entwickelt. Bald kannst du hier dein
            Backlink-Profil mit Wettbewerbern vergleichen und ungenutztes
            Potenzial entdecken.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
