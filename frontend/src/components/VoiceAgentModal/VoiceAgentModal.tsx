import React, { useState, useEffect, useRef } from 'react';
import './VoiceAgentModal.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string; // URL for audio playback (TTS)
  transcribedText?: string; // Transcribed text from STT (for user messages)
}

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<string>('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefsRef = useRef<{ [key: number]: HTMLAudioElement }>({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    if (isOpen) {
      const savedSessionId = localStorage.getItem('voiceAgentSessionId');
      if (savedSessionId) {
        restoreSession(savedSessionId);
      } else {
        startSession();
      }
    }

    // Cleanup audio URLs on unmount
    return () => {
      Object.values(audioRefsRef.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = '';
          if (audio.src.startsWith('blob:')) {
            URL.revokeObjectURL(audio.src);
          }
        }
      });
      audioRefsRef.current = {};
    };
  }, [isOpen]);

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
        
        const stateResponse = await fetch(`${API_BASE_URL}/voice/session/${sessionIdToRestore}/state`);
        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          setState(stateData.state || '');
        }
      } else {
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      // Request high-quality audio for better transcription
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100, // Higher sample rate for better quality
        } 
      });
      
      // Try to use the best available codec
      let mimeType = 'audio/webm';
      const codecs = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      
      for (const codec of codecs) {
        if (MediaRecorder.isTypeSupported(codec)) {
          mimeType = codec;
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000, // Higher bitrate for better quality
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please enable microphone permissions and try again.');
      setMode('text'); // Fallback to text mode
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!sessionId || isLoading) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`${API_BASE_URL}/voice/session/${sessionId}/voice-message`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to process voice message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Get audio response first (before reading headers)
      const audioBlobResponse = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlobResponse);

      // Get metadata from headers (sanitized, may be truncated)
      const responseTextFromHeader = response.headers.get('X-Response-Text') || '';
      const responseState = response.headers.get('X-State') || state;
      const bookingCode = response.headers.get('X-Booking-Code');

      // Note: X-Response-Text header is sanitized (newlines removed, truncated to 200 chars)
      // We'll use it as a fallback, but the actual full response is in the audio
      // For better UX, we could make a separate API call to get the full text, but for now
      // we'll use the header value or show a generic message
      const displayText = responseTextFromHeader || '[Audio response - click play to hear]';

      // Add user message (we don't have the transcribed text in header, it's in the audio processing)
      // The user's voice was transcribed, but we don't have it here - we could add it in a future update
      const userMessage: Message = {
        role: 'user',
        content: '[Voice message]',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add assistant message with audio
      const assistantMessage: Message = {
        role: 'assistant',
        content: displayText,
        timestamp: new Date(),
        audioUrl: audioUrl,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setState(responseState);

      // Auto-play the audio response
      const audioIndex = messages.length + 1; // Index of the new assistant message
      playAudio(audioIndex, audioUrl);

      if (bookingCode) {
        console.log('Booking created:', bookingCode);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}. Please check:\n1. OPENAI_API_KEY is set in .env\n2. Backend server is running\n3. Check browser console (F12) for details\n\nYou can try again or switch to text mode.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (messageIndex: number, audioUrl: string) => {
    // Stop any currently playing audio
    if (isPlaying !== null && audioRefsRef.current[isPlaying]) {
      audioRefsRef.current[isPlaying].pause();
      audioRefsRef.current[isPlaying].currentTime = 0;
    }

    // Create new audio element if needed
    if (!audioRefsRef.current[messageIndex]) {
      const audio = new Audio(audioUrl);
      audioRefsRef.current[messageIndex] = audio;

      audio.onended = () => {
        setIsPlaying(null);
      };

      audio.onerror = () => {
        console.error('Error playing audio');
        setIsPlaying(null);
      };
    }

    // Play audio
    const audio = audioRefsRef.current[messageIndex];
    audio.play();
    setIsPlaying(messageIndex);
  };

  const stopAudio = () => {
    if (isPlaying !== null && audioRefsRef.current[isPlaying]) {
      audioRefsRef.current[isPlaying].pause();
      audioRefsRef.current[isPlaying].currentTime = 0;
      setIsPlaying(null);
    }
  };

  const handleClose = () => {
    // Don't allow closing by clicking overlay if booking is confirmed - user should explicitly close
    if (state === 'booking_confirmed' || state === 'completed') {
      return; // Prevent accidental closing after booking confirmation
    }
    
    if (sessionId && messages.length > 1) {
      if (window.confirm('You have an active conversation. Are you sure you want to close? Your conversation will be saved.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleOverlayClick = () => {
    // Only close on overlay click if booking is not confirmed
    if (state !== 'booking_confirmed' && state !== 'completed') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="voice-agent-modal-overlay" onClick={handleOverlayClick}>
      <div className="voice-agent-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="voice-agent-modal-header">
          <div className="header-left">
            <h2>🎤 Voice Agent Assistant</h2>
            <p className="subtitle">
              {mode === 'text' ? 'Text-based conversation interface (Phase 6)' : 'Voice conversation interface (Phase 7)'}
            </p>
            {state && (
              <p className="state-indicator">State: <strong>{state}</strong></p>
            )}
          </div>
          <div className="header-right">
            <div className="mode-toggle">
              <button
                className={`mode-button ${mode === 'text' ? 'active' : ''}`}
                onClick={() => {
                  if (isRecording) stopRecording();
                  if (isPlaying !== null) stopAudio();
                  setMode('text');
                }}
                title="Text Mode"
              >
                💬 Text
              </button>
              <button
                className={`mode-button ${mode === 'voice' ? 'active' : ''}`}
                onClick={() => setMode('voice')}
                title="Voice Mode"
              >
                🎤 Voice
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              // Always allow explicit close button click, but show confirmation if booking confirmed
              if (state === 'booking_confirmed' || state === 'completed') {
                if (window.confirm('Booking confirmed! Close the voice agent and return to home?')) {
                  onClose();
                }
              } else {
                handleClose();
              }
            }}
            className="close-button"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="voice-agent-modal-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message message-${message.role}`}
            >
              <div className="message-role">
                {message.role === 'user' ? '👤 You' : message.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}
              </div>
              <div className="message-content">
                {message.content}
                {message.audioUrl && message.role === 'assistant' && (
                  <button
                    className="play-audio-button"
                    onClick={() => {
                      if (isPlaying === index) {
                        stopAudio();
                      } else {
                        playAudio(index, message.audioUrl!);
                      }
                    }}
                    title={isPlaying === index ? 'Stop audio' : 'Play audio'}
                  >
                    {isPlaying === index ? '⏸️' : '▶️'}
                  </button>
                )}
                {message.transcribedText && message.role === 'user' && (
                  <span className="transcribed-badge">🎤 {message.transcribedText}</span>
                )}
              </div>
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

        <div className="voice-agent-modal-input">
          {mode === 'text' ? (
            <>
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
            </>
          ) : (
            <div className="voice-input-container">
              <button
                className={`record-button ${isRecording ? 'recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startRecording();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopRecording();
                }}
                disabled={!sessionId || isLoading}
                title={isRecording ? 'Release to send' : 'Hold to record'}
              >
                {isRecording ? '⏹️ Recording...' : '🎤 Hold to Record'}
              </button>
              {isLoading && (
                <span className="processing-indicator">Processing audio...</span>
              )}
            </div>
          )}
        </div>

        <div className="voice-agent-modal-footer">
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
        </div>
      </div>
    </div>
  );
};

export default VoiceAgentModal;

