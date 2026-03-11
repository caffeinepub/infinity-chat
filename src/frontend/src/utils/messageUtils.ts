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
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.type === "text" || parsed.type === "image")) {
      return parsed as MsgContent;
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
