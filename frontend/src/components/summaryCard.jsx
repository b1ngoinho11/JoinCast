import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import '../css/summaryCard.css';

const SummaryCard = ({ summary, onTimestampClick }) => {
  if (!summary) return null;

  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [timestampNavigation, setTimestampNavigation] = useState([]);
  const typeSpeed = 10;
  const contentRef = useRef(summary);

  // Parse timestamp navigation and extract main content
  useEffect(() => {
    if (summary) {
      // Extract timestamp navigation if present
      const timestampRegex = /\[TIMESTAMP_NAVIGATION\](.*?)\[\/TIMESTAMP_NAVIGATION\]/s;
      const match = summary.match(timestampRegex);
      
      if (match && match[1]) {
        const navContent = match[1].trim();
        const navItems = navContent.split('\n').filter(line => line.trim().startsWith('- ['));
        
        const parsedNav = navItems.map(item => {
          const timeMatch = item.match(/\[(\d{2}:\d{2}:\d{2})\]/);
          const description = item.replace(/^-\s*\[\d{2}:\d{2}:\d{2}\]\s*/, '').trim();
          
          return {
            time: timeMatch ? timeMatch[1] : '',
            description: description
          };
        }).filter(item => item.time);
        
        setTimestampNavigation(parsedNav);
        
        // Remove the navigation section from the main content
        contentRef.current = summary.replace(timestampRegex, '').trim();
      } else {
        contentRef.current = summary;
      }

      // Start typing animation
      setIsTyping(true);
      setDisplayedContent('');
      
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < contentRef.current.length) {
          setDisplayedContent(prev => prev + contentRef.current.charAt(i));
          i++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, typeSpeed);

      return () => clearInterval(typeInterval);
    }
  }, [summary]);

  // Helper function to convert timestamp to seconds
  const timestampToSeconds = (timestamp) => {
    const parts = timestamp.split(':').map(part => parseInt(part));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Handle timestamp click
  const handleTimestampClick = (timestamp) => {
    if (onTimestampClick) {
      onTimestampClick(timestampToSeconds(timestamp));
    }
  };

  // Helper function to render formatted content
  const renderFormattedContent = () => {
    // Split by double newlines to handle paragraphs
    const paragraphs = displayedContent.split('\n\n').filter(p => p.trim() !== '');

    return paragraphs.map((paragraph, pIndex) => {
      // Check for main title
      if (paragraph.startsWith('# ')) {
        return (
          <h4 key={pIndex} className="mb-3 fw-bold">
            {paragraph.replace('# ', '')}
          </h4>
        );
      }

      // Check for bolded section headers
      if (paragraph.startsWith('**') && paragraph.includes('** –')) {
        const [header, ...contentParts] = paragraph.split(' – ');
        const content = contentParts.join(' – ');
        
        return (
          <div key={pIndex} className="mb-3">
            <h5 className="fw-bold mb-2">
              {header.replace(/\*\*/g, '')}
            </h5>
            {content.split('– ').map((point, pointIndex) => (
              point.trim() && (
                <p key={pointIndex} className="mb-2">
                  {renderBoldText(`• ${point.trim()}`)}
                </p>
              )
            ))}
          </div>
        );
      }

      // Check for bolded key details section
      if (paragraph.startsWith('**Key Details**')) {
        const content = paragraph.replace('**Key Details**', '').trim();
        
        return (
          <div key={pIndex} className="mt-4">
            <h5 className="fw-bold mb-2">Key Details</h5>
            {content.split('– ').map((point, pointIndex) => (
              point.trim() && (
                <p key={pointIndex} className="mb-2">
                  {renderBoldText(`• ${point.trim()}`)}
                </p>
              )
            ))}
          </div>
        );
      }

      // Default paragraph handling
      return (
        <p key={pIndex} className="mb-3">
          {renderBoldText(paragraph)}
        </p>
      );
    });
  };

  // Helper to render bold text (**word**)
  const renderBoldText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Card className="mt-3 shadow-sm summary-card">
      <Card.Header className="bg-light d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <i className="bi bi-robot me-2"></i>
          <strong className="text-dark">AI-Generated Summary</strong>
          {isTyping && <span className="ms-2 typing-indicator">typing...</span>}
        </div>
        <button 
          onClick={toggleMinimize} 
          className="btn btn-sm btn-outline-secondary toggle-button"
          aria-label={isMinimized ? "Maximize summary" : "Minimize summary"}
        >
          {isMinimized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-lg" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-dash-lg" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"/>
            </svg>
          )}
        </button>
      </Card.Header>
      {!isMinimized && (
        <Card.Body className="summary-body">
          {/* Timestamp Navigation Section */}
          {timestampNavigation.length > 0 && (
            <div className="timestamp-navigation mb-4">
              <h5 className="fw-bold mb-3">Jump to Section</h5>
              <div className="list-group">
                {timestampNavigation.map((item, index) => (
                  <button
                    key={index}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => handleTimestampClick(item.time)}
                  >
                    <span>{item.description}</span>
                    <span className="badge bg-primary rounded-pill">{item.time}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Main Summary Content */}
          <div className={`summary-content ${isTyping ? 'typing' : ''}`}>
            {renderFormattedContent()}
            {isTyping && <span className="cursor"></span>}
          </div>
        </Card.Body>
      )}
    </Card>
  );
};

export default SummaryCard;
