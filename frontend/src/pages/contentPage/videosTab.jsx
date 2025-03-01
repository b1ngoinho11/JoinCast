import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaSortUp, FaSortDown, FaSort } from "react-icons/fa";
import { Button } from "react-bootstrap";
import EditVideoModal from "@/components/editVideo";
import '../../css/videostab.css';

const videoData = [
    {
        id: 1,
        thumbnail: "https://placehold.co/600x400",
        name: "Video Title 1",
        views: 1234,
        description: "Description for Video Title 1",
        playlist: null,
    },
    {
        id: 2,
        thumbnail: "https://placehold.co/600x400",
        name: "Video Title 2",
        views: 567,
        description: "Description for Video Title 2",
        playlist: null,
    },
    {
        id: 3,
        thumbnail: "https://placehold.co/600x400",
        name: "Video Title 3",
        views: 890,
        description: "Description for Video Title 3",
        playlist: null,
    },
    {
        id: 4,
        thumbnail: "https://placehold.co/600x400",
        name: "Video Title 4",
        views: 345,
        description: "Description for Video Title 4",
        playlist: null,
    },
];

const VideosTab = () => {
    const [sortOrder, setSortOrder] = useState("default");
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState(null);

    const sortedVideos = (() => {
        if (sortOrder === "asc") {
            return [...videoData].sort((a, b) => a.views - b.views);
        } else if (sortOrder === "desc") {
            return [...videoData].sort((a, b) => b.views - a.views);
        }
        return videoData;
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

    const handleEditSubmit = (id, newName, newDescription, newThumbnail, newPlaylist) => {
        // Update the video details in the videoData array
        const updatedVideos = videoData.map(video => 
            video.id === id ? { ...video, name: newName, description: newDescription, thumbnail: newThumbnail, playlist: newPlaylist } : video
        );
        // You may want to set the updatedVideos to state if you're managing state for videoData
        console.log(updatedVideos); // For demonstration, log the updated videos
    };

    const handleDelete = () => {
        alert(`Delete videos: ${selectedVideos.join(", ")}`);
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
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
                    {sortOrder === "asc" ? <FaSortUp /> : sortOrder === "desc" ? <FaSortDown /> : <FaSort />}
                    Sort: {sortOrder === "asc" ? "Ascending" : sortOrder === "desc" ? "Descending" : "Default"}
                </button>
            </div>

            {/* Video List */}
            {sortedVideos.map((video) => (
                <div key={video.id} className="video-row" style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                    <input
                        type="checkbox"
                        checked={selectedVideos.includes(video.id)}
                        onChange={() => handleSelectChange(video.id)}
                        style={{ marginRight: "10px" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => handleEdit(video)}>
                        <img
                            src={video.thumbnail}
                            alt={video.name}
                            style={{ width: "150px", height: "auto", borderRadius: "8px", marginRight: "20px" }}
                        />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: "16px", margin: "0" }}>{video.name}</h4>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "14px", color: "#666", margin: "5px 0" }}>{video.views.toLocaleString()} views</p>
                            </div>
                        </div>
                    </div>
            ))}

            {/* Action Buttons */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
                <Button onClick={handleEdit} disabled={selectedVideos.length === 0} style={{ padding: "10px", borderRadius: "4px", backgroundColor: "#007bff", color: "#fff", border: "none" }}>
                    Edit Selected
                </Button>
                <Button onClick={handleDelete} disabled={selectedVideos.length === 0} style={{ padding: "10px", borderRadius: "4px", backgroundColor: "#dc3545", color: "#fff", border: "none" }}>
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