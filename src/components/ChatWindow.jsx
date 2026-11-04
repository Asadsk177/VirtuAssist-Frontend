import { useEffect, useRef, useState } from "react";
import api from "../api.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

function ChatWindow({
  messages = [],
  conversationTitle = "New conversation",
  conversationId,
  onMessageSent,
  onCreateConversation,
}) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pendingUserMessage, setPendingUserMessage] = useState("");
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesAreaRef = useRef(null);

  // Scroll only the messages panel, not the whole page.
  useEffect(() => {
    const panel = messagesAreaRef.current;
    if (panel) {
      panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sending, pendingUserMessage]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = message.trim();
    if ((!text && !selectedFile) || sending) return;

    if (!localStorage.getItem("access")) {
      setError("Your session is missing. Please log in again.");
      window.dispatchEvent(new Event("auth-expired"));
      return;
    }

    if (!conversationId) {
      setError("Create a conversation before sending a message.");
      return;
    }

    setSending(true);
    setError("");
    const displayText = text || `Analyze attachment: ${selectedFile.name}`;
    setPendingUserMessage(displayText);
    setMessage("");

    try {
      let response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("conversation_id", String(conversationId));
        formData.append("message", text);
        formData.append("file", selectedFile);
        response = await api.post("/chat/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/chat/", {
          conversation_id: conversationId,
          message: text,
        });
      }

      onMessageSent?.(response.data);
      setPendingUserMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (requestError) {
      console.error(
        "Chat API error:",
        requestError.response?.data || requestError.message
      );
      setMessage(text);
      setPendingUserMessage("");

      if (requestError.response?.status === 401) {
        setError("Your session expired. Please log in again.");
      } else if (requestError.response?.status === 404) {
        setError("Chat endpoint or conversation was not found. Check your Django URLs.");
      } else {
        const data = requestError.response?.data;
        setError(
          data
            ? typeof data === "string"
              ? data
              : JSON.stringify(data)
            : "Could not reach Django. Make sure the backend is running."
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h2>{conversationTitle}</h2>
        </div>
        <span className="online-status">
          <span className="status-dot" />
          {sending ? "Thinking..." : "Ready"}
        </span>
      </header>

      <section className="messages-area" ref={messagesAreaRef} aria-live="polite">
        {messages.length === 0 && !pendingUserMessage && (
          <div className="welcome">
            <div className="welcome-icon">✦</div>
            <h1>What can we work on?</h1>
            <p>Ask a question, explore an idea, or learn something new.</p>
            {!conversationId && (
              <button
                type="button"
                className="create-first-chat"
                onClick={onCreateConversation}
              >
                + Start a conversation
              </button>
            )}
          </div>
        )}

        {messages.map((msg, index) => (
          <div className="message-group" key={msg.id ?? `${index}-${msg.message ?? msg.content ?? ""}`}>
            <div className="message user-message">
              <span className="message-avatar">You</span>
              <p>{msg.message ?? msg.content ?? ""}</p>
            </div>
            <div className="message assistant-message">
              <span className="assistant-avatar">✦</span>
                <div className="markdown-response">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.response ?? msg.reply ?? msg.assistant_response ?? ""}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {pendingUserMessage && (
          <div className="message-group pending-message">
            <div className="message user-message">
              <span className="message-avatar">You</span>
              <p>{pendingUserMessage}</p>
            </div>
            {sending && (
              <p className="thinking-message">
                ✦ Your assistant is preparing a response...
              </p>
            )}
          </div>
        )}

        <div className="messages-bottom" />
      </section>

      <div className="composer-area">
        {selectedFile && (
          <div className="attachment-chip">
            <span aria-hidden="true">📎</span>
            <span className="attachment-name">{selectedFile.name}</span>
            <button
              type="button"
              aria-label="Remove attachment"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={sending}
            >×</button>
          </div>
        )}
        <form className="message-composer" onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            className="file-input-hidden"
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                setError("Files must be 10 MB or smaller.");
                event.target.value = "";
                return;
              }
              setError("");
              setSelectedFile(file);
            }}
            disabled={sending || !conversationId}
          />
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || !conversationId}
            aria-label="Attach a file or image"
            title="Attach a PDF, text file, or image"
          >＋</button>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={
              conversationId
                ? "Message your AI companion..."
                : "Create a conversation to start chatting"
            }
            rows={1}
            disabled={sending || !conversationId}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={(!message.trim() && !selectedFile) || sending || !conversationId}
            aria-label="Send message"
          >
            {sending ? "…" : "↑"}
          </button>
        </form>

        {error && <p className="inline-error" role="alert">{error}</p>}
        <p className="composer-hint">
          {sending
            ? "Waiting for your assistant..."
            : "Attach PDF, TXT, MD, CSV, JSON, PNG, JPG or WEBP · Max 10 MB"}
        </p>
      </div>
    </section>
  );
}

export default ChatWindow;
