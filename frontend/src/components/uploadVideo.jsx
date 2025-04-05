// src/UploadVideo.js
import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import genres from '../data/genreData';

const UploadVideo = () => {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [genre, setGenre] = useState('');

  const handleVideoUpload = (e) => {
    e.preventDefault();
    // Handle video upload logic here
    console.log('Video Title:', videoTitle);
    console.log('Video Description:', videoDescription);
    console.log('Video File:', videoFile);
    console.log('Thumbnail File:', thumbnailFile);
    console.log('Selected genre:', genre);
    // Reset form
    setVideoTitle('');
    setVideoDescription('');
    setVideoFile(null);
    setThumbnail(null);
    setGenre('');
  };

  return (
    <div>
      <h3>Upload Video</h3>
      <Form onSubmit={handleVideoUpload}>
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
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            placeholder="Enter video description"
            required
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
            onChange={(e) => setThumbnailFile(e.target.value)}
            placeholder="Enter thumbnail URL"
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
        <Button variant="primary" type="submit" className="mt-3">
          Upload Video
        </Button>
      </Form>
    </div>
  );
};

export default UploadVideo;