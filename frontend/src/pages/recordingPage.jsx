import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Spinner, Alert, Card } from "react-bootstrap";
import "../css/recordingPage.css";

const RecordingPage = () => {
  const { id } = useParams();
  const [recordingData, setRecordingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:8000/api/v1";

  useEffect(() => {
    const fetchRecording = async () => {
      try {
        const response = await axios.get(`${API_URL}/episodes/recording/${id}`);
        setRecordingData(response.data);
      } catch (err) {
        setError("Failed to fetch recording details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecording();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <Card className="mb-4">
        <Card.Body>
          <h2>{recordingData.name}</h2>
          <p><strong>Show:</strong> {recordingData.show.name}</p>
          <p><strong>Description:</strong> {recordingData.show.description}</p>
          <p><strong>Category:</strong> {recordingData.categories}</p>
          <p><strong>Creator:</strong> {recordingData.creator.username}</p>
          <p><strong>Created At:</strong> {new Date(recordingData.created_at).toLocaleString()}</p>
        </Card.Body>
      </Card>

      <div className="video-container" style={{ textAlign: "center" }}>
        <video
          controls
          style={{ width: "100%", maxWidth: "800px", borderRadius: "10px" }}
        >
          <source
            src={`${API_URL}/episodes/recording/video/${recordingData.video}`}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default RecordingPage;
