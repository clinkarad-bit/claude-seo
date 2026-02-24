import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { TopicClusterView } from "@/components/topics/TopicClusterView";

export const metadata: Metadata = { title: "Themencluster" };

export default async function TopicClusterDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cluster = await prisma.topicCluster.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      topics: {
        include: {
          _count: { select: { keywords: true } },
          outline: { select: { id: true } },
        },
        orderBy: [{ category: "asc" }, { searchVolumeTotal: "desc" }],
      },
    },
  });

  if (!cluster) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/themenrecherche"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Themencluster
        </Link>
      </div>
      <TopicClusterView cluster={cluster} />
    </div>
  );
}
