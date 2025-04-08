import React, { useEffect, useState, useRef } from "react";
import { AudioLines, SquarePlay } from "lucide-react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Spinner, Alert, Card, Form, Button, Image } from "react-bootstrap";
import "../css/recordingPage.css";

const RecordingPage = () => {
  const { id } = useParams();
  const [recordingData, setRecordingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [videoDuration, setVideoDuration] = useState(null);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const API_URL = "http://localhost:8000/api/v1";

  // Handle time updates for both players
  const handleTimeUpdate = () => {
    const activePlayer = isAudioMode ? audioRef.current : videoRef.current;
    if (activePlayer) {
      setCurrentTime(activePlayer.currentTime);
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    const activePlayer = isAudioMode ? audioRef.current : videoRef.current;
    if (activePlayer) {
      if (activePlayer.paused) {
        activePlayer.play();
        setIsPlaying(true);
      } else {
        activePlayer.pause();
        setIsPlaying(false);
      }
    }
  };

  // Toggle between audio and video modes
  const toggleMediaMode = () => {
    // Get current state before switching
    const currentPlayer = isAudioMode ? audioRef.current : videoRef.current;
    const time = currentPlayer?.currentTime || 0;
    const wasPlaying = !currentPlayer?.paused;

    // Switch mode
    setIsAudioMode(!isAudioMode);

    // After a small delay to allow DOM update, sync the new player
    setTimeout(() => {
      const newPlayer = !isAudioMode ? audioRef.current : videoRef.current;
      if (newPlayer) {
        newPlayer.currentTime = time;
        if (wasPlaying) {
          newPlayer.play().catch((e) => console.error("Playback failed:", e));
        }
      }
    }, 50);
  };

  useEffect(() => {
    const fetchRecording = async () => {
      try {
        const response = await axios.get(`${API_URL}/episodes/recording/${id}`);
        setRecordingData(response.data);
      } catch (err) {
        setError("Failed to fetch recording details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      setComments([
        {
          id: 1,
          username: "User1",
          text: "Great episode, really enjoyed it!",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          username: "User2",
          text: "Interesting discussion, thanks for sharing!",
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    };

    fetchRecording();
    fetchComments();

    return () => {
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
      }
      if (audioRef.current) {
        audioRef.current.onloadedmetadata = null;
      }
    };
  }, [id]);

  useEffect(() => {
    const media = isAudioMode ? audioRef.current : videoRef.current;
    if (!media) return;

    const handleMetadataLoaded = () => {
      if (media.duration && isFinite(media.duration)) {
        setVideoDuration(Math.floor(media.duration));
      } else {
        setVideoDuration(0);
      }
    };

    media.onloadedmetadata = handleMetadataLoaded;

    if (media.readyState >= 1) {
      handleMetadataLoaded();
    }

    return () => {
      media.onloadedmetadata = null;
    };
  }, [recordingData, isAudioMode]);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: comments.length + 1,
      username: "CurrentUser",
      text: newComment,
      created_at: new Date().toISOString(),
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  const formatDuration = (seconds) => {
    if (seconds === null || !isFinite(seconds) || seconds <= 0) return "N/A";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours >= 1) {
      return minutes > 0 ? `${hours}hrs ${minutes}mins` : `${hours}hrs`;
    }
    return `${Math.max(1, minutes)}mins`;
  };

  if (loading) {
    return (
      <div className="text-center spinner">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="alert">
        {error}
      </Alert>
    );
  }

  return (
    <div className="container">
      <Card className="card">
        <Card.Body>
          {/* Media Player */}
          <div className="media-container">
            {isAudioMode ? (
              <div className="audio-player-container">
                <div className="audio-thumbnail-wrapper">
                  <div
                    className="audio-thumbnail-blur"
                    style={{
                      backgroundImage: `url(${API_URL}/episodes/thumbnail/${recordingData.thumbnail})`,
                    }}
                  ></div>
                  <img
                    src={`${API_URL}/episodes/thumbnail/${recordingData.thumbnail}`}
                    alt={recordingData.name}
                    className="audio-thumbnail-image"
                  />
                </div>
                <audio
                  controls
                  className="w-100"
                  ref={audioRef}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source
                    src={`${API_URL}/episodes/recording/video/${recordingData.video}`}
                    type="audio/mp4"
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : (
              <video
                controls
                className="video"
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source
                  src={`${API_URL}/episodes/recording/video/${recordingData.video}`}
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Rest of the component remains the same */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 className="title">{recordingData.name}</h2>
            <Button
              variant="outline-primary"
              size="m"
              onClick={toggleMediaMode}
            >
              {isAudioMode ? (
                <SquarePlay size={20} />
              ) : (
                <AudioLines size={20} />
              )}
            </Button>
          </div>

          <div className="creator-container">
            <Image
              src={
                recordingData.creator.profile_picture
                  ? `${API_URL}/users/profile-picture/${recordingData.creator.profile_picture}`
                  : "https://via.placeholder.com/40"
              }
              alt={recordingData.creator.username}
              className="creator-avatar"
            />
            <span className="creator-name">
              {recordingData.creator.username}
            </span>
          </div>

          <p className="date">
            {new Date(recordingData.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            &nbsp;•&nbsp;{formatDuration(videoDuration)}
          </p>

          <p className="category">
            <strong>
              {Array.isArray(recordingData.categories)
                ? recordingData.categories.join(", ")
                : recordingData.categories}
            </strong>
          </p>

          <p className="description">{recordingData.show.description}</p>
        </Card.Body>
      </Card>

      {/* Comments Section */}
      <Card className="card comments-section">
        <Card.Body>
          <h3 className="comments-title text-dark">Comments</h3>
          {comments.length === 0 ? (
            <p>No comments yet. Be the first to comment!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-username">{comment.username}</span>
                    <span className="comment-date">
                      {new Date(comment.created_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
          <Form onSubmit={handleCommentSubmit} className="comment-form">
            <Form.Group controlId="commentInput">
              <Form.Label>Add a Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment here..."
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="comment-submit">
              Comment
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RecordingPage;
