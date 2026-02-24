"use client";

import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => Promise<void>;
  title?: string;
}

export function FeedbackDialog({
  open,
  onClose,
  onSubmit,
  title = "Feedback geben",
}: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setLoading(true);
    try {
      await onSubmit(feedback.trim());
      setFeedback("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="feedback">
            Was soll geändert oder verbessert werden?
          </Label>
          <Textarea
            id="feedback"
            placeholder="z.B. Mache den Text kürzer und direkter, ergänze mehr Beispiele..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!feedback.trim() || loading}>
            {loading && <Loader2 className="animate-spin" />}
            KI überarbeiten lassen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
