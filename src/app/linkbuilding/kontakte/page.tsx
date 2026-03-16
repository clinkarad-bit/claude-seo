import type { Metadata } from "next";
import { Contact } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Kontakte" };

export default function KontaktePage() {
  return (
    <div>
      <PageHeader
        title="Kontakte"
        description="Verwalte Outreach-Kontakte für deine Linkbuilding-Kampagnen"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Contact className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Kontaktverwaltung</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Dieses Feature wird gerade entwickelt. Bald kannst du hier
            Kontaktpersonen von relevanten Websites verwalten und
            Outreach-Kampagnen koordinieren.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
