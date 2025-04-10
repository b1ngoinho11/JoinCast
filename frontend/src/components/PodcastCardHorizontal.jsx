import React from "react";
import { Link } from "react-router-dom";

const formatTimeAgo = (timestamp) => {
  const past = new Date(timestamp);
  if (isNaN(past.getTime())) return "Invalid date";

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

const PodcastCardHorizontal = ({ podcast, user, link }) => {
  const isLive = podcast.type === "live";

  return (
    <div className="relative w-full">
      <Link
        to={`/${link}${podcast.id}`}
        className="flex items-center bg-[rgba(0,0,0,0.05)] rounded-lg p-3 hover:bg-[rgba(0,0,0,0.1)] transition-colors no-underline text-inherit w-full"
      >
        <div className="relative w-24 h-24 flex-shrink-0">
          <img
            src={podcast.imageUrl}
            alt={podcast.title}
            className="w-full h-full object-cover rounded-md"
          />
        </div>
        <div className="flex-1 pl-4 flex flex-col justify-between h-full">
          <h3 className="text-lg font-semibold truncate">{podcast.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="truncate">{user.name}</span>
            <span className="before:content-['•'] before:mx-2">
              {formatTimeAgo(podcast.timeAgo)}
            </span>
          </div>
        </div>
      </Link>
      {/* Live indicator badge moved to the right side of the card */}
      {isLive && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
          LIVE
        </div>
      )}
    </div>
  );
};

export default PodcastCardHorizontal;