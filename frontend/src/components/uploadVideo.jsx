// src/UploadVideo.js
import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Modal, Alert, Spinner } from 'react-bootstrap';
import genres from '../data/genreData';
import axios from 'axios';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShowName, setNewShowName] = useState('');
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

      const response = await api.post('/api/v1/episodes/recording/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Video uploaded successfully:', response.data);
      
      // Reset form
      setVideoTitle('');
      setVideoDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      setGenre('');
      
      // Show success message
      setSuccess('Video uploaded successfully!');
    } catch (err) {
      console.error('Error uploading video:', err);
      // Handle different types of errors
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.status === 413) {
        setError('The file is too large. Please upload a smaller file.');
      } else if (err.response?.data?.errors) {
        // Handle validation errors
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
    <div>
      <h3>Upload Video</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {!user ? (
        <Alert variant="warning">Please login to upload videos</Alert>
      ) : (
        <Form onSubmit={handleVideoUpload}>
          <Form.Group controlId="formShow">
            <Form.Label>Select Show</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                as="select"
                value={selectedShowId}
                onChange={(e) => setSelectedShowId(e.target.value)}
                required
                disabled={isLoadingShows}
              >
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name}
                  </option>
                ))}
              </Form.Control>
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

          <Form.Group controlId="formVideoTitle">
            <Form.Label>Video Title</Form.Label>
            <Form.Control
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title"
              required
            />
          </Form.Group>
          <Form.Group controlId="formVideoDescription">
            <Form.Label>Video Description</Form.Label>
            <Form.Control
              as="textarea"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Enter video description"
              rows={3}
            />
          </Form.Group>
          <Form.Group controlId="formVideoFile">
            <Form.Label>Video File</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setVideoFile(e.target.files[0])}
              required
            />
          </Form.Group>
          <Form.Group controlId="formThumbnail">
            <Form.Label>Thumbnail</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setThumbnailFile(e.target.files[0])}
              accept="image/*"
            />
          </Form.Group>
          <Form.Group controlId="formGenre">
            <Form.Label>Genre</Form.Label>
            <Form.Control
              as="select"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
            >
              <option value="">Select a genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Button 
            variant="primary" 
            type="submit" 
            className="mt-3"
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
              'Upload Video'
            )}
          </Button>
        </Form>
      )}
    </div>
  );
};

export default UploadVideo;