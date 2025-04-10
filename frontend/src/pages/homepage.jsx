import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Button, FormControl } from "react-bootstrap";
import { IoIosArrowBack, IoIosArrowForward, IoIosSearch } from "react-icons/io";
import PodcastCard from "../components/PodcastCard";
import ShowCard from "../components/ShowCard"; // Adjusted import path
import "../css/HomePage.css";

const HomePage = () => {
  const nowLivePodcastScroll = useRef(null);
  const trendingPodcastScroll = useRef(null);
  const categoryScroll = useRef(null);
  const replayPodcastScroll = useRef(null);
  const [leftLiveScroll, setLeftLiveScroll] = useState(false);
  const [leftTrendingScroll, setLeftTrendingScroll] = useState(false);
  const [leftCategoryScroll, setLeftCategoryScroll] = useState(false);
  const [leftReplayScroll, setLeftReplayScroll] = useState(false);
  const [rightLiveScroll, setRightLiveScroll] = useState(true);
  const [rightTrendingScroll, setRightTrendingScroll] = useState(true);
  const [rightCategoryScroll, setRightCategoryScroll] = useState(true);
  const [rightReplayScroll, setRightReplayScroll] = useState(true);
  const [categories, setCategories] = useState([]);
  const [watchNowPodcasts, setWatchNowPodcasts] = useState([]);
  const [nowLivePodcasts, setNowLivePodcasts] = useState([]);
  const [replayPodcasts, setReplayPodcasts] = useState([]);
  const [allWatchNowPodcasts, setAllWatchNowPodcasts] = useState([]);
  const [allNowLivePodcasts, setAllNowLivePodcasts] = useState([]);
  const [allReplayPodcasts, setAllReplayPodcasts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [bannerPodcasts, setBannerPodcasts] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [randomShow, setRandomShow] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

    if (scrollRef === replayPodcastScroll) {
      setLeftReplayScroll(scrollLeft > 0);
      setRightReplayScroll(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);

    if (category === "All") {
      setWatchNowPodcasts(allWatchNowPodcasts);
      setNowLivePodcasts(allNowLivePodcasts);
      setReplayPodcasts(allReplayPodcasts);
    } else {
      const filteredWatchNow = allWatchNowPodcasts.filter((podcast) =>
        podcast.genre.includes(category)
      );
      const filteredNowLive = allNowLivePodcasts.filter((podcast) =>
        podcast.genre.includes(category)
      );
      const filteredReplays = allReplayPodcasts.filter((podcast) =>
        podcast.genre.includes(category)
      );

      setWatchNowPodcasts(filteredWatchNow);
      setNowLivePodcasts(filteredNowLive);
      setReplayPodcasts(filteredReplays);
    }
  };

  const handleBannerNavigation = (direction) => {
    if (isAnimating) return;
    setIsAnimating(true);

    setCurrentBannerIndex((prevIndex) => {
      if (direction === "left") {
        return prevIndex === 0 ? bannerPodcasts.length - 1 : prevIndex - 1;
      } else {
        return prevIndex === bannerPodcasts.length - 1 ? 0 : prevIndex + 1;
      }
    });

    // Reset animation state after transition duration
    setTimeout(() => {
      setIsAnimating(false);
    }, 500); // Match CSS transition duration
  };

  useEffect(() => {
    if (categoryScroll.current) {
      categoryScroll.current.scrollLeft = 0;
    }

    updatVisibility(nowLivePodcastScroll);
    updatVisibility(trendingPodcastScroll);
    updatVisibility(categoryScroll);
    updatVisibility(replayPodcastScroll);

    const handleResize = () => {
      updatVisibility(nowLivePodcastScroll);
      updatVisibility(trendingPodcastScroll);
      updatVisibility(categoryScroll);
      updatVisibility(replayPodcastScroll);
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

    const fetchLives = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/episodes/live/?skip=0&limit=100"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch live episodes");
        }
        const data = await response.json();

        const nowLive = data
          .filter((episode) => episode.is_active)
          .map((episode) => ({
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

        const replays = data
          .filter((episode) => !episode.is_active)
          .map((episode) => ({
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

        setAllNowLivePodcasts(nowLive);
        setNowLivePodcasts(nowLive);
        setAllReplayPodcasts(replays);
        setReplayPodcasts(replays);
        return { nowLive, replays };
      } catch (error) {
        console.error("Error fetching live episodes:", error);
        return { nowLive: [], replays: [] };
      }
    };

    const fetchRecordings = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/episodes/recording/?skip=0&limit=10"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch recordings");
        }
        const data = await response.json();

        const watchNow = data.map((episode) => ({
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

        setAllWatchNowPodcasts(watchNow);
        setWatchNowPodcasts(watchNow);
        return watchNow;
      } catch (error) {
        console.error("Error fetching recordings:", error);
        return [];
      }
    };

    const fetchShows = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/v1/shows/?skip=0&limit=10"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch shows");
        }
        const data = await response.json();

        // Randomly select one show
        if (data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          return data[randomIndex];
        }
        return null;
      } catch (error) {
        console.error("Error fetching shows:", error);
        return null;
      }
    };

    const fetchData = async () => {
      await fetchCategories();
      const [{ nowLive, replays }, recordings, show] = await Promise.all([
        fetchLives(),
        fetchRecordings(),
        fetchShows(),
      ]);

      setRandomShow(show);

      const allPodcasts = [...recordings, ...nowLive, ...replays];
      if (allPodcasts.length > 0) {
        const shuffled = allPodcasts.sort(() => 0.5 - Math.random());
        setBannerPodcasts(shuffled.slice(0, 5));
      }
    };

    fetchData();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getBannerIndices = () => {
    const prevIndex =
      currentBannerIndex === 0
        ? bannerPodcasts.length - 1
        : currentBannerIndex - 1;
    const nextIndex =
      currentBannerIndex === bannerPodcasts.length - 1
        ? 0
        : currentBannerIndex + 1;
    return { prevIndex, currentIndex: currentBannerIndex, nextIndex };
  };

  const filterPodcasts = (podcasts) => {
    if (!searchQuery) return podcasts;
    return podcasts.filter((podcast) =>
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  console.log(randomShow);

  return (
    <div>
      <Container style={{ maxWidth: "90%", padding: "0" }}>
        {/* Add Search Bar */}
        <div className="d-flex justify-content-center my-4">
          <div style={{ width: "60%", position: "relative" }}>
            <FormControl
              type="search"
              placeholder="Search podcasts..."
              className="me-2"
              aria-label="Search"
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
              }}
            />
          </div>
        </div>

        {/* Banner Section */}
        {bannerPodcasts.length > 0 && (
          <div className="banner-container">
            <div className="banner-wrapper">
              {bannerPodcasts.map((podcast, index) => {
                const { prevIndex, currentIndex, nextIndex } =
                  getBannerIndices();
                let bannerClass = "";
                if (index === currentIndex) {
                  bannerClass = "banner-middle";
                } else if (index === prevIndex) {
                  bannerClass = "banner-left";
                } else if (index === nextIndex) {
                  bannerClass = "banner-right";
                } else {
                  // Hide other items to prevent overlap
                  bannerClass = "banner-hidden";
                }

                return (
                  <Link
                    key={podcast.id}
                    to={`/${
                      podcast.type === "live" ? "podcast/" : "recording/"
                    }${podcast.id}`}
                    className={`banner-item ${bannerClass} ${
                      isAnimating ? "banner-slide" : ""
                    }`}
                    style={{
                      backgroundImage: `url(${podcast.imageUrl})`,
                      // Ensure non-visible items are hidden
                      display:
                        bannerClass === "banner-hidden" ? "none" : "block",
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
                                {podcast.creator.name}
                              </p>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Button
              variant="dark"
              className="banner-nav-button banner-nav-left"
              onClick={() => handleBannerNavigation("left")}
              aria-label="Previous banner"
            >
              <IoIosArrowBack
                style={{ background: "transparent", color: "white" }}
              />
            </Button>
            <Button
              variant="dark"
              className="banner-nav-button banner-nav-right"
              onClick={() => handleBannerNavigation("right")}
              aria-label="Next banner"
            >
              <IoIosArrowForward
                style={{ background: "transparent", color: "white" }}
              />
            </Button>
          </div>
        )}

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
          <div
            ref={trendingPodcastScroll}
            className="podcast-row"
            onScroll={() => updatVisibility(trendingPodcastScroll)}
          >
            {filterPodcasts(watchNowPodcasts).length > 0 ? (
              filterPodcasts(watchNowPodcasts).map((podcast) => (
                <div key={podcast.id} className="podcast-card-wrapper">
                  <PodcastCard
                    podcast={podcast}
                    user={podcast.creator}
                    link={"recording/"}
                  />
                </div>
              ))
            ) : (
              <div className="w-100 text-center py-4">
                <p>No podcasts found matching your search.</p>
              </div>
            )}
          </div>
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
          <div
            ref={nowLivePodcastScroll}
            className="podcast-row"
            onScroll={() => updatVisibility(nowLivePodcastScroll)}
          >
            {filterPodcasts(nowLivePodcasts).length > 0 ? (
              filterPodcasts(nowLivePodcasts).map((podcast) => (
                <div key={podcast.id} className="podcast-card-wrapper">
                  <PodcastCard
                    podcast={podcast}
                    user={podcast.creator}
                    link={"podcast/"}
                  />
                </div>
              ))
            ) : (
              <div className="w-100 text-center py-4">
                <p>No live podcasts found matching your search.</p>
              </div>
            )}
          </div>
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

        <h2 className="my-4 text-left">Today's Pick Shows</h2>
        <div className="position-relative">
          <Row className="my-4 card-row">
            {randomShow ? (
              <Col className="flex-shrink-0" style={{ minWidth: "240px" }}>
                <ShowCard show={randomShow} />
              </Col>
            ) : (
              <Col>
                <p>No show available for today's pick.</p>
              </Col>
            )}
          </Row>
        </div>

        <h2 className="my-4 text-left">Replays</h2>
        <div className="position-relative">
          <div
            ref={replayPodcastScroll}
            className="podcast-row"
            onScroll={() => updatVisibility(replayPodcastScroll)}
          >
            {filterPodcasts(replayPodcasts).length > 0 ? (
              filterPodcasts(replayPodcasts).map((podcast) => (
                <div key={podcast.id} className="podcast-card-wrapper">
                  <PodcastCard
                    podcast={podcast}
                    user={podcast.creator}
                    link={"replay/"}
                  />
                </div>
              ))
            ) : (
              <div className="w-100 text-center py-4">
                <p>No replays found matching your search.</p>
              </div>
            )}
          </div>
          {leftReplayScroll && (
            <Button
              variant="dark"
              className="scroll-button left"
              onClick={() => handleScroll(replayPodcastScroll, -400)}
            >
              <IoIosArrowBack
                style={{ background: "transparent", color: "black" }}
              />
            </Button>
          )}
          {rightReplayScroll && (
            <Button
              variant="dark"
              className="scroll-button right"
              onClick={() => handleScroll(replayPodcastScroll, 400)}
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
