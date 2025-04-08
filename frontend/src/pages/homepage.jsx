import React, { useRef, useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import PodcastCard from "../components/PodcastCard";
import "../css/HomePage.css";

const HomePage = () => {
  const nowLivePodcastScroll = useRef(null);
  const trendingPodcastScroll = useRef(null);
  const categoryScroll = useRef(null);
  const [leftLiveScroll, setLeftLiveScroll] = useState(false);
  const [leftTrendingScroll, setLeftTrendingScroll] = useState(false);
  const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
  const [rightLiveScroll, setRightLiveScroll] = useState(true);
  const [rightTrendingScroll, setRightTrendingScroll] = useState(true);
  const [rightCategoryScroll, setRightCategoryScroll] = useState(true);
  const [categories, setCategories] = useState([]);
  const [watchNowPodcasts, setWatchNowPodcasts] = useState([]);
  const [nowLivePodcasts, setNowLivePodcasts] = useState([]);
  const [allWatchNowPodcasts, setAllWatchNowPodcasts] = useState([]);
  const [allNowLivePodcasts, setAllNowLivePodcasts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

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
      setRightLiveScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }

    if (scrollRef === trendingPodcastScroll) {
      setLeftTrendingScroll(scrollLeft > 0);
      setRightTrendingScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }

    if (scrollRef === categoryScroll) {
      setLeftCategoryScroll(scrollLeft > 0);
      setRightCategoryScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);

    if (category === "All") {
      setWatchNowPodcasts(allWatchNowPodcasts);
      setNowLivePodcasts(allNowLivePodcasts);
    } else {
      const filteredWatchNow = allWatchNowPodcasts.filter((podcast) =>
        podcast.genre.includes(category)
      );
      const filteredNowLive = allNowLivePodcasts.filter((podcast) =>
        podcast.genre.includes(category)
      );

      setWatchNowPodcasts(filteredWatchNow);
      setNowLivePodcasts(filteredNowLive);
    }
  };

  useEffect(() => {
    if (categoryScroll.current) {
      categoryScroll.current.scrollLeft = 0;
    }

    updatVisibility(nowLivePodcastScroll);
    updatVisibility(trendingPodcastScroll);
    updatVisibility(categoryScroll);

    const handleResize = () => {
      updatVisibility(nowLivePodcastScroll);
      updatVisibility(trendingPodcastScroll);
      updatVisibility(categoryScroll);
    };

    window.addEventListener("resize", handleResize);

    const fetchCategories = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/episodes/categories/names"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data = await response.json();
        setCategories(["All", ...data]);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([
          "All",
          "Technology",
          "Business",
          "Health",
          "Entertainment",
          "Education",
        ]);
      }
    };

    fetchCategories();

    const fetchEpisodes = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/episodes/?skip=0&limit=100"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch episodes");
        }
        const data = await response.json();

        const watchNow = [];
        const nowLive = [];
        data.forEach((episode) => {
          const podcast = {
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
          };
          if (episode.type === "recording") {
            watchNow.push(podcast);
          } else {
            nowLive.push(podcast);
          }
        });

        setAllWatchNowPodcasts(watchNow);
        setAllNowLivePodcasts(nowLive);
        setWatchNowPodcasts(watchNow);
        setNowLivePodcasts(nowLive);
      } catch (error) {
        console.error("Error fetching episodes:", error);
      }
    };

    fetchEpisodes();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div>
      <Container style={{ maxWidth: "90%", padding: "0" }}>
        <h2 className="my-4">Categories</h2>
        <div className="position-relative">
          <Row
            ref={categoryScroll}
            className="category-row justify-content-start flex-nowrap scroll-hide"
            style={{ gap: "0.5rem", overflow: "auto" }}
            onScroll={() => updatVisibility(categoryScroll)}
          >
            {categories.map((category, index) => (
              <Col xs="auto" key={index}>
                <Button
                  variant={selectedCategory === category ? "primary" : "dark"}
                  className="category-button"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </Button>
              </Col>
            ))}
          </Row>
          {leftCategoryScroll && (
            <Button
              variant="dark"
              className="scroll-button left"
              onClick={() => handleScroll(categoryScroll, -200)}
            >
              <IoIosArrowBack
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
          {rightCategoryScroll && (
            <Button
              variant="dark"
              className="scroll-button right"
              onClick={() => handleScroll(categoryScroll, 200)}
            >
              <IoIosArrowForward
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
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
                style={{ minWidth: "240px" }}
              >
                <PodcastCard
                  podcast={podcast}
                  user={podcast.creator}
                  link={"recording/"}
                />
              </Col>
            ))}
          </Row>
          {leftTrendingScroll && (
            <Button
              variant="dark"
              className="scroll-button left"
              onClick={() => handleScroll(trendingPodcastScroll, -400)}
            >
              <IoIosArrowBack
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
          {rightTrendingScroll && (
            <Button
              variant="dark"
              className="scroll-button right"
              onClick={() => handleScroll(trendingPodcastScroll, 400)}
            >
              <IoIosArrowForward
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
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
                style={{ minWidth: "240px" }}
              >
                <PodcastCard
                  podcast={podcast}
                  user={podcast.creator}
                  link={"podcast/"}
                />
              </Col>
            ))}
          </Row>
          {leftLiveScroll && (
            <Button
              variant="dark"
              className="scroll-button left"
              onClick={() => handleScroll(nowLivePodcastScroll, -400)}
            >
              <IoIosArrowBack
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
          {rightLiveScroll && (
            <Button
              variant="dark"
              className="scroll-button right"
              onClick={() => handleScroll(nowLivePodcastScroll, 400)}
            >
              <IoIosArrowForward
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
        </div>
      </Container>
    </div>
  );
};

export default HomePage;