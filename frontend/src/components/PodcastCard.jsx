import React from "react";
import "../css/PodcastCard.css";
import { Link } from "react-router-dom";

// Utility function to format timeAgo
const formatTimeAgo = (timestamp) => {
  const past = new Date(timestamp);
  if (isNaN(past.getTime())) {
    return "Invalid date"; // Handle invalid timestamps
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hrs ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} days ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} months ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} years ago`;
};

const PodcastCard = ({ podcast, user }) => {
  return (
    <Link to={`/podcast/${podcast.id}`} className="card-link">
      <div className="cardBox">
        <img
          src={podcast.imageUrl}
          alt="podcast"
          className="podcast-card-image"
        />
        <div className="cardContent">
          <div className="user-info">
            <img src={user.imageUrl} alt="avatar" className="avatar" />
            <div className="user-text">
              <p className="title">{podcast.title}</p>
              <p className="username">{user.name}</p>
            </div>
          </div>

          <div className="avatar-genre-time">
            <div className="genre">{podcast.genre}</div>
            <p className="time">{formatTimeAgo(podcast.timeAgo)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PodcastCard;
