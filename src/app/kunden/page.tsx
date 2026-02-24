import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Globe, FileText, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";
import { CustomerCreateDialog } from "@/components/customers/CustomerCreateDialog";

export const metadata: Metadata = { title: "Kunden" };

export default async function KundenPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { topicClusters: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Kunden"
        description="Verwalte deine Kundenprofile mit Guidelines und Beispieltexten"
        actions={<CustomerCreateDialog />}
      />

      {customers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <Link key={customer.id} href={`/kunden/${customer.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                      {customer.companyName.charAt(0)}
                    </div>
                    <Badge variant="secondary">
                      {customer._count.topicClusters} Cluster
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{customer.companyName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {truncate(customer.description, 100)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {customer.domain && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {customer.domain.replace(/https?:\/\//, "")}
                      </span>
                    )}
                    {customer.guidelinesPdf && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <FileText className="h-3 w-3" />
                        Guidelines
                      </span>
                    )}
                    {customer.exampleTextPdf && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
                        <FileText className="h-3 w-3" />
                        Beispieltext
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Erstellt {formatDate(customer.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <Users className="h-12 w-12 text-muted-foreground/30" />
      <h3 className="mt-4 font-semibold">Noch keine Kunden</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Lege deinen ersten Kunden an, um zu starten.
      </p>
      <div className="mt-4">
        <CustomerCreateDialog />
      </div>
    </div>
  );
}
