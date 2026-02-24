import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Search,
  FileText,
  PenLine,
  BarChart3,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [
    customerCount,
    clusterCount,
    outlineCount,
    contentCount,
    publishedCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.topicCluster.count(),
    prisma.outline.count(),
    prisma.contentPiece.count(),
    prisma.contentPiece.count({ where: { status: "published" } }),
  ]);

  const stats = [
    { label: "Kunden", value: customerCount, icon: Users, href: "/kunden" },
    {
      label: "Themencluster",
      value: clusterCount,
      icon: Search,
      href: "/themenrecherche",
    },
    { label: "Outlines", value: outlineCount, icon: FileText, href: "/outlines" },
    {
      label: "Content Pieces",
      value: contentCount,
      icon: PenLine,
      href: "/content",
    },
  ];

  const quickActions = [
    {
      title: "Kunde anlegen",
      description: "Neues Kundenprofil mit Guidelines erstellen",
      icon: Users,
      href: "/kunden",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Themenrecherche",
      description: "KI-gestützte Themenvorschläge generieren",
      icon: Search,
      href: "/themenrecherche",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Outline erstellen",
      description: "SEO-Outline mit Keywords und Links",
      icon: FileText,
      href: "/outlines",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Content erstellen",
      description: "Vollständigen SEO-Artikel generieren",
      icon: PenLine,
      href: "/content",
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Willkommen bei Claude SEO{" "}
            <span className="text-primary">✦</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Dein vollständiges SEO & Content Marketing Automation Tool
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">
            {publishedCount} veröffentlichte Artikel
          </span>
        </div>
      </div>

      {/* Stats */}
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
                  <Icon className="h-8 w-8 text-muted-foreground/30" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-6">
                    <div
                      className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                      Starten <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Performance CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Performance Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Verfolge Rankings und Klicks für alle veröffentlichten Artikel
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/performance">
              Performance ansehen <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
