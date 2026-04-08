/**
 * Chat API Service — connects to your Node.js backend with Claude
 * 
 * Set VITE_API_URL in your .env or update the fallback URL below
 * when your backend is deployed.
 */

const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  text: string;
  image?: string;       // base64 image data
  imageType?: string;   // e.g. "image/png"
}

export interface ToolUse {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export type ContentBlock = TextBlock | ToolUse;

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: ContentBlock[];
  model: string;
  stop_reason: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Tool result types for UI rendering
export interface ConsultSummary {
  summary: string;
  possible_conditions: { name: string; percentage: number }[];
  confidence_score: number;
  self_care_advice: string;
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface ConsultationPayload {
  consultation_payload: {
    patient_name: string;
    age: number;
    biological_sex: string;
    pathway?: string;
    reason?: string;
  };
}

export interface ModalAction {
  select_care_pathway: boolean;
}

export interface DisconnectAction {
  disconnect_now: boolean;
}

/**
 * Send messages to Claude via your Node.js API
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  options?: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  }
): Promise<ClaudeResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        text: m.text,
        ...(m.image ? { image: m.image, imageType: m.imageType } : {}),
      })),
      model: options?.model || "claude-sonnet-4-6",
      max_tokens: options?.max_tokens || 4096,
      temperature: options?.temperature ?? 1,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      errorData?.error?.message || errorData?.error?.type || `API error (${response.status})`;

    if (response.status === 402) {
      throw new Error("BILLING_ERROR: " + errorMsg);
    }
    if (response.status === 529) {
      throw new Error("OVERLOADED: " + errorMsg);
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Extract text content from Claude response
 */
export function extractText(response: ClaudeResponse): string {
  return response.content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Extract tool calls from Claude response
 */
export function extractToolCalls(response: ClaudeResponse): ToolUse[] {
  return response.content.filter((b): b is ToolUse => b.type === "tool_use");
}
