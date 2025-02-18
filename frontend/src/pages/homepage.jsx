import React, { useRef } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import PodcastCard from "../components/PodcastCard";
import "../css/HomePage.css";

const HomePage = () => {
  const scrollContainerRef = useRef(null);
  const podcasts = [
    {
      title: "Daily Talk Ep.123",
      genre: "Technology",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "2 hrs ago",
    },
    {
      title: "Business Weekly Ep.45",
      genre: "Business",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 day ago",
    },
    {
      title: "Health Matters Ep.12",
      genre: "Health",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 week ago",
    },
    {
      title: "Daily Talk Ep.123",
      genre: "Technology",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "2 hrs ago",
    },
    {
      title: "Business Weekly Ep.45",
      genre: "Business",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 day ago",
    },
    {
      title: "Health Matters Ep.12",
      genre: "Health",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 week ago",
    },
  ];

  const user = {
    name: "John Doe",
    imageUrl:
      "https://static1.srcdn.com/wordpress/wp-content/uploads/2024/04/img_0313.jpeg", // replace with actual image
    };

  const handleScroll = (scrollOffset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += scrollOffset;
    }
  };

  return (
    <div>
      <Container>
        <h2 className="my-4">Categories</h2>
        <Row>
          <Col xs={12} sm={6} md={4}>
            <h3>Technology</h3>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <h3>Business</h3>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <h3>Health</h3>
          </Col>
        </Row>

        <h2 className="my-4 text-left">Now Live</h2>
        <div className="position-relative">
          <Row
            ref={scrollContainerRef}
            className="my-4 card-row flex-nowrap scroll-hide"
          >
            {podcasts.map((podcast, index) => (
              <Col
                key={index}
                className="flex-shrink-0"
                style={{ minWidth: "300px" }}
              >
                <PodcastCard podcast={podcast} user={user} />
              </Col>
            ))}
          </Row>

          <Button
            variant="dark"
            className="scroll-button left"
            onClick={() => handleScroll(-400)}
          >
            <IoIosArrowBack style={{background: 'transparent'}}/>
          </Button>
          <Button
            variant="dark"
            className="scroll-button right"
            onClick={() => handleScroll(400)}
          >
            <IoIosArrowForward style={{background: 'transparent'}}/>
          </Button>
        </div>

        <h2 className="my-4 text-left">Trending</h2>
      </Container>
    </div>
  );
};

export default HomePage;
