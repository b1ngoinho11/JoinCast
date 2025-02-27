import React, { useRef, useState, useEffect, use } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import PodcastCard from "../components/PodcastCard";
import "../css/HomePage.css";

const FollowingPage = () => {
  const nowLivePodcastScroll = useRef(null);
  const recentlyPodcastScroll = useRef(null);
  const [leftLiveScroll, setLeftLiveScroll] = useState(false);
  const [leftrecentlyScroll, setLeftrecentlyScroll] = useState(false);
  const [rightLiveScroll, setRightLiveScroll] = useState(true);
  const [rightrecentlyScroll, setRightrecentlyScroll] = useState(true);
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

    if (scrollRef === recentlyPodcastScroll) {
      setLeftrecentlyScroll(scrollLeft > 0);
      setRightrecentlyScroll(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
      updatVisibility(nowLivePodcastScroll);
      updatVisibility(recentlyPodcastScroll);
    }, []);
   

  return (
    <div>
      <Container style={{ maxWidth: "90%", padding: "0", }}>
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

        <h2 className="my-4 text-left">Recently</h2>
        <div className="position-relative">
          <Row
            ref={recentlyPodcastScroll}
            className="my-4 card-row flex-nowrap scroll-hide"
            onScroll={() => updatVisibility(recentlyPodcastScroll)}
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
            onClick={() => handleScroll(recentlyPodcastScroll, -400)}
          >
            <IoIosArrowBack
              style={{ background: "transparent", color: "black" }}
            />
          </Button>
          <Button
            variant="dark"
            className="scroll-button right"
            onClick={() => handleScroll(recentlyPodcastScroll, 400)}
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

export default FollowingPage;
