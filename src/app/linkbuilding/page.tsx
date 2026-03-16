import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderKanban,
  ArrowUpRight,
  AtSign,
  Link as LinkIcon,
  Activity,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Linkbuilding Dashboard" };

export default async function LinkbuildingDashboardPage() {
  const [projectCount, backlinkCount, mentionCount, brokenLinkCount, recentLogs] =
    await Promise.all([
      prisma.lBProject.count(),
      prisma.lBBacklink.count(),
      prisma.lBBrandMention.count({ where: { status: "new" } }),
      prisma.lBBrokenLink.count({ where: { status: "found" } }),
      prisma.auditLog.findMany({
        where: {
          entity: {
            in: [
              "LBProject",
              "LBBacklink",
              "LBBrandMention",
              "LBBrokenLink",
              "LBContact",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
    ]);

  const stats = [
    {
      label: "Projekte",
      value: projectCount,
      icon: FolderKanban,
      href: "/linkbuilding/projekte",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Backlinks",
      value: backlinkCount,
      icon: ArrowUpRight,
      href: "/linkbuilding/backlinks",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Neue Mentions",
      value: mentionCount,
      icon: AtSign,
      href: "/linkbuilding/mentions",
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Broken Links",
      value: brokenLinkCount,
      icon: LinkIcon,
      href: "/linkbuilding/broken-links",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Linkbuilding Dashboard"
        description="Backlink-Profil verwalten, Mentions tracken und Linkbuilding-Chancen finden"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.href} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Letzte Aktivitäten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Aktivitäten vorhanden.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.user.name} &middot; {log.entity}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
