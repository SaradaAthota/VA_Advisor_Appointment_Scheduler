"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
require("./VoiceAgentModal.css");
const VoiceAgentModal = ({ isOpen, onClose }) => {
    const [sessionId, setSessionId] = (0, react_1.useState)(null);
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [state, setState] = (0, react_1.useState)('');
    const [mode, setMode] = (0, react_1.useState)('text');
    const [isRecording, setIsRecording] = (0, react_1.useState)(false);
    const [isPlaying, setIsPlaying] = (0, react_1.useState)(null);
    const messagesEndRef = (0, react_1.useRef)(null);
    const mediaRecorderRef = (0, react_1.useRef)(null);
    const audioChunksRef = (0, react_1.useRef)([]);
    const audioRefsRef = (0, react_1.useRef)({});
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    (0, react_1.useEffect)(() => {
        if (isOpen) {
            const savedSessionId = localStorage.getItem('voiceAgentSessionId');
            if (savedSessionId) {
                restoreSession(savedSessionId);
            }
            else {
                startSession();
            }
        }
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
    (0, react_1.useEffect)(() => {
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
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                }
                catch (e) {
                }
                throw new Error(errorMessage);
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
        }
        catch (error) {
            console.error('Error starting session:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('ERR_CONNECTION_REFUSED')) {
                alert(`Cannot connect to backend server.\n\nPlease ensure:\n1. Backend server is running on ${API_BASE_URL}\n2. Run "npm run start:dev" in the backend directory\n3. Check browser console (F12) for details`);
            }
            else {
                alert(`Failed to start conversation: ${errorMsg}\n\nPlease check:\n1. Backend server is running\n2. Check browser console (F12) for details`);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    const restoreSession = async (sessionIdToRestore) => {
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
                setMessages(data.messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: new Date(msg.timestamp),
                })));
                const stateResponse = await fetch(`${API_BASE_URL}/voice/session/${sessionIdToRestore}/state`);
                if (stateResponse.ok) {
                    const stateData = await stateResponse.json();
                    setState(stateData.state || '');
                }
            }
            else {
                startSession();
            }
        }
        catch (error) {
            console.error('Error restoring session:', error);
            localStorage.removeItem('voiceAgentSessionId');
            startSession();
        }
        finally {
            setIsLoading(false);
        }
    };
    const sendMessage = async () => {
        if (!input.trim() || !sessionId || isLoading)
            return;
        const userMessage = {
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
            const assistantMessage = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setState(data.state);
            if (data.bookingCode) {
                console.log('Booking created:', data.bookingCode);
            }
        }
        catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const convertWebMToWAV = async (webmBlob) => {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const fileReader = new FileReader();
            fileReader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const wavBuffer = audioBufferToWav(audioBuffer);
                    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                    resolve(wavBlob);
                }
                catch (error) {
                    reject(error);
                }
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(webmBlob);
        });
    };
    const audioBufferToWav = (buffer) => {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const bytesPerSample = 2;
        const blockAlign = numberOfChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;
        const bufferSize = 44 + dataSize;
        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        writeString(0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        return arrayBuffer;
    };
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                }
            });
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
                audioBitsPerSecond: 128000,
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
                try {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    if (audioBlob.size < 10_000) {
                        throw new Error('Recording too short. Please record for at least 1-2 seconds.');
                    }
                    const wavBlob = await convertWebMToWAV(audioBlob);
                    if (wavBlob.size < 10_000) {
                        throw new Error('Converted audio is too short. Please try recording again.');
                    }
                    await sendVoiceMessage(wavBlob);
                }
                catch (conversionError) {
                    console.error('Audio processing failed:', conversionError);
                    const errorMessage = {
                        role: 'assistant',
                        content: `Sorry, I couldn't process your audio: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}. Please try recording again (at least 1-2 seconds).`,
                        timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                    setIsLoading(false);
                }
            };
            mediaRecorder.start();
            setIsRecording(true);
        }
        catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied. Please enable microphone permissions and try again.');
            setMode('text');
        }
    };
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    const sendVoiceMessage = async (audioBlob) => {
        if (!sessionId || isLoading)
            return;
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            const response = await fetch(`${API_BASE_URL}/voice/session/${sessionId}/voice-message`, {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                let errorMessage = 'Failed to process voice message';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                }
                catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const audioBlobResponse = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlobResponse);
            const responseTextFromHeader = response.headers.get('X-Response-Text') || '';
            const responseState = response.headers.get('X-State') || state;
            const bookingCode = response.headers.get('X-Booking-Code');
            const displayText = responseTextFromHeader || '[Audio response - click play to hear]';
            const userMessage = {
                role: 'user',
                content: '[Voice message]',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, userMessage]);
            const assistantMessage = {
                role: 'assistant',
                content: displayText,
                timestamp: new Date(),
                audioUrl: audioUrl,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setState(responseState);
            const audioIndex = messages.length + 1;
            playAudio(audioIndex, audioUrl);
            if (bookingCode) {
                console.log('Booking created:', bookingCode);
            }
        }
        catch (error) {
            console.error('Error sending voice message:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            const errorMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${errorMsg}. Please check:\n1. OPENAI_API_KEY is set in .env\n2. Backend server is running\n3. Check browser console (F12) for details\n\nYou can try again or switch to text mode.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const playAudio = (messageIndex, audioUrl) => {
        if (isPlaying !== null && audioRefsRef.current[isPlaying]) {
            audioRefsRef.current[isPlaying].pause();
            audioRefsRef.current[isPlaying].currentTime = 0;
        }
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
        if (state === 'booking_confirmed' || state === 'completed') {
            return;
        }
        if (sessionId && messages.length > 1) {
            if (window.confirm('You have an active conversation. Are you sure you want to close? Your conversation will be saved.')) {
                onClose();
            }
        }
        else {
            onClose();
        }
    };
    const handleOverlayClick = () => {
        if (state !== 'booking_confirmed' && state !== 'completed') {
            handleClose();
        }
    };
    if (!isOpen)
        return null;
    return (<div className="voice-agent-modal-overlay" onClick={handleOverlayClick}>
      <div className="voice-agent-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="voice-agent-modal-header">
          <div className="header-left">
            <h2>🎤 Voice Agent Assistant</h2>
            <p className="subtitle">
              {mode === 'text' ? 'Text-based conversation interface (Phase 6)' : 'Voice conversation interface (Phase 7)'}
            </p>
            {state && (<p className="state-indicator">State: <strong>{state}</strong></p>)}
          </div>
          <div className="header-right">
            <div className="mode-toggle">
              <button className={`mode-button ${mode === 'text' ? 'active' : ''}`} onClick={() => {
            if (isRecording)
                stopRecording();
            if (isPlaying !== null)
                stopAudio();
            setMode('text');
        }} title="Text Mode">
                💬 Text
              </button>
              <button className={`mode-button ${mode === 'voice' ? 'active' : ''}`} onClick={() => setMode('voice')} title="Voice Mode">
                🎤 Voice
              </button>
            </div>
          </div>
          <button onClick={() => {
            if (state === 'booking_confirmed' || state === 'completed') {
                if (window.confirm('Booking confirmed! Close the voice agent and return to home?')) {
                    onClose();
                }
            }
            else {
                handleClose();
            }
        }} className="close-button" title="Close">
            ✕
          </button>
        </div>

        <div className="voice-agent-modal-messages">
          {messages.map((message, index) => (<div key={index} className={`message message-${message.role}`}>
              <div className="message-role">
                {message.role === 'user' ? '👤 You' : message.role === 'assistant' ? '🤖 Assistant' : '⚙️ System'}
              </div>
              <div className="message-content">
                {message.content}
                {message.audioUrl && message.role === 'assistant' && (<button className="play-audio-button" onClick={() => {
                    if (isPlaying === index) {
                        stopAudio();
                    }
                    else {
                        playAudio(index, message.audioUrl);
                    }
                }} title={isPlaying === index ? 'Stop audio' : 'Play audio'}>
                    {isPlaying === index ? '⏸️' : '▶️'}
                  </button>)}
                {message.transcribedText && message.role === 'user' && (<span className="transcribed-badge">🎤 {message.transcribedText}</span>)}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>))}
          {isLoading && (<div className="message message-assistant">
              <div className="message-role">🤖 Assistant</div>
              <div className="message-content typing">Thinking...</div>
            </div>)}
          <div ref={messagesEndRef}/>
        </div>

        <div className="voice-agent-modal-input">
          {mode === 'text' ? (<>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message here..." disabled={!sessionId || isLoading} className="chat-input"/>
              <button onClick={sendMessage} disabled={!sessionId || isLoading || !input.trim()} className="send-button">
                Send
              </button>
            </>) : (<div className="voice-input-container">
              <button className={`record-button ${isRecording ? 'recording' : ''}`} onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={(e) => {
                e.preventDefault();
                startRecording();
            }} onTouchEnd={(e) => {
                e.preventDefault();
                stopRecording();
            }} disabled={!sessionId || isLoading} title={isRecording ? 'Release to send' : 'Hold to record'}>
                {isRecording ? '⏹️ Recording...' : '🎤 Hold to Record'}
              </button>
              {isLoading && (<span className="processing-indicator">Processing audio...</span>)}
            </div>)}
        </div>

        <div className="voice-agent-modal-footer">
          <button onClick={() => {
            if (window.confirm('Are you sure you want to restart? This will start a new conversation.')) {
                localStorage.removeItem('voiceAgentSessionId');
                setMessages([]);
                startSession();
            }
        }} className="restart-button">
            🔄 Start New Conversation
          </button>
        </div>
      </div>
    </div>);
};
exports.default = VoiceAgentModal;
