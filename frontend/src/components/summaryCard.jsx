import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import '../css/summaryCard.css'; // Import your CSS file for styling'

const SummaryCard = ({ summary }) => {
  if (!summary) return null;

  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const typeSpeed = 10; // milliseconds per character
  const contentRef = useRef(summary);

  // Start typing animation when summary changes
  useEffect(() => {
    if (summary) {
      setIsTyping(true);
      setDisplayedContent('');
      contentRef.current = summary;

      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < summary.length) {
          setDisplayedContent(prev => prev + summary.charAt(i));
          i++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, typeSpeed);

      return () => clearInterval(typeInterval);
    }
  }, [summary]);

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