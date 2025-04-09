import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Chat component for podcast interaction
const PodcastChatBox = ({ episodeId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [episodeData, setEpisodeData] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch episode data on component mount
  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const response = await axios.get(`/api/v1/episodes/${episodeId}`);
        setEpisodeData(response.data);
      } catch (error) {
        console.error('Error fetching episode data:', error);
      }
    };

    fetchEpisodeData();
  }, [episodeId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending user message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Process different commands
      if (input.toLowerCase().includes('summary') || input.toLowerCase().includes('summarize')) {
        const summaryResponse = await getSummary(episodeId);
        setMessages(prev => [...prev, { role: 'assistant', content: summaryResponse }]);
      } else {
        // General question about the podcast
        const response = await askAboutPodcast(input, episodeData?.transcript);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Function to get episode summary
  const getSummary = async (episodeId) => {
    try {
      const response = await axios.get(`/api/v1/episodes/${episodeId}/summary`);
      return response.data.summary;
    } catch (error) {
      console.error('Error fetching summary:', error);
      
      // If API endpoint fails or doesn't exist yet, generate summary on the fly
      if (episodeData?.transcript) {
        return await generateSummaryWithDeepSeek(episodeData.transcript);
      }
      
      throw new Error('Could not generate summary');
    }
  };

  // Function to ask questions about the podcast using DeepSeek
  const askAboutPodcast = async (question, transcript) => {
    if (!transcript) {
      return "Sorry, I don't have a transcript for this episode yet.";
    }

    try {
      const response = await axios.post('/api/v1/chat/deepseek', {
        question,
        transcript
      });
      return response.data.response;
    } catch (error) {
      console.error('Error querying DeepSeek:', error);
      
      // Fallback to direct DeepSeek API call if backend endpoint fails
      return await queryDeepSeekDirectly(question, transcript);
    }
  };

  // Function to query DeepSeek API directly (fallback)
  const queryDeepSeekDirectly = async (question, transcript) => {
    // This would typically be handled by your backend
    // Here as a demo of what the backend would implement
    try {
      const API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            {
              role: 'user',
              content: `Based on this podcast transcript, please answer the following question: "${question}"\n\nTranscript:\n${transcript}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error with direct DeepSeek query:', error);
      return "Sorry, I couldn't process your question right now.";
    }
  };

  // Function to generate summary using DeepSeek
  const generateSummaryWithDeepSeek = async (transcript) => {
    try {
      const API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            {
              role: 'user',
              content: `This is the transcript of a video/podcast episode. Please summarize it with timestamp on main topic.\n\n${transcript}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating summary with DeepSeek:', error);
      return "Sorry, I couldn't generate a summary right now.";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md h-96 flex flex-col">
      <div className="bg-indigo-600 p-3 rounded-t-lg">
        <h2 className="text-white font-semibold">Podcast Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-10">
            Ask me anything about this podcast! Try "Can you summarize this podcast?" or "What is the main topic?"
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div 
                className={`inline-block p-2 rounded-lg max-w-xs ${
                  message.role === 'user' 
                    ? 'bg-indigo-500 text-white rounded-br-none' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="text-left mb-3">
            <div className="inline-block p-2 rounded-lg max-w-xs bg-gray-200 text-gray-800 rounded-bl-none">
              <div className="flex items-center">
                <div className="dot-typing"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-2 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this podcast..."
          className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default PodcastChatBox;

// CSS for loading animation
const LoadingStyles = () => (
  <style jsx global>{`
    .dot-typing {
      position: relative;
      left: -9999px;
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: #6366f1;
      color: #6366f1;
      box-shadow: 9984px 0 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      animation: dot-typing 1.5s infinite linear;
    }

    @keyframes dot-typing {
      0% {
        box-shadow: 9984px 0 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      }
      16.667% {
        box-shadow: 9984px -10px 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      }
      33.333% {
        box-shadow: 9984px 0 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      }
      50% {
        box-shadow: 9984px 0 0 0 #6366f1, 9999px -10px 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      }
      66.667% {
        box-shadow: 9984px 0 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      }
      83.333% {
        box-shadow: 9984px 0 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px -10px 0 0 #6366f1;
      }
      100% {
        box-shadow: 9984px 0 0 0 #6366f1, 9999px 0 0 0 #6366f1, 10014px 0 0 0 #6366f1;
      }
    }
  `}</style>
);
