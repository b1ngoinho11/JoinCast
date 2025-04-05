// src/Dashboard.js
import LiveStream from '@/components/liveStream';
import UploadVideo from '@/components/uploadVideo';
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

const DashboardPage = () => {
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState('');

  const handleVideoUpload = (e) => {
    e.preventDefault();
    // Handle video upload logic here
    console.log('Video Title:', videoTitle);
    console.log('Video Description:', videoDescription);
    console.log('Video File:', videoFile);
    console.log('Thumbnail:', thumbnail);
    // Reset form
    setVideoTitle('');
    setVideoDescription('');
    setVideoFile(null);
    setThumbnail('');
  };

  const handleStartLiveStream = () => {
    // Handle live stream logic here
    console.log('Live stream started!');
  };

  return (
    <Container fluid>
      <Row className="p-3">
        <Col md={6}>
        <UploadVideo />
        </Col>
        <Col md={6}>
        <LiveStream />
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;