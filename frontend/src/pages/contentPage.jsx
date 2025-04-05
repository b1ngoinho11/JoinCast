import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "react-bootstrap";
import VideosTab from "./contentPage/videosTab";

const ContentPage = () => {
    const [activeTab, setActiveTab] = useState("Videos"); // Default active tab

    // Function to render content based on the active tab
    const renderContent = () => {
        switch (activeTab) {
            case "Videos":
                return <VideosTab />;
            case "Live":
                return <p>This is where your live streams will be displayed.</p>;
            case "Playlists":
                return <p>This is where your playlists will be displayed.</p>;
            default:
                return null;
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1 style={{ marginBottom: "20px" }}>Channel Content</h1>

            {/* Action Bar */}
            <div style={{ marginBottom: "10px" }}>
                <ButtonGroup aria-label="Action Bar">
                    <Button
                        size='lg'
                        variant="link"
                        onClick={() => setActiveTab("Videos")}
                        active={activeTab === "Videos"}
                    >
                        Videos
                    </Button>
                    <Button
                        size='lg'
                        variant="link"
                        onClick={() => setActiveTab("Live")}
                        active={activeTab === "Live"}
 >
                        Live
                    </Button>
                    <Button
                        size='lg'
                        variant="link"
                        onClick={() => setActiveTab("Playlists")}
                        active={activeTab === "Playlists"}
                    >
                        Playlists
                    </Button>
                </ButtonGroup>
            </div>
            <hr style={{ marginBottom: "20px" }} />

            {/* Content Area */}
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default ContentPage;