import React, { useRef, useState, useEffect, use } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import PodcastCard from "../components/PodcastCard";
import "../css/HomePage.css";

const HomePage = () => {
  const nowLivePodcastScroll = useRef(null);
  const trendingPodcastScroll = useRef(null);
  const [leftLiveScroll, setLeftLiveScroll] = useState(false);
  const [leftTrendingScroll, setLeftTrendingScroll] = useState(false);
  const [rightLiveScroll, setRightLiveScroll] = useState(true);
  const [rightTrendingScroll, setRightTrendingScroll] = useState(true);
  const podcasts = [
    {
      id: 1,
      title: "Daily Talk Ep.123",
      genre: "Technology",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "2 hrs ago",
    },
    {
      id: 2,
      title: "Business Weekly Ep.45",
      genre: "Business",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 day ago",
    },
    {
      id: 3,
      title: "Health Matters Ep.12",
      genre: "Health",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 week ago",
    },
    {
      id: 4,
      title: "Daily Talk Ep.123",
      genre: "Technology",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "2 hrs ago",
    },
    {
      id: 5,
      title: "Business Weekly Ep.45",
      genre: "Business",
      imageUrl:
        "https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=cover,format=auto,quality=85,width=1920/keyart/GY9PJ5KWR-backdrop_wide", // replace with actual image
      timeAgo: "1 day ago",
    },
    {
      id: 6,
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

  const handleScroll = (scrollRef, scrollOffset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += scrollOffset;
    }
  };

  const updatVisibility = (scrollRef) => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
  
    if (scrollRef === nowLivePodcastScroll) {
      setLeftLiveScroll(scrollLeft > 0);
      setRightLiveScroll(scrollLeft < scrollWidth - clientWidth);
    }

    if (scrollRef === trendingPodcastScroll) {
      setLeftTrendingScroll(scrollLeft > 0);
      setRightTrendingScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
      updatVisibility(nowLivePodcastScroll);
      updatVisibility(trendingPodcastScroll);
    }, []);
   

  return (
    <div>
      <Container style={{ maxWidth: "90%", padding: "0", }}>
        <h2 className="my-4">Categories</h2>
        <div className="position-relative">
          <Row
            className="category-row justify-content-center flex-nowrap"
            style={{ gap: "0.5rem", overflow: "visible" }}
          >
            <Col xs="auto">
              <Button variant="dark" className="category-button">
                Technology
              </Button>
            </Col>
            <Col xs="auto">
              <Button variant="dark" className="category-button">
                Business
              </Button>
            </Col>
            <Col xs="auto">
              <Button variant="dark" className="category-button">
                Health
              </Button>
            </Col>
            <Col xs="auto">
              <Button variant="dark" className="category-button">
                Entertainment
              </Button>
            </Col>
            <Col xs="auto">
              <Button variant="dark" className="category-button">
                Education
              </Button>
            </Col>
          </Row>
        </div>

        <h2 className="my-4 text-left">Now Live</h2>
        <div className="position-relative">
          <Row
            ref={nowLivePodcastScroll}
            className="my-4 card-row flex-nowrap scroll-hide"
            onScroll={() => updatVisibility(nowLivePodcastScroll)}
          >
            {podcasts.map((podcast) => (
              <Col
                key={podcast.id} // Changed from index to podcast.id
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
            onClick={() => handleScroll(nowLivePodcastScroll, -400)}
          >
            <IoIosArrowBack
              style={{ background: "transparent", color: "black" }}
            />
          </Button>
          <Button
            variant="dark"
            className="scroll-button right"
            onClick={() => handleScroll(nowLivePodcastScroll, 400)}
          >
            <IoIosArrowForward
              style={{ background: "transparent", color: "black" }}
            />
          </Button>
        </div>

        <h2 className="my-4 text-left">Trending</h2>
        <div className="position-relative">
          <Row
            ref={trendingPodcastScroll}
            className="my-4 card-row flex-nowrap scroll-hide"
            onScroll={() => updatVisibility(trendingPodcastScroll)}
          >
            {podcasts.map((podcast) => (
              <Col
                key={podcast.id} // Changed from index to podcast.id
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
            onClick={() => handleScroll(trendingPodcastScroll, -400)}
          >
            <IoIosArrowBack
              style={{ background: "transparent", color: "black" }}
            />
          </Button>
          <Button
            variant="dark"
            className="scroll-button right"
            onClick={() => handleScroll(trendingPodcastScroll, 400)}
          >
            <IoIosArrowForward
              style={{ background: "transparent", color: "black" }}
            />
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default HomePage;
