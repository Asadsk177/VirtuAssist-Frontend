function Sidebar({
  conversations = [],
  selectedConversation,
  setSelectedConversation,
  createConversation,
  loading = false,
  onLogout,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>✦ VirtuAssist</h2>
        <p>Your personal AI companion</p>
      </div>

      <button type="button" className="new-chat-btn" onClick={createConversation}>
        + New conversation
      </button>

      <p className="sidebar-label">YOUR CONVERSATIONS</p>

      <div className="conversation-list">
        {loading && <p className="sidebar-message">Loading conversations…</p>}
        {!loading && conversations.length === 0 && (
          <p className="sidebar-message">No conversations yet.</p>
        )}
        {conversations.map((conversation) => (
          <button
            type="button"
            key={conversation.id}
            className={`conversation-item ${selectedConversation === conversation.id ? "active" : ""}`}
            onClick={() => setSelectedConversation(conversation.id)}
          >
            <span aria-hidden="true">💬</span>
            <span className="conversation-title">
              {conversation.title || conversation.name || `Conversation ${conversation.id}`}
            </span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>AI workspace</span>
        {onLogout && (
          <button type="button" className="logout-btn" onClick={onLogout}>
            Log out
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
