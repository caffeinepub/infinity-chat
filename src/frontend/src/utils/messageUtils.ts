export type MsgContent =
  | { type: "text"; text: string; replyTo?: { id: string; snippet: string } }
  | {
      type: "image";
      data: string;
      mimeType: string;
      caption?: string;
      replyTo?: { id: string; snippet: string };
    };

export function parseContent(raw: string): MsgContent {
  try {
    let parsed = JSON.parse(raw);
    // Handle double-encoded JSON (string inside string)
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return { type: "text", text: parsed };
      }
    }
    if (parsed && (parsed.type === "text" || parsed.type === "image")) {
      return parsed as MsgContent;
    }
    // Parsed but unrecognised shape — show as plain text
    if (typeof parsed === "object" && parsed !== null) {
      const text =
        typeof parsed.text === "string" ? parsed.text : JSON.stringify(parsed);
      return { type: "text", text };
    }
    return { type: "text", text: raw };
  } catch {
    return { type: "text", text: raw };
  }
}

export function serializeContent(c: MsgContent): string {
  return JSON.stringify(c);
}

export function getSnippet(content: MsgContent): string {
  if (content.type === "image") return "[image]";
  return content.text.slice(0, 60);
}
