import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
// import "tailwindcss/tailwind.css"; // Ensure Tailwind CSS is imported
import { Podcast } from "lucide-react";
import PodcastCardHorizontal from "@/components/PodcastCardHorizontal";

const ListEpisodePage = () => {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [latestEpisode, setLatestEpisode] = useState(null); // State for the latest episode
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

        // Sort episodes by created_at in ascending order (oldest first)
        const sortedEpisodes = [...formattedEpisodes].sort(
          (a, b) => new Date(a.timeAgo) - new Date(b.timeAgo) // Oldest first
        );
        setEpisodes(sortedEpisodes);

        // Set the latest episode (last one after sorting, since it's oldest-first)
        if (sortedEpisodes.length > 0) {
          setLatestEpisode(sortedEpisodes[sortedEpisodes.length - 1]); // Latest episode is the last one
        }
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
    <Container fluid className="p-0">
      <Row className="m-0">
        {/* Left Sidebar for Show Information and Latest Episode */}
        <Col md={3} className="bg-[rgba(0,0,0,0.05)] p-4 h-screen sticky top-0">
        {show && (
            <div>
              <h2 className="text-3xl font-bold mb-2">{show.name}</h2>
              <p className="text-sm text-gray-600 mb-2">
                {episodes.length} episodes
              </p>
              {/* Latest Episode Section with Blurred Background and Clear Overlay */}
              {latestEpisode && (
                <div className="mt-6">
                  <div className="relative w-full h-40 mb-4 overflow-hidden rounded-md bg-gray-200">
                    {/* Blurred Background Image */}
                    <div
                      className="absolute inset-0 w-full h-full bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${latestEpisode.imageUrl})`,
                        filter: "blur(10px)",
                      }}
                    />
                    {/* Clear Image Overlay in the Center */}
                    <img
                      src={latestEpisode.imageUrl}
                      alt={latestEpisode.title}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 object-cover rounded-md"
                    />
                    {/* Live Indicator */}
                    {latestEpisode.type === "live" && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </div>
                    )}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600 my-4">
                Last updated on{" "}
                {latestEpisode
                  ? new Date(latestEpisode.timeAgo).toLocaleDateString()
                  : new Date(show.updated_at || show.created_at).toLocaleDateString()}
              </p>
              <div className="flex items-center mb-4">
                <img
                  src={`http://localhost:8000/api/v1/users/profile-picture/${show.creator.profile_picture}`}
                  alt={show.creator.username}
                  className="w-10 h-10 rounded-full mr-2"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <span className="font-semibold">{show.creator.username}</span>
              </div>
              <p className="text-gray-700">{show.description}</p>
            </div>
          )}
        </Col>

        {/* Right Section for Episodes */}
        <Col md={9} className="p-4">
          <h2 className="text-2xl font-bold mb-4">Episodes</h2>
          <div>
            {episodes.length > 0 ? (
              episodes.map((episode, index) => (
                <div key={episode.id} className="py-2 flex items-center">
                  <span className="text-gray-500 mr-4">{index + 1}</span>
                  <PodcastCardHorizontal
                    podcast={episode}
                    user={episode.creator}
                    link={episode.type === "live" ? "podcast/" : "recording/"}
                  />
                </div>
              ))
            ) : (
              <Alert variant="info" className="text-center">
                No episodes found for this show.
              </Alert>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ListEpisodePage;