import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const PodcastAIAssistant = ({ episodeId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const typeSpeed = 10; // milliseconds per character

  // Scroll to bottom of chat when messages update, but not during typing
  useEffect(() => {
    if (!isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Handle typing animation for AI messages
  useEffect(() => {
    if (isTyping && typingMessageId !== null) {
      const currentMessage = messages.find((m) => m.id === typingMessageId);
      if (currentMessage && currentMessage.fullText) {
        if (currentMessage.text.length < currentMessage.fullText.length) {
          const timer = setTimeout(() => {
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === typingMessageId 
                  ? { 
                      ...msg, 
                      text: msg.fullText.substring(0, msg.text.length + 1) 
                    }
                  : msg
              )
            );
          }, typeSpeed);
          
          return () => clearTimeout(timer);
        } else {
          setIsTyping(false);
          setTypingMessageId(null);
          // Scroll to bottom when typing completes
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 0);
        }
      }
    }
  }, [isTyping, typingMessageId, messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
  
    const userMessage = { text: inputValue, sender: 'user', id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await axios.get(`http://localhost:8000/api/v1/episodes/ai-assistant/${episodeId}`, {
        params: { question: inputValue }
      });
      
      const aiMessageId = Date.now();
      const aiMessage = { 
        text: '', 
        fullText: response.data, 
        sender: 'ai', 
        id: aiMessageId 
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Start typing animation
      setIsTyping(true);
      setTypingMessageId(aiMessageId);
    } catch (err) {
      console.error('Error calling AI assistant:', err);
      setError('Failed to get response from AI assistant. Please try again.');
      setMessages(prev => [...prev, { 
        text: 'Sorry, I encountered an error. Please try again.', 
        sender: 'ai',
        id: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-header">
        <h3>Podcast AI Assistant</h3>
        <p>Ask anything about this episode</p>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>How can I help you with this podcast episode?</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender} ${message.sender === 'ai' && message.id === typingMessageId ? 'typing' : ''}`}
            >
              {message.text}
              {message.sender === 'ai' && message.id === typingMessageId && (
                <span className="cursor"></span>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="message ai loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about this podcast..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || isTyping}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default PodcastAIAssistant;

// CSS Styles
const styles = `
.ai-assistant-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  display: flex;
  flex-direction: column;
  height: 500px;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background-color: #ffffff;
}

.ai-assistant-header {
  padding: 16px 20px;
  background-color: #6e56cf;
  color: white;
}

.ai-assistant-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.ai-assistant-header p {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 14px;
  text-align: center;
}

.message {
  max-width: 80%;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 18px;
  line-height: 1.4;
  font-size: 14px;
  word-wrap: break-word;
}

.message.user {
  margin-left: auto;
  background-color: #6e56cf;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.ai {
  margin-right: auto;
  background-color: #e9e9e9;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message.ai.typing {
  position: relative;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 14px;
  background-color: #333;
  margin-left: 2px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.message.loading {
  background-color: #e9e9e9;
  padding: 12px 16px;
}

.typing-indicator {
  display: flex;
  padding: 8px 0;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  opacity: 0.4;
}

.typing-indicator span:nth-child(1) {
  animation: typing 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation: typing 1s infinite 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation: typing 1s infinite 0.4s;
}

@keyframes typing {
  0% {
    opacity: 0.4;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-4px);
  }
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }
}

.error-message {
  padding: 8px 16px;
  background-color: #ffebee;
  color: #d32f2f;
  font-size: 13px;
  text-align: center;
}

.chat-input-form {
  display: flex;
  padding: 12px;
  border-top: 1px solid #eee;
  background-color: white;
}

.chat-input-form input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
  font-size: 14px;
}

.chat-input-form input:focus {
  border-color: #6e56cf;
}

.chat-input-form button {
  margin-left: 8px;
  padding: 10px 16px;
  background-color: #6e56cf;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-input-form button:hover {
  background-color: #5d46b8;
}

.chat-input-form button:disabled {
  background-color: #b3a1e6;
  cursor: not-allowed;
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);