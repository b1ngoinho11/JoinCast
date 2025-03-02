import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function podcastLive() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setStreaming(false);
  };

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <Card className="w-full max-w-2xl p-4">
        <CardContent className="flex flex-col items-center">
          <video ref={videoRef} autoPlay playsInline className="w-full max-h-96 rounded-lg border" />
          <div className="flex gap-4 mt-4">
            {!streaming ? (
              <Button onClick={startStream} variant="primary">
                Start Live <Video className="ml-2" />
              </Button>
            ) : (
              <Button onClick={stopStream} variant="destructive">
                Stop Live
              </Button>
            )}
            {streaming && !recording && (
              <Button onClick={startRecording} variant="outline">
                Start Recording
              </Button>
            )}
            {recording && (
              <Button onClick={stopRecording} variant="secondary">
                Stop Recording
              </Button>
            )}
            {recordedChunks.length > 0 && (
              <Button onClick={downloadRecording} variant="success">
                Download Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}