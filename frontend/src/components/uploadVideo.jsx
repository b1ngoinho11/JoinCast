import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Alert, Spinner, Card, Row, Col } from 'react-bootstrap';
import genres from '../data/genreData';
import { AuthContext } from '../contexts/authContext';
import api from '../services/api';

const UploadVideo = () => {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [genre, setGenre] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.id) {
      fetchShows();
    }
  }, [user]);

  const fetchShows = async () => {
    try {
      const response = await api.get(`/api/v1/shows/my-shows?creator_id=${user.id}`);
      setShows(response.data);
      if (response.data.length > 0) {
        setSelectedShowId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching shows:', err);
      setError('Failed to load shows');
    } finally {
      setIsLoadingShows(false);
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      setError('You must be logged in to upload videos');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', videoTitle);
      formData.append('show_id', selectedShowId);
      formData.append('categories', genre);
      formData.append('comments', videoDescription);
      formData.append('creator_id', user.id);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      formData.append('video', videoFile);

      await api.post('/api/v1/episodes/recording/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Reset form
      setVideoTitle('');
      setVideoDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setGenre('');
      
      setSuccess('Video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.status === 413) {
        setError('The file is too large. Please upload a smaller file.');
      } else if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError('Failed to upload video. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-4">
          <h3 className="fw-bold text-dark">Upload a Video</h3>
        </Card.Title>
        
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}
        
        {!user ? (
          <Alert variant="warning">Please login to upload videos</Alert>
        ) : (
          <Form onSubmit={handleVideoUpload}>
            <Form.Group controlId="formShow" className="mb-3">
              <Form.Label className="fw-semibold">Select Show</Form.Label>
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedShowId}
                  onChange={(e) => setSelectedShowId(e.target.value)}
                  required
                  disabled={isLoadingShows}
                  className="shadow-sm"
                >
                  {shows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.name}
                    </option>
                  ))}
                </Form.Select>
                <a href="/shows">
                  <Button 
                    variant="outline-primary" 
                    disabled={isLoadingShows}
                  >
                    Create New Show
                  </Button>
                </a>
              </div>
            </Form.Group>

            <Form.Group controlId="formVideoTitle" className="mb-3">
              <Form.Label className="fw-semibold">Episode Title</Form.Label>
              <Form.Control
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter your title"
                required
                className="shadow-sm"
              />
            </Form.Group>

            <Form.Group controlId="formVideoDescription" className="mb-3">
              <Form.Label className="fw-semibold">Description</Form.Label>
              <Form.Control
                as="textarea"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="Tell the audience about this episode"
                rows={3}
                className="shadow-sm"
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="formVideoFile">
                  <Form.Label className="fw-semibold">Upload File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    required
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formThumbnail">
                  <Form.Label className="fw-semibold">Thumbnail</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                    accept="image/*"
                    className="shadow-sm"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="formGenre" className="mb-4">
              <Form.Label className="fw-semibold">Genre</Form.Label>
              <Form.Select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
                className="shadow-sm"
              >
                <option value="">Select a genre</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-grid">
              <Button 
                variant="primary" 
                type="submit" 
                size="lg"
                disabled={isUploading || isLoadingShows}
              >
                {isUploading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
};

export default UploadVideo;