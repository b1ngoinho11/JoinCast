// src/LiveStream.js
import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import genres from '../data/genreData';

const LiveStream = () => {
  const [streamName, setStreamName] = useState('');
  const [genre, setGenre] = useState('');

  const handleStartLiveStream = (e) => {
    e.preventDefault();
    // Handle live stream logic here
    console.log('Live stream started with name:', streamName);
    console.log('Selected genre:', genre);
    // Reset form
    setStreamName('');
    setGenre('');
  };

  return (
    <div>
      <h3>Live Stream</h3>
      <Form onSubmit={handleStartLiveStream}>
        <Form.Group controlId="formStreamName">
          <Form.Label>Stream Name</Form.Label>
          <Form.Control
            type="text"
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            placeholder="Enter stream name"
            required
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
        <Button variant="sudarkccess" type="submit" className="mt-3">
          Start Live Stream
        </Button>
      </Form>
      <p className="mt-2">Click the button above to start streaming live!</p>
    </div>
  );
};

export default LiveStream;