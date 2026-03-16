import type { Metadata } from "next";
import { AtSign } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Brand Mentions" };

export default function MentionsPage() {
  return (
    <div>
      <PageHeader
        title="Brand Mentions"
        description="Finde Erwähnungen deiner Marke im Web und wandle sie in Backlinks um"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <AtSign className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Brand Mentions</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Dieses Feature wird gerade entwickelt. Bald kannst du hier
            Erwähnungen deiner Marke automatisch finden und in
            Linkbuilding-Chancen umwandeln.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
