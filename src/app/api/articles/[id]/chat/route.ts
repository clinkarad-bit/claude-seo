import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJSON } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

function generateMockChatResponse(message: string, phase: "outline" | "content"): string {
  if (phase === "outline") {
    if (message.toLowerCase().includes("mehr") || message.toLowerCase().includes("hinzufügen")) {
      return "Ich habe die gewünschten Ergänzungen in die Outline aufgenommen. Die zusätzlichen Punkte stärken die inhaltliche Tiefe und verbessern die Keyword-Abdeckung. Soll ich noch weitere Anpassungen vornehmen?";
    }
    if (message.toLowerCase().includes("entfern") || message.toLowerCase().includes("lösch") || message.toLowerCase().includes("weniger")) {
      return "Verstanden, ich habe die genannten Abschnitte gestrafft bzw. entfernt. Die Outline ist jetzt fokussierter auf die Kern-Keywords. Passt die neue Struktur besser?";
    }
    if (message.toLowerCase().includes("reihenfolge") || message.toLowerCase().includes("umstell")) {
      return "Die Reihenfolge der Abschnitte wurde angepasst. Der neue Aufbau folgt einer logischeren Leserführung: vom Problem über die Diagnose zur Lösung. Sieht das für Sie besser aus?";
    }
    return "Danke für das Feedback! Ich habe die Outline entsprechend Ihrer Anmerkungen überarbeitet. Die Änderungen betreffen sowohl die Struktur als auch die Keyword-Integration. Bitte prüfen Sie, ob die Anpassungen Ihren Vorstellungen entsprechen.";
  }

  // Content phase
  if (message.toLowerCase().includes("ton") || message.toLowerCase().includes("stil")) {
    return "Ich habe den Tonfall des Artikels angepasst. Der Text ist jetzt weniger formal und spricht die Leser direkter an, ohne dabei an Fachlichkeit zu verlieren. Möchten Sie noch weitere stilistische Anpassungen?";
  }
  if (message.toLowerCase().includes("kürz") || message.toLowerCase().includes("lang")) {
    return "Der Abschnitt wurde entsprechend angepasst. Ich achte darauf, dass die Kernaussagen erhalten bleiben und die SEO-relevanten Keywords weiterhin natürlich eingebunden sind.";
  }
  if (message.toLowerCase().includes("keyword") || message.toLowerCase().includes("seo")) {
    return "Die Keyword-Dichte wurde optimiert. Ich habe die wichtigsten Suchbegriffe natürlicher in den Text eingearbeitet und dabei darauf geachtet, dass der Lesefluss erhalten bleibt. Die WDF*IDF-Analyse zeigt jetzt bessere Werte.";
  }
  return "Vielen Dank für Ihr Feedback! Ich habe die genannten Änderungen umgesetzt. Der Artikel wurde entsprechend überarbeitet, wobei die SEO-Optimierung und die Lesbarkeit beibehalten wurden. Bitte überprüfen Sie die Anpassungen.";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { message, phase } = body as { message: string; phase: "outline" | "content" };

  if (!message || !phase) {
    return NextResponse.json(
      { error: "Nachricht und Phase sind erforderlich" },
      { status: 400 }
    );
  }

  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) {
    return NextResponse.json({ error: "Artikel nicht gefunden" }, { status: 404 });
  }

  // Get existing feedback history
  const feedbackField = phase === "outline" ? "outlineFeedback" : "contentFeedback";
  const existingFeedback = parseJSON<ChatMessage[]>(
    article[feedbackField],
    []
  );

  // Create user message
  const userMessage: ChatMessage = {
    role: "user",
    content: message,
    timestamp: Date.now(),
  };

  // Generate AI response (mock)
  const aiResponseText = generateMockChatResponse(message, phase);
  const assistantMessage: ChatMessage = {
    role: "assistant",
    content: aiResponseText,
    timestamp: Date.now() + 1,
  };

  // Update feedback history
  const updatedFeedback = [...existingFeedback, userMessage, assistantMessage];

  await prisma.article.update({
    where: { id },
    data: {
      [feedbackField]: JSON.stringify(updatedFeedback),
    },
  });

  return NextResponse.json({
    feedback: updatedFeedback,
    response: assistantMessage,
  });
}
