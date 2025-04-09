import React, { useState, useEffect } from "react";
import { Button, Card, Spinner, Alert, Form, ProgressBar, Badge } from "react-bootstrap";
import { Trophy, Zap, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import axios from "axios";

const QuizComponent = ({ episodeId }) => {
  const API_URL = "http://localhost:8000/api/v1";
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Strict parser that expects exact format
  const parseQuizText = (text) => {
    if (!text) return null;
    
    const questions = [];
    const lines = text.split('\n').filter(line => line.trim());
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // New question detected
      if (/^\d+\./.test(line)) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          id: questions.length + 1,
          question: line.replace(/^\d+\.\s*/, ''),
          options: [],
          answer: '',
          type: questions.length < 5 ? 'mcq' : 'short' // First 5 are MCQs
        };
      }
      // MCQ option detected
      else if (currentQuestion?.type === 'mcq' && /^- [A-D]\)/.test(line)) {
        const option = {
          letter: line.match(/[A-D]/)[0],
          text: line.replace(/^- [A-D]\)\s*/, '').replace(/\*$/, '').trim(),
          correct: line.includes('*')
        };
        currentQuestion.options.push(option);
      }
      // Answer line detected
      else if (/^- Answer:/.test(line)) {
        currentQuestion.answer = line.replace(/^- Answer:\s*/, '').trim();
      }
    }

    if (currentQuestion) questions.push(currentQuestion);
    
    // Validate we got exactly 10 questions in correct format
    if (questions.length !== 10 || 
        questions.filter(q => q.type === 'mcq').length !== 5) {
      throw new Error('Invalid quiz format received from API');
    }
    
    return questions;
  };
  const fetchQuiz = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/episodes/quiz/${episodeId}`);
      const parsedQuiz = parseQuizText(response.data);
      setQuizData(parsedQuiz);
    } catch (err) {
      setError("Failed to fetch quiz. Please try again.");
      console.error("Error fetching quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quizData) return;

    let correctCount = 0;
    quizData.forEach(question => {
      const userAnswer = userAnswers[question.id]?.toString().toLowerCase().trim();
      const correctAnswer = question.answer.toLowerCase().trim();
      
      if (userAnswer && userAnswer === correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status" className="me-2" />
        <span>Generating your quiz...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        {error}
      </Alert>
    );
  }

  if (!quizData) {
    return (
      <Card className="my-4 quiz-card">
        <Card.Body className="text-center">
          <div className="quiz-header-icon mb-3">
            <Trophy size={48} className="text-warning" />
            <Zap size={24} className="text-primary lightning-icon" />
          </div>
          <h3>Test Your Knowledge</h3>
          <p className="text-muted">Challenge yourself with this 10-question quiz about the episode!</p>
          <Button 
            variant="primary" 
            onClick={fetchQuiz}
            className="px-4 py-2"
          >
            Generate Quiz
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="my-4 quiz-card">
      <Card.Header className="bg-light d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Trophy size={24} className="me-2 text-warning" />
          <strong className="text-dark">Episode Quiz</strong>
        </div>
        <button 
          onClick={toggleMinimize} 
          className="btn btn-sm btn-outline-secondary toggle-button"
          aria-label={isMinimized ? "Maximize quiz" : "Minimize quiz"}
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
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">
              <Trophy size={24} className="me-2 text-warning" />
              Episode Quiz
            </h3>
            {submitted && (
              <div className="score-display">
                <span className="score-text">{score}</span>
                <span className="score-divider">/</span>
                <span className="total-questions">{quizData.length}</span>
              </div>
            )}
          </div>

          {submitted && (
            <ProgressBar 
              now={(score / quizData.length) * 100} 
              variant={score >= quizData.length / 2 ? "success" : "danger"}
              className="mb-4"
              label={`${Math.round((score / quizData.length) * 100)}%`}
            />
          )}

          <Form onSubmit={handleSubmit}>
            {quizData.map((item) => (
              <div 
                key={item.id} 
                className={`mb-4 quiz-question ${submitted ? 'submitted' : ''}`}
              >
                <h5 className="mb-3">
                  <span className="question-number">{item.id}.</span> {item.question}
                </h5>

                {item.type === 'mcq' ? (
                  <div className="quiz-options">
                    {item.options.map((option) => (
                      <div 
                        key={option.letter}
                        className={`option-card ${
                          submitted ? 
                            (option.correct ? 'correct' : 
                             userAnswers[item.id] === option.text ? 'incorrect' : '') : 
                          (userAnswers[item.id] === option.text ? 'selected' : '')
                        }`}
                        onClick={() => !submitted && handleAnswerChange(item.id, option.text)}
                      >
                        <div className="option-letter">{option.letter}</div>
                        <div className="option-text">{option.text}</div>
                        {submitted && option.correct && (
                          <CheckCircle size={18} className="ms-2 text-success" />
                        )}
                        {submitted && userAnswers[item.id] === option.text && !option.correct && (
                          <XCircle size={18} className="ms-2 text-danger" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="short-answer-container">
                    <Form.Control
                      type="text"
                      placeholder="Your answer..."
                      value={userAnswers[item.id] || ""}
                      onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                      disabled={submitted}
                      className="short-answer-input"
                    />
                    {submitted && (
                      <div className="answer-feedback">
                        <strong>Correct answer:</strong> {item.answer}
                        {userAnswers[item.id]?.toLowerCase().trim() === item.answer.toLowerCase().trim() ? (
                          <span className="text-success ms-2">
                            <CheckCircle size={16} className="me-1" />
                            Correct!
                          </span>
                        ) : (
                          userAnswers[item.id] && (
                            <span className="text-danger ms-2">
                              <XCircle size={16} className="me-1" />
                              Incorrect
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="d-flex justify-content-between mt-4">
              {!submitted ? (
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={Object.keys(userAnswers).length < quizData.length}
                  className="px-4 py-2"
                >
                  Submit Answers
                </Button>
              ) : (
                <Button 
                  variant="outline-primary" 
                  onClick={resetQuiz}
                  className="px-4 py-2"
                >
                  Try Again
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      )}
    </Card>
  );
};

export default QuizComponent;