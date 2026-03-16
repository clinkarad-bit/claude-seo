import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Globe, Users, ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { ProjectCreateDialog } from "@/components/linkbuilding/ProjectCreateDialog";

export const metadata: Metadata = { title: "Linkbuilding Projekte" };

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

export default async function ProjektePage() {
  const projects = await prisma.lBProject.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          backlinks: true,
          members: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Linkbuilding Projekte"
        description="Verwalte deine Linkbuilding-Projekte und Kampagnen"
        actions={<ProjectCreateDialog />}
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">Noch keine Projekte</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Lege dein erstes Linkbuilding-Projekt an, um zu starten.
          </p>
          <div className="mt-4">
            <ProjectCreateDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/linkbuilding/projekte/${project.id}`}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                      {project.name.charAt(0)}
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        LB_STATUS_COLORS[project.status] ??
                          "bg-gray-100 text-gray-700 border-gray-200"
                      )}
                    >
                      {LB_STATUS_LABELS[project.status] ?? project.status}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold">{project.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {project.domain}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowUpRight className="h-3 w-3" />
                      {project._count.backlinks} Backlinks
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {project._count.members} Mitglieder
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Erstellt {formatDate(project.createdAt)}
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
