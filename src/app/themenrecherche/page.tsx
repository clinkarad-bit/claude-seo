import type { Metadata } from "next";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { TopicClusterCreateDialog } from "@/components/topics/TopicClusterCreateDialog";

export const metadata: Metadata = { title: "Themenrecherche" };

export default async function ThemenrecherchePage({
  searchParams,
}: {
  searchParams: { customerId?: string };
}) {
  const [clusters, customers] = await Promise.all([
    prisma.topicCluster.findMany({
      where: searchParams.customerId
        ? { customerId: searchParams.customerId }
        : undefined,
      include: {
        customer: true,
        _count: { select: { topics: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({ orderBy: { companyName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Themenrecherche"
        description="KI-gestützte Themenvorschläge für deine Content-Strategie"
        actions={
          <TopicClusterCreateDialog
            customers={customers}
            preselectedCustomerId={searchParams.customerId}
          />
        }
      />

      {clusters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Noch keine Themencluster</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Starte die KI-Themenrecherche für einen Kunden.
          </p>
          <div className="mt-4">
            <TopicClusterCreateDialog
              customers={customers}
              preselectedCustomerId={searchParams.customerId}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {clusters.map((cluster) => (
            <Link key={cluster.id} href={`/themenrecherche/${cluster.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{cluster.name}</p>
                      <StatusBadge status={cluster.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {cluster.customer.companyName} ·{" "}
                      {cluster._count.topics} Themen · Erstellt{" "}
                      {formatDate(cluster.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {cluster._count.topics}
                    </p>
                    <p className="text-xs text-muted-foreground">Themen</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
