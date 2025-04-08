import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Spinner, Alert, Card } from "react-bootstrap";
import "../css/HomePage.css"; // Ensure the CSS file is correctly imported
import { Podcast } from "lucide-react";
import PodcastCard from "@/components/PodcastCard";

const ListEpisodePage = () => {
    const { id } = useParams(); // Get the show ID from the URL parameters
    const [episodes, setEpisodes] = useState([]); // State to hold the list of shows
    const [loading, setLoading] = useState(true); // State to manage loading state
    const [error, setError] = useState(null); // State to manage error messages

    // Fetch shows from the API
    useEffect(() => {
        const fetchShows = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/v1/shows/${id}/episodes`); // Adjust the API endpoint as needed
                if (!response.ok) {
                    throw new Error("Failed to fetch shows");
                }
                const data = await response.json();

                const episodes = data.map((episode) => ({
                    id: episode.id,
                    title: episode.name,
                    genre: episode.categories,
                    imageUrl: `http://localhost:8000/api/v1/episodes/thumbnail/${episode.thumbnail}`,
                    timeAgo: new Date(episode.created_at).toLocaleString(),
                    creator: {
                        id: episode.creator.id,
                        name: episode.creator.username,
                        imageUrl: `http://localhost:8000/api/v1/users/profile-picture/${episode.creator.profile_picture}`,
                    },
                    type: episode.type,
                }));
                
                setEpisodes(episodes); // Set the fetched shows to state
            } catch (err) {
                setError(err.message); // Set error message if fetching fails
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        fetchShows(); // Call the fetch function
    }, []);
    // Render loading spinner
    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" role="status" />
            </div>
        );
    }
    // Render error message
    if (error) {
        return (
            <Alert variant="danger" className="text-center">
                {error}
            </Alert>
        );
    }

    // Render the list of shows
    return (
        <Container style={{ maxWidth: "90%", padding: "0" }}>
            <h2 className="my-4">Episodes</h2>
            <Row className="justify-content-center">
                {episodes.map((episode) => (
                    <Col
                    key={episode.id}
                    className="flex-shrink-0"
                    style={{ minWidth: "240px" }}
                  >
                    <PodcastCard
                      podcast={episode}
                      user={episode.creator}
                      link={episode.type === "live" ? "podcast/" : "recording/"}
                    />
                  </Col>
                ))}
            </Row>
        </Container>
    );
}
export default ListEpisodePage;