import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Card,
} from "react-bootstrap";
import "../css/HomePage.css";
import { Podcast } from "lucide-react";
import PodcastCardHorizontal from "@/components/PodcastCardHorizontal";

const ListEpisodePage = () => {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // First fetch show details
        const showResponse = await fetch(
          `http://127.0.0.1:8000/api/v1/shows/${id}`
        );
        if (!showResponse.ok) {
          throw new Error("Failed to fetch show details");
        }
        const showData = await showResponse.json();
        setShow(showData);

        // Then fetch episodes
        const episodesResponse = await fetch(
          `http://127.0.0.1:8000/api/v1/shows/${id}/episodes`
        );
        if (!episodesResponse.ok) {
          throw new Error("Failed to fetch episodes");
        }
        const episodesData = await episodesResponse.json();

        const formattedEpisodes = episodesData.map((episode) => ({
          id: episode.id,
          title: episode.name,
          genre: episode.categories,
          imageUrl: `http://localhost:8000/api/v1/episodes/thumbnail/${episode.thumbnail}`,
          timeAgo: episode.created_at,
          creator: {
            id: episode.creator.id,
            name: episode.creator.username,
            imageUrl: `http://localhost:8000/api/v1/users/profile-picture/${episode.creator.profile_picture}`,
          },
          type: episode.type,
        }));

        setEpisodes(formattedEpisodes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="text-center">
        {error}
      </Alert>
    );
  }

  return (
    <Container style={{ maxWidth: "90%", padding: "0" }}>
      {/* Show Information Section */}
      {show && (
        <Card className="m-4">
          <Card.Body>
            <Row>
              <Col md={9}>
                <h1>{show.name}</h1>
                <h5 className="text-muted">{episodes.length} episodes</h5>
                <p className="text-muted">{show.description}</p>
                <div className="d-flex align-items-center mt-3">
                  <img
                    src={`http://localhost:8000/api/v1/users/profile-picture/${show.creator.profile_picture}`}
                    alt={show.creator.username}
                    className="rounded-circle mr-2"
                    style={{ width: "40px", height: "40px" }}
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <span className="font-weight-bold">
                    {show.creator.username}
                  </span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Episodes List Section */}
      <h2 className="m-4">Episodes</h2>
      <div className="ml-5">
        {episodes.length > 0 ? (
          episodes.map((episode) => (
            <Row key={episode.id} className="py-2">
              <Col className="w-full">
                <PodcastCardHorizontal
                  podcast={episode}
                  user={episode.creator}
                  link={episode.type === "live" ? "podcast/" : "recording/"}
                />
              </Col>
            </Row>
          ))
        ) : (
          <Alert variant="info" className="text-center">
            No episodes found for this show.
          </Alert>
        )}
      </div>
    </Container>
  );
};

export default ListEpisodePage;
