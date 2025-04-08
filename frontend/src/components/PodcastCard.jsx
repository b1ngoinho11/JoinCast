import React from "react";
import "../css/PodcastCard.css";
import { Link } from "react-router-dom";

// Utility function to format timeAgo
const formatTimeAgo = (timestamp) => {
  const past = new Date(timestamp);
  if (isNaN(past.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y`;
};

const PodcastCard = ({ podcast, user, link }) => {
  return (
    <Link to={`/${link}${podcast.id}`} className="card-link">
      <div className="cardBox">
        <div className="imageCard">
          <img
            src={podcast.imageUrl}
            alt={podcast.title}
            className="podcast-card-image"
          />
          <div className="headphone-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
            </svg>
          </div>
        </div>
      </div>
      <div className="textCard">
        <h3 className="title">{podcast.title}</h3>
        <p className="username">{user.name}</p>
        <div className="meta">
          <span className="genre">{podcast.genre}</span>
          <span className="time">{formatTimeAgo(podcast.timeAgo)}</span>
        </div>
      </div>
    </Link>
  );
};

export default PodcastCard;
