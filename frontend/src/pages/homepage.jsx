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
  const [bannerPodcasts, setBannerPodcasts] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleScroll = (scrollRef, scrollOffset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += scrollOffset;
    }
  };

  const updateVisibility = (scrollRef) => {
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

  const handleBannerNavigation = (direction) => {
    if (isAnimating) return;
    setIsAnimating(true);

    setCurrentBannerIndex((prevIndex) => {
      if (direction === "next") {
        return (prevIndex + 1) % bannerPodcasts.length;
      } else {
        return prevIndex === 0 ? bannerPodcasts.length - 1 : prevIndex - 1;
      }
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  useEffect(() => {
    if (categoryScroll.current) {
      categoryScroll.current.scrollLeft = 0;
    }

    updateVisibility(nowLivePodcastScroll);
    updateVisibility(trendingPodcastScroll);
    updateVisibility(categoryScroll);

    const handleResize = () => {
      updateVisibility(nowLivePodcastScroll);
      updateVisibility(trendingPodcastScroll);
      updateVisibility(categoryScroll);
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

        const allPodcasts = [...watchNow, ...nowLive];
        if (allPodcasts.length > 0) {
          const shuffled = allPodcasts.sort(() => 0.5 - Math.random());
          setBannerPodcasts(shuffled.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching episodes:", error);
      }
    };

    fetchEpisodes();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to determine banner classes based on position relative to current index
  const getBannerClass = (index) => {
    const length = bannerPodcasts.length;
    const diff = (index - currentBannerIndex + length) % length;

    switch (diff) {
      case 0:
        return "banner-middle";
      case 1:
        return "banner-right";
      case length - 1:
        return "banner-left";
      case length - 2:
        return "banner-hidden-left";
      case 2:
        return "banner-hidden-right";
      default:
        return "banner-hidden-right"; // Default for any other position
    }
  };

  return (
    <div>
      <Container style={{ maxWidth: "90%", padding: "0" }}>
        {/* Banner Section */}
        {bannerPodcasts.length > 0 && (
          <div className="banner-container">
            <div className="banner-wrapper">
              {bannerPodcasts.map((podcast, index) => (
                <div
                  key={podcast.id}
                  className={`banner-item ${getBannerClass(index)} ${
                    isAnimating ? "banner-slide" : ""
                  }`}
                  style={{
                    backgroundImage: `url(${podcast.imageUrl})`,
                  }}
                >
                  <div className="banner-overlay">
                    <div className="banner-content">
                      <Row className="justify-content-center align-items-center h-100">
                        <Col
                          xs={12}
                          md={8}
                          lg={6}
                          className="d-flex align-items-center"
                        >
                          <div className="banner-thumbnail-container">
                            <img
                              src={podcast.imageUrl}
                              alt={podcast.title}
                              className="banner-thumbnail"
                            />
                          </div>
                          <div className="banner-text">
                            <h1 className="banner-title">{podcast.title}</h1>
                            <p className="banner-creator">
                              by {podcast.creator.name}
                            </p>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Navigation Buttons */}
            <Button
              variant="dark"
              className="banner-nav-button banner-nav-left"
              onClick={() => handleBannerNavigation("prev")}
            >
              <IoIosArrowBack style={{ background: "transparent", color: "white" }} />
            </Button>
            <Button
              variant="dark"
              className="banner-nav-button banner-nav-right"
              onClick={() => handleBannerNavigation("next")}
            >
              <IoIosArrowForward style={{ background: "transparent", color: "white" }} />
            </Button>
          </div>
        )}

        <h2 className="my-4">Categories</h2>
        <div className="position-relative">
          <Row
            ref={categoryScroll}
            className="category-row justify-content-start flex-nowrap scroll-hide"
            style={{ gap: "0.5rem", overflow: "auto" }}
            onScroll={() => updateVisibility(categoryScroll)}
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
            onScroll={() => updateVisibility(trendingPodcastScroll)}
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
            onScroll={() => updateVisibility(nowLivePodcastScroll)}
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