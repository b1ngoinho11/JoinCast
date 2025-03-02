// ../src/components/streamVideo.jsx
import React from 'react';
import ReactPlayer from 'react-player';

const LiveStream = () => {
  const streamUrl = 'https://www.youtube.com/watch?v=YOUR_LIVE_STREAM_ID'; // Replace with your live stream URL

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <ReactPlayer
        url={streamUrl}
        playing
        controls
        width="100%"
        height="100%"
      />
    </div>
  );
};

export default LiveStream;