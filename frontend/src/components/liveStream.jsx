import React, { useState, useEffect, useContext } from "react";
import { Button, Form, Card, Alert, Spinner, Row, Col } from "react-bootstrap";
import { AuthContext } from "../contexts/authContext";
import api from "../services/api";
import genres from "../data/genreData";

const LiveStream = () => {
  const [streamName, setStreamName] = useState("");
  const [genre, setGenre] = useState("");
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const { user } = useContext(AuthContext);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.id) {
      fetchShows();
    }
  }, [user]);

  const fetchShows = async () => {
    try {
      const response = await api.get(
        `/api/v1/shows/my-shows?creator_id=${user.id}`
      );
      setShows(response.data);
      if (response.data.length > 0) {
        setSelectedShowId(response.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching shows:", err);
      setError("Failed to load shows");
    } finally {
      setIsLoadingShows(false);
    }
  };

  const handleStartLiveStream = async (e) => {
    e.preventDefault();
    setIsStarting(true);
    
    const formData = new FormData();
    formData.append("name", streamName);
    formData.append("show_id", selectedShowId);
    formData.append("categories", genre);
    formData.append("creator_id", user.id);
    formData.append("is_active", true);
    if (thumbnailFile) {
      formData.append("thumbnail", thumbnailFile);
    }

    try {
      const response = await api.post(
        "/api/v1/episodes/live/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const episodeId = response.data.id;
      window.location.href = `http://localhost:5173/podcast/${episodeId}`;
    } catch (err) {
      console.error("Error starting live stream:", err);
      setError("Failed to start live stream. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-4">
          <h3 className="fw-bold text-dark">Start a Live</h3>
        </Card.Title>
        
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        
        <Form onSubmit={handleStartLiveStream}>
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
                <Button variant="outline-primary" disabled={isLoadingShows}>
                  Create New Show
                </Button>
              </a>
            </div>
          </Form.Group>

          <Form.Group controlId="formStreamName" className="mb-3">
            <Form.Label className="fw-semibold">Title</Form.Label>
            <Form.Control
              type="text"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="Enter your stream title"
              required
              className="shadow-sm"
            />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formGenre">
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

          <div className="d-grid mt-4">
            <Button 
              variant="primary" 
              type="submit" 
              size="lg"
              disabled={isStarting || isLoadingShows}
            >
              {isStarting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Starting...
                </>
              ) : (
                'Go Live Now'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default LiveStream;