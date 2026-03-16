import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  GitCompare,
  AtSign,
  Link as LinkIcon,
  Contact,
  Activity,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Projekt Details" };

const LB_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  archived: "bg-gray-100 text-gray-700 border-gray-200",
};

const LB_STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.lBProject.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { companyName: true } },
      _count: {
        select: {
          backlinks: true,
          competitors: true,
          mentions: true,
          brokenLinks: true,
          contacts: true,
          members: true,
        },
      },
    },
  });

  if (!project) notFound();

  const recentLogs = await prisma.auditLog.findMany({
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
      entityId: project.id,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true } } },
  });

  const kpis = [
    { label: "Backlinks", value: project._count.backlinks, icon: ArrowUpRight, color: "bg-green-50 text-green-600" },
    { label: "Wettbewerber", value: project._count.competitors, icon: GitCompare, color: "bg-blue-50 text-blue-600" },
    { label: "Mentions", value: project._count.mentions, icon: AtSign, color: "bg-purple-50 text-purple-600" },
    { label: "Broken Links", value: project._count.brokenLinks, icon: LinkIcon, color: "bg-orange-50 text-orange-600" },
    { label: "Kontakte", value: project._count.contacts, icon: Contact, color: "bg-pink-50 text-pink-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/linkbuilding/projekte"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Projekte
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={`${project.domain}${project.customer ? ` — ${project.customer.companyName}` : ""}`}
        actions={
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium",
              LB_STATUS_COLORS[project.status] ??
                "bg-gray-100 text-gray-700 border-gray-200"
            )}
          >
            {LB_STATUS_LABELS[project.status] ?? project.status}
          </span>
        }
      />

      <Tabs defaultValue="uebersicht" className="space-y-6">
        <TabsList>
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="gap">Gap-Analyse</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="broken">Broken Links</TabsTrigger>
          <TabsTrigger value="kontakte">Kontakte</TabsTrigger>
        </TabsList>

        {/* Übersicht Tab */}
        <TabsContent value="uebersicht" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Letzte Aktivitäten
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Noch keine Aktivitäten für dieses Projekt.
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
                          {log.user.name}
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
        </TabsContent>

        {/* Placeholder Tabs */}
        <TabsContent value="backlinks">
          <PlaceholderTab
            icon={ArrowUpRight}
            title="Backlinks"
            description="Backlink-Verwaltung für dieses Projekt wird hier angezeigt."
          />
        </TabsContent>

        <TabsContent value="gap">
          <PlaceholderTab
            icon={GitCompare}
            title="Gap-Analyse"
            description="Wettbewerber-Analyse und Backlink-Gap wird hier angezeigt."
          />
        </TabsContent>

        <TabsContent value="mentions">
          <PlaceholderTab
            icon={AtSign}
            title="Brand Mentions"
            description="Brand Mentions für dieses Projekt werden hier angezeigt."
          />
        </TabsContent>

        <TabsContent value="broken">
          <PlaceholderTab
            icon={LinkIcon}
            title="Broken Links"
            description="Broken Link Opportunities werden hier angezeigt."
          />
        </TabsContent>

        <TabsContent value="kontakte">
          <PlaceholderTab
            icon={Contact}
            title="Kontakte"
            description="Outreach-Kontakte für dieses Projekt werden hier angezeigt."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlaceholderTab({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Icon className="h-12 w-12 text-muted-foreground/30" />
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <p className="mt-4 text-xs text-muted-foreground/60">
          Dieses Feature wird gerade entwickelt...
        </p>
      </CardContent>
    </Card>
  );
}
