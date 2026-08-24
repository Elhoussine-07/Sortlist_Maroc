import { camelizeKeys, restCall } from "@/services/http";
import { useAuthStore } from "@/store/auth.store";

export interface ChatbotReply {
  reply: string;

  escalate: boolean;
  matchedTopic: string | null;
}

export async function sendChatbotMessage(
  message: string,
  context: Record<string, unknown> = {},
): Promise<ChatbotReply> {
  const isAuthenticated = Boolean(useAuthStore.getState().token);
  const raw = await restCall<unknown>("ia", isAuthenticated ? "/chatbot" : "/chatbot/public", {
    method: "POST",
    body: { message, context },
  });
  const data = camelizeKeys(raw) as Record<string, unknown>;
  return {
    reply: String(data["reply"] ?? ""),
    escalate: Boolean(data["escalate"] ?? false),
    matchedTopic: (data["matchedTopic"] as string | null | undefined) ?? null,
  };
}
