import React from "react";
import "../css/PodcastCard.css";

const PodcastCard = ({ podcast, user }) => {
  return (
    <div className="cardBox">
      <img
        src={podcast.imageUrl}
        alt="podcast"
        className="podcast-card-image"
      />
      <div className="cardContent">
        <h3>{podcast.title}</h3>
        <div className="user-info">
          <img src={user.imageUrl} alt="avatar" className="avatar" />
          <p className="username">{user.name}</p>
        </div>
        <div className="avatar-genre-time">
          <div className="genre">{podcast.genre}</div>
          <p className="time">{podcast.timeAgo}</p>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;