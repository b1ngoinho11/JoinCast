import { useState, useContext } from 'react';
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { AuthContext } from '../contexts/authContext';
import api from '../services/api';

const CreateShow = () => {
  const [showTitle, setShowTitle] = useState('');
  const [showDescription, setShowDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleShowCreation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to create a show');
      }

      await api.post('/api/v1/shows/', {
        name: showTitle,
        description: showDescription
      }, {
        params: {
          creator_id: user.id
        }
      });

      // Reset form on success
      setShowTitle('');
      setShowDescription('');
      
      // Show success message
      setSuccess('Show created successfully!');
    } catch (err) {
      console.error('Error creating show:', err);
      // Handle different types of errors
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError('Failed to create show. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-4">
          <h3 className="fw-bold text-dark">Create a New Show</h3>
        </Card.Title>
        
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}
        
        <Form onSubmit={handleShowCreation}>
          <Form.Group controlId="formShowTitle" className="mb-3">
            <Form.Label className="fw-semibold">Show Title</Form.Label>
            <Form.Control
              type="text"
              value={showTitle}
              onChange={(e) => setShowTitle(e.target.value)}
              placeholder="Enter your show title"
              required
              disabled={loading}
              className="shadow-sm"
            />
          </Form.Group>
          
          <Form.Group controlId="formShowDescription" className="mb-4">
            <Form.Label className="fw-semibold">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={showDescription}
              onChange={(e) => setShowDescription(e.target.value)}
              placeholder="Tell listeners about your show"
              required
              disabled={loading}
              className="shadow-sm"
            />
          </Form.Group>
          
          <div className="d-grid">
            <Button 
              variant="primary" 
              type="submit" 
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Creating...
                </>
              ) : (
                'Create Show'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreateShow;