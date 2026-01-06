import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './VoiceChat.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface VoiceChatProps {}

const VoiceChat: React.FC<VoiceChatProps> = () => {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<string>('');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Check for existing session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('voiceAgentSessionId');
    if (savedSessionId) {
      restoreSession(savedSessionId);
    } else {
      startSession();
    }
  }, []);

  // Warn before leaving if conversation is active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionId && messages.length > 1 && state !== 'booking_confirmed' && state !== 'completed') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, messages.length, state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/voice/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      localStorage.setItem('voiceAgentSessionId', data.sessionId);
      setMessages([
        {
          role: 'assistant',
          content: data.greeting,
          timestamp: new Date(),
        },
      ]);
      setState('greeting');
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreSession = async (sessionIdToRestore: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/voice/session/${sessionIdToRestore}/history`);
      
      if (!response.ok) {
        // Session doesn't exist, start new one
        localStorage.removeItem('voiceAgentSessionId');
        startSession();
        return;
      }

      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        setSessionId(sessionIdToRestore);
        setMessages(data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        })));
        
        // Get current state
        const stateResponse = await fetch(`${API_BASE_URL}/voice/session/${sessionIdToRestore}/state`);
        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          setState(stateData.state || '');
        }
      } else {
        // No history, start new session
        startSession();
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      localStorage.removeItem('voiceAgentSessionId');
      startSession();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveConversation = () => {
    if (sessionId && messages.length > 1 && state !== 'booking_confirmed' && state !== 'completed') {
      setShowLeaveConfirm(true);
    } else {
      navigateToHome();
    }
  };

  const navigateToHome = () => {
    localStorage.removeItem('voiceAgentSessionId');
    navigate('/');
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/voice/session/${sessionId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setState(data.state);

      // If booking code is provided, highlight it
      if (data.bookingCode) {
        console.log('Booking created:', data.bookingCode);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎤 Voice Agent Assistant</h1>
            <p className="subtitle">Text-based conversation interface (Phase 6)</p>
            {state && (
              <p className="state-indicator">State: <strong>{state}</strong></p>
            )}
          </div>
          <button
            onClick={handleLeaveConversation}
            className="end-conversation-button"
            title="End Conversation"
          >
            End Conversation
          </button>
        </div>
      </div>

      {showLeaveConfirm && (
        <div className="leave-confirm-modal">
          <div className="leave-confirm-content">
            <h3>Leave Conversation?</h3>
            <p>You have an active conversation. Are you sure you want to leave? Your conversation will be saved, but you'll need to start a new session when you return.</p>
            <div className="leave-confirm-buttons">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="cancel-button"
              >
                Stay
              </button>
              <button
                onClick={navigateToHome}
                className="leave-button"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="voice-chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message message-${message.role}`}
          >
            <div className="message-role">
              {message.role === 'user' ? '👤 You' : message.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}
            </div>
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message message-assistant">
            <div className="message-role">🤖 Assistant</div>
            <div className="message-content typing">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="voice-chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={!sessionId || isLoading}
          className="chat-input"
        />
        <button
          onClick={sendMessage}
          disabled={!sessionId || isLoading || !input.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>

      <div className="voice-chat-footer">
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to restart? This will start a new conversation.')) {
              localStorage.removeItem('voiceAgentSessionId');
              setMessages([]);
              startSession();
            }
          }} 
          className="restart-button"
        >
          🔄 Start New Conversation
        </button>
        <p className="footer-note">
          This is a text-based interface for testing the voice agent logic. 
          Audio input/output will be added in Phase 7.
        </p>
      </div>
    </div>
  );
};

export default VoiceChat;

