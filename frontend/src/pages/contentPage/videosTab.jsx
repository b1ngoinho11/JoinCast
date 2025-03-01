import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaSortUp, FaSortDown, FaSort } from "react-icons/fa"; // Added FaSort for default state

const videoData = [
    {
        id: 1,
        thumbnail: "https://via.placeholder.com/150",
        name: "Video Title 1",
        views: 1234,
    },
    {
        id: 2,
        thumbnail: "https://via.placeholder.com/150",
        name: "Video Title 2",
        views: 567,
    },
    {
        id: 3,
        thumbnail: "https://via.placeholder.com/150",
        name: "Video Title 3",
        views: 890,
    },
    {
        id: 4,
        thumbnail: "https://via.placeholder.com/150",
        name: "Video Title 4",
        views: 345,
    },
];

const VideosTab = () => {
    const [sortOrder, setSortOrder] = useState("default");

    // Sorted video data based on views
    const sortedVideos = (() => {
        if (sortOrder === "asc") {
            return [...videoData].sort((a, b) => a.views - b.views);
        } else if (sortOrder === "desc") {
            return [...videoData].sort((a, b) => b.views - a.views);
        }
        return videoData; // Return original order if default
    })();

    // Function to cycle through sort states: default -> asc -> desc -> default
    const cycleSortOrder = () => {
        if (sortOrder === "default") {
            setSortOrder("asc");
        } else if (sortOrder === "asc") {
            setSortOrder("desc");
        } else {
            setSortOrder("default");
        }
    };

    // Determine which icon and text to show based on current sort state
    const getSortButton = () => {
        switch (sortOrder) {
            case "asc":
                return (
                    <>
                        <FaSortUp style={{ marginRight: "5px" }} />
                        Sort: Ascending
                    </>
                );
            case "desc":
                return (
                    <>
                        <FaSortDown style={{ marginRight: "5px" }} />
                        Sort: Descending
                    </>
                );
            default:
                return (
                    <>
                        <FaSort style={{ marginRight: "5px" }} />
                        Sort: Default
                    </>
                );
        }
    };

    return (
        <div>
            {/* Single Sort Button that cycles through states */}
            
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
                    {getSortButton()}
                </button>
            </div>

            {/* Video List */}
            {sortedVideos.map((video) => (
                <Link to={`/video/${video.id}`} key={video.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", cursor: "pointer" }}>
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
                </Link>
            ))}
        </div>
    );
};

export default VideosTab;