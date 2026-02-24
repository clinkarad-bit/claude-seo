import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, FileText, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Kunde" };

export default async function KundeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      topicClusters: {
        include: { _count: { select: { topics: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/kunden"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Kunden
        </Link>
      </div>

      <PageHeader
        title={customer.companyName}
        description={customer.description}
        actions={
          <Button asChild>
            <Link href={`/themenrecherche?customerId=${customer.id}`}>
              <Plus /> Themencluster erstellen
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info panel */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kundendaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.domain && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={customer.domain}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {customer.domain}
                  </a>
                </div>
              )}
              {customer.guidelinesPdf && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <a
                    href={customer.guidelinesPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline"
                  >
                    Guidelines PDF
                  </a>
                </div>
              )}
              {customer.exampleTextPdf && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <a
                    href={customer.exampleTextPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Beispieltext PDF
                  </a>
                </div>
              )}
              <p className="text-muted-foreground">
                Kunde seit {formatDate(customer.createdAt)}
              </p>
            </CardContent>
          </Card>

          {customer.guidelinesText && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guidelines (Auszug)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-xs text-muted-foreground line-clamp-6">
                  {customer.guidelinesText}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Topic clusters */}
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            Themencluster ({customer.topicClusters.length})
          </h2>

          {customer.topicClusters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 font-medium">Noch keine Themencluster</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Starte die Themenrecherche für diesen Kunden
              </p>
              <Button asChild className="mt-4">
                <Link href={`/themenrecherche?customerId=${customer.id}`}>
                  <Plus /> Themencluster erstellen
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.topicClusters.map((cluster) => (
                <Link key={cluster.id} href={`/themenrecherche/${cluster.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{cluster.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {cluster._count.topics} Themen · Erstellt{" "}
                          {formatDate(cluster.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={cluster.status} />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
