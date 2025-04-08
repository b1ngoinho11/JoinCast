import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert, Card } from "react-bootstrap";
import "../css/HomePage.css"; // Ensure the CSS file is correctly imported

const ListShowPage = () => {
    const [shows, setShows] = useState([]); // State to hold the list of shows
    const [episodesPic, setEpisodesPic] = useState([]); // State to hold the list of episodes
    const [loading, setLoading] = useState(true); // State to manage loading state
    const [error, setError] = useState(null); // State to manage error messages

    // Fetch shows from the API
    useEffect(() => {
        const fetchShows = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/v1/shows"); // Adjust the API endpoint as needed
                if (!response.ok) {
                    throw new Error("Failed to fetch shows");
                }
                const data = await response.json();
                
                setShows(data); // Set the fetched shows to state
            } catch (err) {
                setError(err.message); // Set error message if fetching fails
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        fetchShows(); // Call the fetch function
    }, []);

    // Fetch episodes from the API
    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/v1/episodes"); // Adjust the API endpoint as needed
                if (!response.ok) {
                    throw new Error("Failed to fetch episodes");
                }
                const data = await response.json();
                
                setEpisodesPic(data); // Set the fetched episodes to state
            } catch (err) {
                setError(err.message); // Set error message if fetching fails
            } finally {
                setLoading(false); // Set loading to false after fetching
            }
        };

        fetchEpisodes(); // Call the fetch function
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
            <h2 className="my-4">Categories</h2>
            <Row className="justify-content-center">
                {shows.map((show) => (
                    <Col key={show.id} md={4} className="mb-4" style={{ padding: "10px" }}>
                        <Card className="shadow-sm d-flex flex-row">
                            <Card.Body className="flex-grow-1">
                                <Card.Title style={{color:"black"}}>{show.name}</Card.Title>
                                <Card.Text>
                                    {show.description.length > 100
                                        ? `${show.description.substring(0, 100)}...`
                                        : show.description}
                                </Card.Text>
                                <Card.Text>
                                    {show.creator.username}
                                </Card.Text>
                                <Button variant="primary" href={`/list-shows/${show.id}`}>
                                    View Show
                                </Button>
                            </Card.Body>
                            <div style={{ width: "150px", height: "150px", overflow: "hidden" }}>
                                <img
                                    src={show?.episodes?.[0]?.thumbnail}
                                    alt={show.name}
                                    style={{ width: "100%", height: "auto", objectFit: "cover" }}
                                />
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default ListShowPage;