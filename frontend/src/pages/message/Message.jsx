import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import MessageService from '../../services/MessageService';

const Message = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversations');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      initializeMessaging();
    }
  }, [user]);

  const initializeMessaging = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load conversations and online users in parallel
      const [conversationsData, onlineUsersData] = await Promise.all([
        MessageService.getConversations(),
        MessageService.getOnlineUsers()
      ]);
      
      setConversations(conversationsData);
      setOnlineUsers(onlineUsersData.filter(u => u.id !== user.id)); // Exclude current user
      
      // Select first conversation if exists
      if (conversationsData.length > 0) {
        await selectConversation(conversationsData[0]);
      }
    } catch (error) {
      console.error('Failed to initialize messaging:', error);
      setError('Failed to load messaging data');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    try {
      setCurrentConversation(conversation);
      MessageService.setCurrentConversation(conversation);
      
      const messagesData = await MessageService.getMessages(conversation.id);
      setMessages(messagesData);
      setActiveTab('conversations');
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setError('Failed to load messages');
    }
  };

  const selectUser = async (selectedUser) => {
    try {
      setLoading(true);
      const conversation = await MessageService.getOrCreateConversation(selectedUser.id);
      
      // Update conversations list if it's a new conversation
      if (!conversations.find(c => c.id === conversation.id)) {
        setConversations(prev => [conversation, ...prev]);
      }
      
      await selectConversation(conversation);
    } catch (error) {
      console.error('Failed to create conversation with user:', error);
      setError('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== '' && currentConversation && user) {
      try {
        const newMessage = await MessageService.sendMessage(currentConversation.id, inputMessage.trim());
        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        
        // Update conversation in the list to show latest message
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, last_message: newMessage, updated_at: newMessage.created_at }
            : conv
        ));
      } catch (error) {
        console.error('Failed to send message:', error);
        setError('Failed to send message');
      }
    }
  };

  return (
    <>
      <style>
        {`
        .app-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 70px); /* Account for navbar height */
          width: 100%;
          background-color: #f3f4f6;
          padding: 1rem;
        }
        .main-wrapper {
          background-color: #fff;
          border-radius: 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        .header-section {
          display: flex;
          align-items: center;
          width: 33.333%;
          gap: 1rem;
        }
        .search-input {
          width: 100%;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          border: 1px solid #d1d5db;
          outline: none;
          box-shadow: 0 0 0 2px transparent;
          transition: box-shadow 0.2s;
        }
        .search-input:focus {
          box-shadow: 0 0 0 2px #3e387f;
        }
        .nav-buttons-container {
          flex: 1;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        .nav-button {
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .nav-button.active {
          background-color: #3e387f;
          color: #fff;
        }
        .nav-button.inactive {
          background-color: #e5e7eb;
          color: #1f2937;
        }
        .nav-button.inactive:hover {
          background-color: #d1d5db;
        }
        .show-members-button {
          width: 33.333%;
          display: flex;
          justify-content: flex-end;
        }
        .show-members-button button {
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-weight: 600;
          background-color: #3e387f;
          color: #fff;
          transition: background-color 0.2s;
        }
        .show-members-button button:hover {
          background-color: #2c2865;
        }
        .main-content {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .user-list {
          width: 25%;
          background-color: #f9fafb;
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          padding: 1rem;
        }
        .user-list h2 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #4b5563;
        }
        .user-item {
          padding: 0.75rem;
          background-color: #fff;
          border-radius: 0.75rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: background-color 0.2s;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }
        .user-item:hover {
          background-color: #f3f4f6;
        }
        .user-item.active {
          background-color: #3e387f;
          color: #fff;
        }
        .user-item.active:hover {
          background-color: #2c2865;
        }
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          gap: 1rem;
          overflow-y: auto;
          background-color: #fff;
        }
        .chat-message {
          max-width: 28rem;
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }
        .chat-message.user {
          background-color: #3e387f;
          color: #fff;
          align-self: flex-end;
        }
        .chat-message.other {
          background-color: #e5e7eb;
          color: #1f2937;
          align-self: flex-start;
        }
        .empty-chat {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 1.125rem;
          font-weight: 300;
        }
        .message-input-container {
          padding: 1.5rem;
          background-color: #fff;
          border-top: 1px solid #e5e7eb;
        }
        .message-input-container div {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .message-input {
          flex: 1;
          padding: 1rem 1.5rem;
          border-radius: 9999px;
          border: 2px solid #d1d5db;
          outline: none;
          transition: box-shadow 0.2s;
        }
        .message-input:focus {
          box-shadow: 0 0 0 2px #3e387f;
        }
        .send-button {
          padding: 1rem;
          border-radius: 9999px;
          background-color: #3e387f;
          color: #fff;
          transition: background-color 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .send-button:hover {
          background-color: #2c2865;
        }
        .send-icon {
          width: 1.5rem;
          height: 1.5rem;
        }
        .footer {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          font-size: 0.75rem;
          color: #6b7280;
          gap: 1.5rem;
          border-top: 1px solid #e5e7eb;
          background-color: #f3f4f6;
        }
        .footer a {
          transition: color 0.2s;
        }
        .footer a:hover {
          color: #3e387f;
        }
        .social-link {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        `}
      </style>
      
      <Navbar />
      
      <div className="app-container">
        <div className="main-wrapper">
          {/* Header */}
          <header className="header">
            <div className="header-section">
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
              />
            </div>
            <div className="nav-buttons-container">
              <button 
                className={`nav-button ${activeTab === 'conversations' ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab('conversations')}
              >
                Conversations
              </button>
              <button 
                className={`nav-button ${activeTab === 'people' ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab('people')}
              >
                People
              </button>
            </div>
            <div className="show-members-button">
              <button>
                Show Members
              </button>
            </div>
          </header>

          {/* Main Content: User List and Chat Area */}
          <main className="main-content">
            {/* User/Conversation List */}
            <div className="user-list">
              {loading ? (
                <div>Loading...</div>
              ) : error ? (
                <div style={{ color: 'red' }}>Error: {error}</div>
              ) : activeTab === 'conversations' ? (
                <div>
                  <h2>Conversations</h2>
                  {conversations.length === 0 ? (
                    <div className="user-item">No conversations yet</div>
                  ) : (
                    conversations.map(conversation => {
                      const otherUser = MessageService.getOtherParticipant(conversation, user?.id);
                      const title = MessageService.getConversationTitle(conversation, user?.id);
                      return (
                        <div 
                          key={conversation.id} 
                          className={`user-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
                          onClick={() => selectConversation(conversation)}
                        >
                          <div style={{ fontWeight: 'bold' }}>{title}</div>
                          {conversation.last_message && (
                            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '4px' }}>
                              {conversation.last_message.content.substring(0, 50)}{conversation.last_message.content.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div>
                  <h2>Online Users</h2>
                  {onlineUsers.length === 0 ? (
                    <div className="user-item">No users online</div>
                  ) : (
                    onlineUsers.map(onlineUser => (
                      <div 
                        key={onlineUser.id} 
                        className="user-item"
                        onClick={() => selectUser(onlineUser)}
                      >
                        <div style={{ fontWeight: 'bold' }}>{onlineUser.username}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>{onlineUser.email}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="chat-area">
              {!currentConversation ? (
                <div className="empty-chat">
                  {activeTab === 'conversations' ? 'Select a conversation to start messaging' : 'Select a user to start messaging'}
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isCurrentUser = msg.sender.id === user?.id;
                  return (
                    <div
                      key={msg.id || index}
                      className={`chat-message ${isCurrentUser ? 'user' : 'other'}`}
                    >
                      {!isCurrentUser && (
                        <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '4px' }}>
                          {msg.sender.username}
                        </div>
                      )}
                      <div>{msg.content}</div>
                      <div style={{ fontSize: '0.7em', color: '#999', marginTop: '4px' }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-chat">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>
          </main>

          {/* Message Input */}
          <div className="message-input-container">
            <div>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder={currentConversation ? "Type a message..." : "Select a conversation to start messaging"}
                className="message-input"
                disabled={!currentConversation || loading}
              />
              <button
                onClick={handleSendMessage}
                className="send-button"
                disabled={!currentConversation || loading || !inputMessage.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="send-icon">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.917H12.75a.75.75 0 010 1.5H4.984l-2.432 7.918a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="footer">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms & Conditions</a>
            <div className="social-link">
              <span role="img" aria-label="discord">
                👾
              </span>
              <span>Discord</span>
            </div>
            <div className="social-link">
              <span role="img" aria-label="instagram">
                📸
              </span>
              <span>Instagram</span>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Message;
