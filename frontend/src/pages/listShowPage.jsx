import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  FormControl,
  InputGroup,
} from "react-bootstrap";
import { IoIosSearch } from "react-icons/io";
import "../css/HomePage.css";

const ListShowPage = () => {
  const [shows, setShows] = useState([]);
  const [filteredShows, setFilteredShows] = useState([]);
  const [episodesPic, setEpisodesPic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/shows");
        if (!response.ok) {
          throw new Error("Failed to fetch shows");
        }
        const data = await response.json();
        setShows(data);
        setFilteredShows(data); // Initialize filtered shows with all shows
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, []);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/episodes");
        if (!response.ok) {
          throw new Error("Failed to fetch episodes");
        }
        const data = await response.json();
        setEpisodesPic(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, []);

  // Filter shows based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredShows(shows);
    } else {
      const filtered = shows.filter((show) =>
        show.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShows(filtered);
    }
  }, [searchQuery, shows]);

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
      {/* Search Bar */}
      <div className="d-flex justify-content-center my-4">
        <InputGroup style={{ width: "60%", position: "relative" }}>
          <FormControl
            placeholder="Search shows..."
            aria-label="Search shows"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "2.5rem",
              borderRadius: "20px",
              height: "40px",
            }}
          />
          <IoIosSearch
            style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6c757d",
              zIndex: 10,
            }}
          />
        </InputGroup>
      </div>

      <h2 className="my-4">Shows</h2>
      {filteredShows.length === 0 ? (
        <div className="text-center">
          No shows found matching your search.
        </div>
      ) : (
        <Row>
          {filteredShows.map((show) => (
            <Col
              key={show.id}
              md={4}
              className="mb-4"
              style={{ padding: "10px" }}
            >
              <a 
                href={`/list-shows/${show.id}`} 
                className="card-link d-flex flex-row p-3 shadow-sm bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)]"
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: '0.25rem',
                  height: '100%',
                  width: '100%',
                }}
              >
                <div className="flex-grow-1 w-2/3">
                  <h5 style={{ color: "black" }}>{show.name}</h5>
                  <p>
                    {show.description.length > 100
                      ? `${show.description.substring(0, 100)}...`
                      : show.description}
                  </p>
                  <p>{show.creator.username}</p>
                </div>
                <div className="w-[150px] h-[150px] overflow-hidden ml-3">
                  <img
                    src={
                      show.episodes && show.episodes.length > 0
                        ? `http://127.0.0.1:8000/api/v1/episodes/thumbnail/${
                            show.episodes[show.episodes.length - 1].thumbnail
                          }`
                        : ""
                    }
                    alt={show.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </a>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ListShowPage;