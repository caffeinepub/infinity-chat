import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Paperclip, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupId } from "../backend";
import {
  useCurrentIdentity,
  useGetMessageHistory,
  useGetUserGroups,
  useSendMessage,
} from "../hooks/useQueries";
import { compressImage, validateImageFile } from "../utils/imageUtils";
import { serializeContent } from "../utils/messageUtils";
import MessageBubble from "./MessageBubble";

interface Props {
  groupId: GroupId;
}

function isSameMinute(a: bigint, b: bigint): boolean {
  const aMin = Number(a / 60_000_000_000n);
  const bMin = Number(b / 60_000_000_000n);
  return aMin === bMin;
}

export default function ChatWindow({ groupId }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    snippet: string;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useGetMessageHistory(groupId);
  const { data: groups } = useGetUserGroups();
  const { mutate: sendMessage } = useSendMessage(groupId);
  const currentUserId = useCurrentIdentity();

  const group = groups?.find((g) => g.id === groupId);
  const groupName = group?.name ?? "Chat";

  // Sort by timestamp ascending, then rolling window of 50
  const displayMessages = (messages ?? [])
    .slice()
    .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
    .slice(-50);
  const messagesCount = displayMessages.length;

  // Scroll to bottom on initial load (instant) and new messages (smooth)
  const prevCountRef = useRef(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new message
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isInitial = prevCountRef.current === 0 && messagesCount > 0;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: isInitial ? "instant" : "smooth",
    });
    prevCountRef.current = messagesCount;
  }, [messagesCount]);

  // Keep textarea focused on mount and after group switch
  // biome-ignore lint/correctness/useExhaustiveDependencies: groupId triggers focus on tab switch
  useEffect(() => {
    textareaRef.current?.focus();
  }, [groupId]);

  const focusInput = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;
    const payload = serializeContent({
      type: "text",
      text: content,
      ...(replyTo ? { replyTo } : {}),
    });
    setInputValue("");
    setReplyTo(null);
    sendMessage(payload);
    // Keep focus immediately — no RAF needed
    textareaRef.current?.focus();
  }, [inputValue, replyTo, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const err = validateImageFile(file);
    if (err) {
      alert(err);
      return;
    }

    try {
      const data = await compressImage(file);
      const payload = serializeContent({
        type: "image",
        data,
        mimeType: file.type,
        ...(replyTo ? { replyTo } : {}),
      });
      setReplyTo(null);
      sendMessage(payload);
      focusInput();
    } catch {
      alert("Failed to process image. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/50 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl message-bubble-own flex items-center justify-center text-white font-bold text-sm">
          {groupName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-sm">{groupName}</h2>
          <p className="text-xs text-muted-foreground">
            {group ? `${group.members.length} members` : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        <div className="px-4 pt-2 pb-2 space-y-0">
          {isLoading ? (
            <div className="space-y-2 py-4" data-ocid="chat.loading_state">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                >
                  <Skeleton
                    className={`h-10 rounded-2xl bg-muted ${
                      i % 2 === 0 ? "w-40" : "w-52"
                    }`}
                  />
                </div>
              ))}
            </div>
          ) : displayMessages.length === 0 ? (
            <div data-ocid="chat.empty_state" className="py-16 text-center">
              <p className="text-muted-foreground text-sm">No messages yet.</p>
              <p className="text-muted-foreground text-xs mt-1">
                Be the first to say something!
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayMessages.map((message, idx) => {
                const nextMsg = displayMessages[idx + 1];
                const prevMsg = displayMessages[idx - 1];
                const sameSenderAsNext =
                  nextMsg &&
                  nextMsg.sender.toString() === message.sender.toString();
                const sameSenderAsPrev =
                  prevMsg &&
                  prevMsg.sender.toString() === message.sender.toString();
                const showAvatar = !sameSenderAsNext;
                const showName = !sameSenderAsPrev;
                // Hide timestamp if the next message is within the same minute
                const showTimestamp =
                  !nextMsg ||
                  !isSameMinute(message.timestamp, nextMsg.timestamp);
                return (
                  <MessageBubble
                    key={message.id.toString()}
                    message={message}
                    isOwn={message.sender.toString() === currentUserId}
                    groupId={groupId}
                    onReply={setReplyTo}
                    showAvatar={showAvatar}
                    showName={showName}
                    showTimestamp={showTimestamp}
                  />
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-card/30 flex-shrink-0">
        {/* Reply context */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between bg-muted/60 rounded-xl px-3 py-2 mb-2 text-xs"
            >
              <span className="text-muted-foreground truncate">
                <span className="font-semibold text-foreground">
                  Replying to:
                </span>{" "}
                {replyTo.snippet}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 flex-shrink-0 hover:text-foreground transition-colors"
                aria-label="Clear reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            data-ocid="chat.upload_button"
            type="button"
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-xl hover:bg-accent/60 flex-shrink-0 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <textarea
            ref={textareaRef}
            data-ocid="chat.textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 resize-none bg-input border border-border rounded-2xl min-h-[44px] max-h-32 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 scrollbar-thin"
            rows={1}
          />
          <Button
            data-ocid="chat.submit_button"
            size="icon"
            className="w-10 h-10 rounded-2xl message-bubble-own text-white border-0 flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 px-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
