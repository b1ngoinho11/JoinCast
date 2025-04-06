import React, { useRef, useState, useEffect } from "react";
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
  const [categories, setCategories] = useState([]);
  const [watchNowPodcasts, setWatchNowPodcasts] = useState([]);
  const [nowLivePodcasts, setNowLivePodcasts] = useState([]);

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

    // Fetch categories from API
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/episodes/categories/names"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Set some default categories in case of error
        setCategories([
          "Technology",
          "Business",
          "Health",
          "Entertainment",
          "Education",
        ]);
      }
    };

    fetchCategories();

    // Fetch episodes from API
    const fetchEpisodes = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/episodes/?skip=0&limit=100"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch episodes");
        }
        const data = await response.json();

        // Categorize episodes
        const watchNow = [];
        const nowLive = [];
        data.forEach((episode) => {
          const podcast = {
            id: episode.id,
            title: episode.name,
            genre: episode.categories,
            imageUrl: `http://localhost:8000/api/v1/episodes/thumbnail/${episode.thumbnail}`, // Fetch real thumbnail
            timeAgo: new Date(episode.created_at).toLocaleString(), // Format the date
            creator: {
              id: episode.creator.id,
              name: episode.creator.username,
              imageUrl: `http://localhost:8000/api/v1/users/profile-picture/${episode.creator.profile_picture}`, // Fetch real creator image
            },
            type: episode.type,
          };
          if (episode.type === "recording") {
            watchNow.push(podcast);
          } else {
            nowLive.push(podcast);
          }
        });

        setWatchNowPodcasts(watchNow);
        setNowLivePodcasts(nowLive);
      } catch (error) {
        console.error("Error fetching episodes:", error);
      }
    };

    fetchEpisodes();
  }, []);

  return (
    <div>
      <Container style={{ maxWidth: "90%", padding: "0" }}>
        <h2 className="my-4">Categories</h2>
        <div className="position-relative">
          <Row
            className="category-row justify-content-center flex-nowrap"
            style={{ gap: "0.5rem", overflow: "visible" }}
          >
            {categories.map((category, index) => (
              <Col xs="auto" key={index}>
                <Button variant="dark" className="category-button">
                  {category}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        <h2 className="my-4 text-left">Watch now</h2>
        <div className="position-relative">
          <Row
            ref={trendingPodcastScroll}
            className="my-4 card-row flex-nowrap scroll-hide"
            onScroll={() => updatVisibility(trendingPodcastScroll)}
          >
            {watchNowPodcasts.map((podcast) => (
              <Col
                key={podcast.id}
                className="flex-shrink-0"
                style={{ minWidth: "300px" }}
              >
                <PodcastCard podcast={podcast} user={podcast.creator} />
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

        <h2 className="my-4 text-left">Now Live</h2>
        <div className="position-relative">
          <Row
            ref={nowLivePodcastScroll}
            className="my-4 card-row flex-nowrap scroll-hide"
            onScroll={() => updatVisibility(nowLivePodcastScroll)}
          >
            {nowLivePodcasts.map((podcast) => (
              <Col
                key={podcast.id}
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
      </Container>
    </div>
  );
};

export default HomePage;
