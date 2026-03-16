import type { Metadata } from "next";
import { Link as LinkIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Broken Links" };

export default function BrokenLinksPage() {
  return (
    <div>
      <PageHeader
        title="Broken Links"
        description="Finde kaputte Links auf relevanten Seiten und nutze sie als Linkbuilding-Chancen"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <LinkIcon className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Broken Link Building</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Dieses Feature wird gerade entwickelt. Bald kannst du hier kaputte
            Links auf themenrelevanten Seiten finden und als Ersatz deinen
            eigenen Content vorschlagen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
