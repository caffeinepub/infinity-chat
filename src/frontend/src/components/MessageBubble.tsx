import { Reply } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { GroupId, Message } from "../backend";
import { useAddReaction, useGetUserProfile } from "../hooks/useQueries";
import { getSnippet, parseContent } from "../utils/messageUtils";
import { formatTime } from "../utils/timeUtils";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

interface Props {
  message: Message;
  isOwn: boolean;
  groupId: GroupId;
  onReply: (replyTo: { id: string; snippet: string }) => void;
  showAvatar?: boolean;
  showName?: boolean;
  showTimestamp?: boolean;
}

function groupReactions(reactions: Message["reactions"]) {
  const map = new Map<string, number>();
  for (const r of reactions) {
    map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
}

function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) ?? [];
}

function LinkPreview({ url }: { url: string }) {
  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {}
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-2 rounded-xl border border-border bg-muted/40 px-3 py-2 hover:bg-muted/70 transition-colors no-underline"
    >
      <p className="text-xs text-muted-foreground">{hostname}</p>
      <p className="text-xs font-medium truncate mt-0.5">{url}</p>
    </a>
  );
}

function SenderAvatar({
  senderId,
  size = 28,
}: { senderId: string; size?: number }) {
  const { data: profile } = useGetUserProfile(senderId);
  const name = profile?.displayName ?? senderId.slice(0, 6);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs message-bubble-own"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      title={name}
    >
      {initials}
    </div>
  );
}

function SenderName({ senderId }: { senderId: string }) {
  const { data: profile } = useGetUserProfile(senderId);
  const name = profile?.displayName ?? `${senderId.slice(0, 8)}...`;
  return (
    <span className="text-xs font-semibold text-muted-foreground mb-0.5 px-1">
      {name}
    </span>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  groupId,
  onReply,
  showAvatar = true,
  showName = true,
  showTimestamp = true,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const { mutate: addReaction } = useAddReaction(groupId);
  const grouped = groupReactions(message.reactions);
  const content = parseContent(message.content);
  const senderId = message.sender.toString();

  const handleReact = (emoji: string) => {
    addReaction({ messageId: message.id, emoji });
    setShowPicker(false);
  };

  const handleReply = () => {
    onReply({ id: message.id.toString(), snippet: getSnippet(content) });
    setShowPicker(false);
  };

  const urls = content.type === "text" ? extractUrls(content.text) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`group flex items-end gap-2 mb-0 ${
        isOwn ? "flex-row-reverse" : "flex-row"
      } py-[2px]`}
    >
      {/* Avatar placeholder keeps alignment even when hidden */}
      {!isOwn && (
        <div className="flex-shrink-0 mb-1" style={{ width: 30 }}>
          {showAvatar && <SenderAvatar senderId={senderId} size={30} />}
        </div>
      )}

      <div
        className={`flex flex-col max-w-[70%] relative ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        {/* Username — only for first message in a run */}
        {!isOwn && showName && <SenderName senderId={senderId} />}

        {/* Bubble + hover actions */}
        <div className="relative" onMouseLeave={() => setShowPicker(false)}>
          {/* Hover action buttons */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${
              isOwn ? "-left-20" : "-right-20"
            } opacity-0 group-hover:opacity-100 transition-opacity z-10`}
          >
            <button
              type="button"
              aria-label="Reply"
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm hover:bg-accent transition-colors"
              onClick={handleReply}
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-ocid="chat.toggle"
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm hover:bg-accent transition-colors"
              onClick={() => setShowPicker((v) => !v)}
            >
              😊
            </button>
          </div>

          {/* Emoji picker popover */}
          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.15, type: "spring", stiffness: 400 }}
                className={`absolute bottom-full mb-2 ${
                  isOwn ? "right-0" : "left-0"
                } z-20`}
                data-ocid="chat.popover"
              >
                <div className="flex items-center gap-1 bg-popover border border-border rounded-2xl px-2 py-1.5 shadow-deep">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      className="w-8 h-8 text-lg flex items-center justify-center rounded-xl hover:bg-accent transition-colors hover:scale-110 transform"
                      onClick={() => handleReact(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message content */}
          <div
            className={`rounded-2xl text-sm leading-relaxed ${
              isOwn
                ? "message-bubble-own text-white rounded-br-sm"
                : "bg-[oklch(0.19_0.006_50)] border border-border rounded-bl-sm text-foreground"
            }`}
          >
            {/* Reply quote block */}
            {content.replyTo && (
              <div
                className={`px-3 pt-2.5 pb-1 rounded-t-2xl ${
                  isOwn ? "bg-white/10" : "bg-muted/50"
                }`}
              >
                <p
                  className={`text-xs truncate ${
                    isOwn ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  ↩ {content.replyTo.snippet}
                </p>
              </div>
            )}

            {content.type === "image" ? (
              <div className="p-1">
                <img
                  src={content.data}
                  alt={content.caption ?? "shared image"}
                  loading="lazy"
                  className="rounded-xl max-w-full max-h-64 object-cover block"
                />
                {content.caption && (
                  <p className="px-3 py-1.5 text-xs">{content.caption}</p>
                )}
              </div>
            ) : (
              <div className="px-4 py-2.5">
                <p className="whitespace-pre-wrap break-words">
                  {content.text}
                </p>
                {urls.map((url) => (
                  <LinkPreview key={url} url={url} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reactions row */}
        <AnimatePresence>
          {grouped.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-wrap gap-1 mt-0.5"
            >
              {grouped.map(({ emoji, count }) => (
                <button
                  type="button"
                  key={emoji}
                  className="flex items-center gap-0.5 bg-muted/60 hover:bg-muted border border-border rounded-full px-2 py-0.5 text-xs transition-colors"
                  onClick={() => handleReact(emoji)}
                >
                  <span>{emoji}</span>
                  {count > 1 && (
                    <span className="text-muted-foreground">{count}</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timestamp — only shown when minute changes */}
        {showTimestamp && (
          <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
