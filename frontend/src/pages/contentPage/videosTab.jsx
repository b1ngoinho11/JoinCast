import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { Button } from "react-bootstrap";
import EditVideoModal from "@/components/editVideo";
import "../../css/videostab.css";
import videoData from "../../data/videoData";

const VideosTab = () => {
  const [videos, setVideos] = useState(videoData);
  const [sortOrder, setSortOrder] = useState("default");
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  const sortedVideos = (() => {
    if (sortOrder === "asc") {
      return [...videos].sort((a, b) => b.views - a.views);
    } else if (sortOrder === "desc") {
      return [...videos].sort((a, b) => a.views - b.views);
    }
    return videos;
  })();

  const cycleSortOrder = () => {
    if (sortOrder === "default") {
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortOrder("default");
    }
  };

  const handleSelectChange = (id) => {
    setSelectedVideos((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((videoId) => videoId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleEdit = (video) => {
    setCurrentVideo(video);
    setShowModal(true);
  };

  const handleEditSubmit = (
    id,
    newName,
    newDescription,
    newThumbnail,
    newPlaylist
  ) => {
    // Update the video details in the videos state
    const updatedVideos = videos.map((video) =>
      video.id === id
        ? {
            ...video,
            name: newName,
            description: newDescription,
            thumbnail: newThumbnail,
            playlist: newPlaylist,
          }
        : video
    );

    // Set the updated videos to state
    setVideos(updatedVideos);
    console.log(updatedVideos); // For demonstration, log the updated videos
    setCurrentVideo(null);
  };

  const handleDelete = () => {
    alert(`Delete videos: ${selectedVideos.join(", ")}`);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={cycleSortOrder}
          style={{
            display: "flex",
            alignItems: "center",
            border: "none",
            cursor: "pointer",
            padding: "5px 10px",
            borderRadius: "4px",
          }}
        >
          {sortOrder === "asc" ? (
            <FaSortUp />
          ) : sortOrder === "desc" ? (
            <FaSortDown />
          ) : (
            <FaSort />
          )}
          Sort:{" "}
          {sortOrder === "asc"
            ? "Most Views"
            : sortOrder === "desc"
            ? "Least Views"
            : "Default"}
        </button>
      </div>

      {/* Video List */}
      {sortedVideos.map((video) => (
        <div
          key={video.id}
          className="video-row"
          style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            marginBottom: "20px",
            transition: "transform 0.2s ease-in-out",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.02)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <input
            type="checkbox"
            checked={selectedVideos.includes(video.id)}
            onChange={() => handleSelectChange(video.id)}
            style={{ marginRight: "15px" }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flex: 1,
              cursor: "pointer",
            }}
            onClick={() => handleEdit(video)}
          >
            <img
              src={video.thumbnail}
              alt={video.name}
              style={{
                width: "180px",
                height: "auto",
                borderRadius: "10px",
                objectFit: "cover",
              }}
            />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "18px", margin: "0", color: "#333" }}>
                {video.name}
              </h4>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
                {video.description}
              </p>
            </div>
            <p
              style={{
                fontSize: "14px",
                color: "#666",
                fontWeight: "bold",
                marginRight: "15px",
              }}
            >
              {video.views.toLocaleString()} views
            </p>
          </div>
        </div>
      ))}

      {/* Action Buttons */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={handleDelete}
          disabled={selectedVideos.length === 0}
          style={{
            padding: "10px",
            borderRadius: "4px",
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
          }}
        >
          Delete Selected
        </Button>
      </div>

      {/* Edit Video Modal */}
      {currentVideo && (
        <EditVideoModal
          show={showModal}
          handleClose={() => setShowModal(false)}
          video={currentVideo}
          handleEditSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default VideosTab;