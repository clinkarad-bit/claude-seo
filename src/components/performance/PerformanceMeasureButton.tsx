"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface Props {
  contentPieceIds: string[];
  size?: "default" | "sm";
  label?: string;
}

export function PerformanceMeasureButton({
  contentPieceIds,
  size = "default",
  label,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const measureAll = async () => {
    setLoading(true);
    let successCount = 0;
    try {
      for (const id of contentPieceIds) {
        const res = await fetch("/api/performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentPieceId: id }),
        });
        if (res.ok) successCount++;
      }
      toast({
        title: "Performance gemessen",
        description: `${successCount} von ${contentPieceIds.length} Artikel gemessen`,
      });
      router.refresh();
    } catch {
      toast({
        title: "Fehler",
        description: "Performance konnte nicht gemessen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={size === "sm" ? "outline" : "default"}
      size={size}
      onClick={measureAll}
      disabled={loading || contentPieceIds.length === 0}
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : contentPieceIds.length > 1 ? (
        <RefreshCw />
      ) : (
        <BarChart3 />
      )}
      {label ??
        (contentPieceIds.length > 1
          ? `Alle ${contentPieceIds.length} messen`
          : "Messen")}
    </Button>
  );
}
