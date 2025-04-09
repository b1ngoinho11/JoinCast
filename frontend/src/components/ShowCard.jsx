import React from "react";
import { Link } from "react-router-dom";

// Utility function to format timeAgo (unchanged)
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

const ShowCard = ({ show }) => {
  // Use the first episode's thumbnail if available, or a default placeholder
  const imageUrl = show.episodes?.length > 0
    ? `http://localhost:8000/api/v1/episodes/thumbnail/${show.episodes[0].thumbnail}`
    : "https://via.placeholder.com/1200x400"; // Larger placeholder for banner

  // Use categories from the first episode, or default to "General"
  const categories = show.episodes?.length > 0
    ? show.episodes[0].categories
    : "General";

  // Use the earliest episode's created_at for timeAgo, or current time as fallback
  const timeAgo = show.episodes?.length > 0
    ? show.episodes.reduce((earliest, ep) =>
        new Date(ep.created_at) < new Date(earliest.created_at) ? ep : earliest
      ).created_at
    : new Date().toISOString();

  return (
    <Link
      to={`/list-shows/${show.id}`}
      className="block w-full h-[400px] rounded-lg overflow-hidden relative no-underline text-inherit group"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.2)), url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 flex items-center p-6 md:p-10">
        <div className="max-w-md">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">{show.name}</h3>
          <p className="text-lg text-gray-300 mb-2">{show.creator.username}</p>
          <p className="text-sm text-gray-200 mb-4">{show.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <span>{categories}</span>
            <span className="before:content-['•'] before:mx-2">{formatTimeAgo(timeAgo)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-[#1db954] text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 hover:bg-[#1ed760] transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
              Browse Now
            </button>
            {/* <button className="bg-gray-700/50 text-white p-2 rounded-full hover:bg-gray-600/50 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>
              </svg>
            </button>
            <button className="bg-gray-700/50 text-white p-2 rounded-full hover:bg-gray-600/50 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v.01"></path>
                <path d="M12 8v4"></path>
              </svg>
            </button> */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ShowCard;