import React, { useState, useEffect, useContext } from "react";
import { Button, Form } from "react-bootstrap";
import { AuthContext } from "../contexts/authContext";
import api from "../services/api"; // Use the custom api instance
import genres from "../data/genreData";

const LiveStream = () => {
  const [streamName, setStreamName] = useState("");
  const [genre, setGenre] = useState("");
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState("");
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState(null);
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
      // Use api instance instead of axios directly
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

      setStreamName("");
      setGenre("");
      setThumbnailFile(null);
      setError(null);
    } catch (err) {
      console.error("Error starting live stream:", err);
      setError("Failed to start live stream. Please try again.");
    }
  };

  return (
    <div>
      <h3>Live Stream</h3>
      {error && <p className="text-danger">{error}</p>}
      <Form onSubmit={handleStartLiveStream}>
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
              <Button variant="outline-primary" disabled={isLoadingShows}>
                Create New Show
              </Button>
            </a>
          </div>
        </Form.Group>
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
        <Button type="submit" className="mt-3">
          Start Live
        </Button>
      </Form>
    </div>
  );
};

export default LiveStream;