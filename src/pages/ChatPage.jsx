import { useCallback, useEffect, useState } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import Sidebar from "../components/Sidebar.jsx";
import api from "../api.js";
import "../App.css";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.conversations)) return data.conversations;
  return [];
}

function Chat({ onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setPageError("");
    try {
      const response = await api.get("/conversations/");
      const items = normalizeList(response.data);
      setConversations(items);
      setSelectedConversation((current) => {
        if (current && items.some((item) => item.id === current)) return current;
        return items.length ? items[0].id : null;
      });
    } catch (error) {
      console.error("Could not load conversations:", error.response?.data || error.message);
      setPageError(
        error.response?.status === 401
          ? "Your session has expired. Please log in again."
          : "Could not load conversations. Check that Django is running and the API URL is correct."
      );
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversation) return undefined;

    let cancelled = false;
    const loadMessages = async () => {
      try {
        const response = await api.get(`/conversations/${selectedConversation}/`);
        const data = response.data;
        const messages = Array.isArray(data?.messages)
          ? data.messages
          : Array.isArray(data?.chats)
            ? data.chats
            : [];

        if (!cancelled) {
          setMessagesByConversation((previous) => ({
            ...previous,
            [selectedConversation]: messages,
          }));
        }
      } catch (error) {
        console.error("Could not load messages:", error.response?.data || error.message);
        if (!cancelled) {
          setPageError(
            error.response?.status === 404
              ? "Conversation details endpoint returned 404. Check the Django URL pattern."
              : "Could not load this conversation's messages."
          );
        }
      }
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversation]);

  const createConversation = async () => {
    setPageError("");
    try {
      const response = await api.post("/conversations/", { title: "New Chat" });
      const created = response.data;
      if (!created?.id) {
        throw new Error("Create conversation response did not contain an id.");
      }
      setConversations((previous) => [
        created,
        ...previous.filter((item) => item.id !== created.id),
      ]);
      setMessagesByConversation((previous) => ({ ...previous, [created.id]: [] }));
      setSelectedConversation(created.id);
    } catch (error) {
      console.error("Could not create conversation:", error.response?.data || error.message);
      setPageError(
        error.response?.status === 404
          ? "Create conversation endpoint returned 404. Check the Django URL pattern."
          : "Could not create a conversation. Check the backend response."
      );
    }
  };

  const handleMessageSent = (data) => {
    const conversationId = selectedConversation;
    if (!conversationId) return;

    const messageObject = {
      id: data?.id ?? data?.chat?.id ?? `${Date.now()}`,
      message: data?.message ?? data?.user_message ?? "",
      response: data?.response ?? data?.reply ?? data?.assistant_response ?? "",
    };

    setMessagesByConversation((previous) => ({
      ...previous,
      [conversationId]: [...(previous[conversationId] || []), messageObject],
    }));
  };

  const selected = conversations.find((item) => item.id === selectedConversation);

  return (
    <div className="chat-layout">
      <Sidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        createConversation={createConversation}
        loading={loadingConversations}
        onLogout={onLogout}
      />

      <div className="chat-main">
        {pageError && (
          <div className="page-error" role="alert">
            <span>{pageError}</span>
            <button type="button" onClick={() => setPageError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}

        <ChatWindow
          key={selectedConversation ?? "no-conversation"}
          conversationId={selectedConversation}
          conversationTitle={selected?.title || selected?.name || "New conversation"}
          messages={messagesByConversation[selectedConversation] || []}
          onMessageSent={handleMessageSent}
          onCreateConversation={createConversation}
        />
      </div>
    </div>
  );
}

export default Chat;
