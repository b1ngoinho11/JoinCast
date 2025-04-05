import React from "react";
import "../css/PodcastCard.css";
import { Link } from "react-router-dom";

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
            <p className="time">{podcast.timeAgo}</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PodcastCard;
