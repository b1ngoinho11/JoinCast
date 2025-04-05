import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  ScreenShare,
  MonitorOff,
  Video,
  StopCircle,
  UserPlus,
  Check,
  X,
  CircleDot,
  Circle,
} from "lucide-react";

export default function PodcastLive() {
  // State variables
  const [roomId, setRoomId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isHost, setIsHost] = useState(false);
  const [speakerRequestStatus, setSpeakerRequestStatus] = useState(null);

  // Refs for WebRTC and media streams
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const speechDetectionIntervalRef = useRef(null);
  const [participants, setParticipants] = useState([]);

  // Data structures
  const peerConnectionsRef = useRef({});
  const screenSharePeerConnectionsRef = useRef({});
  const participantsRef = useRef(new Map());
  const pendingRequestsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const screenShareStreamsRef = useRef(new Map());

  const clientId = useRef(
    `user_${Math.random().toString(36).substr(2, 9)}`
  ).current;

  // ICE servers configuration
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceTransportPolicy: "all",
    iceCandidatePoolSize: 10,
  };

  // Helper functions
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const showNotification = (message) => {
    // In a real app, you might use a toast notification system
    console.log("Notification:", message);
  };

  // Participant management
  const addParticipant = (id, name, joinTime = Date.now()) => {
    if (!participantsRef.current.has(id)) {
      const newParticipant = {
        id,
        name,
        isSpeaking: false,
        isScreenSharing: false,
        joinTime,
        leaveTime: null,
        totalSpeakingTime: 0,
      };

      participantsRef.current.set(id, newParticipant);
      // Update React state to trigger re-render
      setParticipants(Array.from(participantsRef.current.values()));
      showNotification(`${name} joined the room`);
    }
  };

  const removeParticipant = (id) => {
    const participant = participantsRef.current.get(id);
    if (participant) {
      participant.leaveTime = Date.now();
      participantsRef.current.set(id, participant);
  
      // Immediately remove from the UI
      participantsRef.current.delete(id);
      setParticipants(Array.from(participantsRef.current.values()));
  
      showNotification(`${participant.name} left the room`);
  
      // Optional: Keep in memory for 60 seconds if needed for other logic
      // (e.g., showing "recently left" status), but not in the UI
      setTimeout(() => {
        // Cleanup if needed, but UI is already updated
        console.log(`Participant ${id} fully removed after delay`);
      }, 60000);
    }
  };

  const updateParticipantSpeaking = (id, speaking) => {
    const participant = participantsRef.current.get(id);
    if (participant) {
      participant.isSpeaking = speaking;
      participantsRef.current.set(id, participant);
      setParticipants(Array.from(participantsRef.current.values()));
    }
  };

  // WebSocket and WebRTC functions
  const joinRoom = async () => {
    if (!roomId) {
      alert("Please enter a room ID");
      return;
    }

    setConnectionStatus("connecting");
    setIsHost(participantsRef.current.size === 0);

    // WebSocket connection
    wsRef.current = new WebSocket(
      `ws://localhost:8000/api/v1/websocket/${roomId}/${clientId}`
    );

    wsRef.current.onopen = () => {
      setConnectionStatus("connected");
      addParticipant(clientId, "You (Local)");
    };

    wsRef.current.onclose = () => {
      setConnectionStatus("disconnected");
      stopCall();
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    wsRef.current.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "offer":
          await handleOffer(message);
          break;
        case "answer":
          await handleAnswer(message);
          break;
        case "ice-candidate":
          await handleIceCandidate(message);
          break;
        case "disconnect":
          handleDisconnect(message);
          break;
        case "recording-started":
          handleRecordingStarted(message);
          break;
        case "recording-stopped":
          handleRecordingStopped(message);
          break;
        case "user-joined":
          handleUserJoined(message);
          break;
        case "user-speaking":
          handleUserSpeaking(message);
          break;
        case "users-list":
          handleUsersList(message);
          break;
        case "screen-share-started":
          handleScreenShareStarted(message);
          break;
        case "screen-share-stopped":
          handleScreenShareStopped(message);
          break;
        case "speak-request":
          if (isHost) {
            addPendingRequest(message.sender, message.timestamp);
          }
          break;
        case "speak-request-response":
          handleRequestResponse(message);
          break;
      }
    };
  };

  const handleUserJoined = (message) => {
    if (message.client_id !== clientId) {
      addParticipant(message.client_id, message.client_id);
    }
  };

  const handleUserSpeaking = (message) => {
    updateParticipantSpeaking(message.client_id, message.speaking);
  };

  const handleScreenShareStarted = (message) => {
    if (message.sender !== clientId) {
      const participant = participantsRef.current.get(message.sender);
      if (participant) {
        participant.isScreenSharing = true;
        participantsRef.current.set(message.sender, participant);
        setParticipants(Array.from(participantsRef.current.values()));
      }
      showNotification(`${message.sender} started screen sharing`);
    }
  };
  
  const handleScreenShareStopped = (message) => {
    if (message.sender !== clientId) {
      const participant = participantsRef.current.get(message.sender);
      if (participant) {
        participant.isScreenSharing = false;
        participantsRef.current.set(message.sender, participant);
        setParticipants(Array.from(participantsRef.current.values()));
      }
      if (screenShareStreamsRef.current.has(message.sender)) {
        screenShareStreamsRef.current.delete(message.sender);
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = null;
        }
      }
      showNotification(`${message.sender} stopped screen sharing`);
    }
  };

  const handleUsersList = (message) => {
    message.users.forEach((user) => {
      if (user.id !== clientId) {
        addParticipant(user.id, user.id);
      }
    });
  };

  const handleDisconnect = (message) => {
    const clientIdToRemove = message.client_id;
  
    if (peerConnectionsRef.current[clientIdToRemove]) {
      peerConnectionsRef.current[clientIdToRemove].close();
      delete peerConnectionsRef.current[clientIdToRemove];
      remoteStreamsRef.current.delete(clientIdToRemove);
    }
  
    if (screenSharePeerConnectionsRef.current[clientIdToRemove]) {
      screenSharePeerConnectionsRef.current[clientIdToRemove].close();
      delete screenSharePeerConnectionsRef.current[clientIdToRemove];
      screenShareStreamsRef.current.delete(clientIdToRemove);
      if (screenShareVideoRef.current && screenShareStreamsRef.current.size === 0) {
        screenShareVideoRef.current.srcObject = null;
      }
    }
  
    removeParticipant(clientIdToRemove);
  };

  // Call controls
  const startCall = async () => {
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
          latency: 0.01,
        },
      });

      setIsCallActive(true);
      detectSpeaking(localStreamRef.current, clientId);

      const offer = await createOffer();
      wsRef.current.send(
        JSON.stringify({
          type: "offer",
          offer: offer,
          sender: clientId,
        })
      );
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Error accessing microphone");
    }
  };

  const stopCall = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopRecording();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      stopScreenShare();
    }

    if (speechDetectionIntervalRef.current) {
      speechDetectionIntervalRef.current.stop();
      speechDetectionIntervalRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    Object.values(screenSharePeerConnectionsRef.current).forEach((pc) =>
      pc.close()
    );
    peerConnectionsRef.current = {};
    screenSharePeerConnectionsRef.current = {};
    remoteStreamsRef.current.clear();
    screenShareStreamsRef.current.clear();

    setIsCallActive(false);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    const newMutedState = !isMuted;
    audioTracks.forEach((track) => {
      track.enabled = !newMutedState;
    });
    setIsMuted(newMutedState);
    showNotification(newMutedState ? "Microphone muted" : "Microphone unmuted");
  };

  // Screen sharing
  const startScreenShare = async () => {
    try {
      screenStreamRef.current = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 15,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      // Immediately display for the streamer
      if (screenShareVideoRef.current) {
        screenShareVideoRef.current.srcObject = screenStreamRef.current;
        screenShareVideoRef.current
          .play()
          .catch((err) => console.error("Error playing local stream:", err));
      }
      setIsSharing(true);

      // Notify all participants and create peer connections for each
      wsRef.current.send(
        JSON.stringify({
          type: "screen-share-started",
          sender: clientId,
        })
      );

      // Create a peer connection for screen sharing
      const screenSharePeerConnection = new RTCPeerConnection(configuration);
      screenSharePeerConnectionsRef.current[clientId] =
        screenSharePeerConnection;

      screenStreamRef.current.getTracks().forEach((track) => {
        screenSharePeerConnection.addTrack(track, screenStreamRef.current);
      });

      screenSharePeerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              candidate: event.candidate,
              sender: clientId,
              streamType: "screen",
            })
          );
        }
      };

      const offer = await screenSharePeerConnection.createOffer();
      await screenSharePeerConnection.setLocalDescription(offer);

      wsRef.current.send(
        JSON.stringify({
          type: "offer",
          offer: offer,
          sender: clientId,
          streamType: "screen",
        })
      );

      screenStreamRef.current.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Error sharing screen:", error);
      setIsSharing(false);
      if (error.name !== "NotAllowedError") {
        alert("Could not share screen: " + error.message);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (screenSharePeerConnectionsRef.current[clientId]) {
      screenSharePeerConnectionsRef.current[clientId].close();
      delete screenSharePeerConnectionsRef.current[clientId];
    }

    if (screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = null;
    }

    setIsSharing(false);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "screen-share-stopped",
          sender: clientId,
        })
      );
    }
  };

  // Recording
  const startRecording = async () => {
    try {
      const combinedStream = new MediaStream();

      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          combinedStream.addTrack(track);
        });
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getVideoTracks().forEach((track) => {
          combinedStream.addTrack(track);
        });
      }

      const mimeType = screenStreamRef.current
        ? "video/webm;codecs=vp8,opus"
        : "audio/webm;codecs=opus";
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      const recordedChunks = []; // Store chunks locally for debugging

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data); // Save chunks for local verification
          const arrayBuffer = await event.data.arrayBuffer();
          const base64Data = btoa(
            String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
          );

          wsRef.current.send(
            JSON.stringify({
              type: screenStreamRef.current ? "video-data" : "audio-data",
              [screenStreamRef.current ? "video" : "audio"]: base64Data,
              mimeType: mediaRecorderRef.current.mimeType,
            })
          );
        }
      };

      // Ensure the file is finalized properly
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log("Recording Blob URL:", url); // For debugging: download and test this blob
      };

      setIsRecording(true);
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(formatDuration(elapsed));
      }, 1000);
      mediaRecorderRef.current.start(500);

      wsRef.current.send(
        JSON.stringify({
          type: "start-recording",
          mimeType: mediaRecorderRef.current.mimeType,
          isVideo: !!screenStreamRef.current,
        })
      );
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      setRecordingTime("00:00");

      wsRef.current.send(JSON.stringify({ type: "stop-recording" }));
    }
  };

  // WebRTC functions
  const createOffer = async () => {
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionsRef.current[clientId] = peerConnection;

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
            sender: clientId,
          })
        );
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
  };

  const handleOffer = async (message) => {
    const isScreenShare = message.streamType === 'screen';
    const peerConnection = new RTCPeerConnection(configuration);
  
    if (isScreenShare) {
      screenSharePeerConnectionsRef.current[message.sender] = peerConnection;
    } else {
      peerConnectionsRef.current[message.sender] = peerConnection;
    }
  
    if (!isScreenShare && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }
  
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (isScreenShare) {
        screenShareStreamsRef.current.set(message.sender, stream);
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
          screenShareVideoRef.current.play().catch(err => console.error('Error playing remote stream:', err));
        }
        setParticipants(prev => {
          const updated = prev.map(p => 
            p.id === message.sender ? { ...p, isScreenSharing: true } : p
          );
          return updated;
        });
      } else {
        remoteStreamsRef.current.set(message.sender, stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play().catch(err => console.error('Error playing audio:', err));
      }
    };
  
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
  
    wsRef.current.send(JSON.stringify({
      type: 'answer',
      answer: answer,
      sender: clientId,
      recipient: message.sender,
      streamType: isScreenShare ? 'screen' : 'audio'
    }));
  };

  const handleAnswer = async (message) => {
    const isScreenShare = message.streamType === "screen";
    const peerConnection = isScreenShare
      ? screenSharePeerConnectionsRef.current[clientId]
      : peerConnectionsRef.current[clientId];

    if (peerConnection) {
      await peerConnection.setRemoteDescription(message.answer);
    }
  };

  const handleIceCandidate = async (message) => {
    const isScreenShare = message.streamType === "screen";
    const peerConnection = isScreenShare
      ? screenSharePeerConnectionsRef.current[message.sender]
      : peerConnectionsRef.current[message.sender];

    if (peerConnection) {
      await peerConnection.addIceCandidate(message.candidate);
    }
  };

  // Speaker request system
  const requestToSpeak = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "request-to-speak",
          timestamp: Date.now(),
        })
      );

      setSpeakerRequestStatus("pending");
    }
  };

  const approveRequest = () => {
    const requests = Array.from(pendingRequestsRef.current.values());
    if (requests.length > 0) {
      const [firstRequest] = requests;
      wsRef.current.send(
        JSON.stringify({
          type: "respond-to-request",
          action: "approve",
          requester_id: firstRequest.id,
          timestamp: Date.now(),
        })
      );
      pendingRequestsRef.current.delete(firstRequest.id);
    }
  };

  const declineRequest = () => {
    const requests = Array.from(pendingRequestsRef.current.values());
    if (requests.length > 0) {
      const [firstRequest] = requests;
      wsRef.current.send(
        JSON.stringify({
          type: "respond-to-request",
          action: "decline",
          requester_id: firstRequest.id,
          timestamp: Date.now(),
        })
      );
      pendingRequestsRef.current.delete(firstRequest.id);
    }
  };

  const addPendingRequest = (userId, timestamp) => {
    if (!pendingRequestsRef.current.has(userId)) {
      const request = { id: userId, timestamp };
      pendingRequestsRef.current.set(userId, request);
    }
  };

  const handleRequestResponse = (message) => {
    pendingRequestsRef.current.delete(message.requester_id);

    if (message.requester_id === clientId) {
      if (message.action === "approve") {
        setSpeakerRequestStatus("approved");
        if (!localStreamRef.current) {
          startCall();
        }
      } else {
        setSpeakerRequestStatus("declined");
      }

      setTimeout(() => {
        setSpeakerRequestStatus(null);
      }, 5000);
    }
  };

  // Speech detection
  const detectSpeaking = (stream, userId) => {
    if (!stream) return null;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let speaking = false;
    let speakingStart = null;

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      const isSpeakingNow = average > 15;

      if (isSpeakingNow !== speaking) {
        speaking = isSpeakingNow;
        updateParticipantSpeaking(userId, speaking);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "speech-event",
              speaking: speaking,
              sender: userId,
              timestamp: Date.now(),
              speakingStart: speakingStart,
            })
          );
        }
      }
    };

    const intervalId = setInterval(checkAudioLevel, 300);
    speechDetectionIntervalRef.current = {
      stop: () => {
        clearInterval(intervalId);
        audioContext.close();
      },
    };

    return speechDetectionIntervalRef.current;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopCall();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Render
  const pendingRequests = Array.from(pendingRequestsRef.current.values());

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      {/* Connection Status Bar */}
      <div className="w-full max-w-4xl flex justify-between items-center p-2 bg-white rounded-lg shadow">
        <h1 className="text-xl font-bold text-blue-600">
          Live Voice & Screen Sharing
        </h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500 animate-pulse"
                : connectionStatus === "connecting"
                ? "bg-yellow-500"
                : "bg-gray-500"
            }`}
          />
          <span className="text-sm capitalize">{connectionStatus}</span>
          {isRecording && (
            <div className="flex items-center gap-2 ml-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm">Recording</span>
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {recordingTime}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Connection Section */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Connection
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID"
                    className="flex-1 border rounded p-2 text-sm"
                  />
                  <Button
                    onClick={joinRoom}
                    disabled={connectionStatus !== "disconnected"}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Room
                  </Button>
                </div>
              </div>

              {/* Speaker Request Section */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Speaker Request
                </h3>
                <div className="flex gap-2">
                  {!isHost && (
                    <Button
                      variant="outline"
                      onClick={requestToSpeak}
                      disabled={speakerRequestStatus !== null || !isCallActive}
                    >
                      Request to Speak
                    </Button>
                  )}
                  {isHost && (
                    <>
                      <Button
                        variant="outline"
                        className="text-green-600"
                        onClick={approveRequest}
                        disabled={pendingRequests.length === 0}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600"
                        onClick={declineRequest}
                        disabled={pendingRequests.length === 0}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                    </>
                  )}
                </div>
                {speakerRequestStatus && (
                  <div
                    className={`flex items-center text-sm ${
                      speakerRequestStatus === "pending"
                        ? "text-yellow-600"
                        : speakerRequestStatus === "approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <CircleDot className="mr-2 h-4 w-4 animate-pulse" />
                    {speakerRequestStatus === "pending" && "Request sent"}
                    {speakerRequestStatus === "approved" &&
                      "Request approved - you can now speak"}
                    {speakerRequestStatus === "declined" && "Request declined"}
                  </div>
                )}
              </div>

              {/* Call Controls Section */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call Controls
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant={isCallActive ? "default" : "outline"}
                    onClick={isCallActive ? stopCall : startCall}
                    disabled={connectionStatus !== "connected"}
                  >
                    {isCallActive ? (
                      <PhoneOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Phone className="mr-2 h-4 w-4" />
                    )}
                    {isCallActive ? "End Call" : "Start Call"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleMute}
                    disabled={!isCallActive}
                  >
                    {isMuted ? (
                      <MicOff className="mr-2 h-4 w-4" />
                    ) : (
                      <Mic className="mr-2 h-4 w-4" />
                    )}
                    {isMuted ? "Unmute" : "Mute"}
                  </Button>
                </div>
              </div>

              {/* Screen Sharing Section */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <ScreenShare className="w-4 h-4" />
                  Screen Sharing
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={startScreenShare}
                    disabled={isSharing || !isCallActive}
                  >
                    <ScreenShare className="mr-2 h-4 w-4" />
                    Share Screen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopScreenShare}
                    disabled={!isSharing}
                  >
                    <MonitorOff className="mr-2 h-4 w-4" />
                    Stop Sharing
                  </Button>
                </div>
              </div>

              {/* Recording Section (Host Only) */}
              {isHost && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Circle className="w-4 h-4" />
                    Recording
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={startRecording}
                      disabled={isRecording || !isCallActive}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Record
                    </Button>
                    <Button
                      variant="outline"
                      onClick={stopRecording}
                      disabled={!isRecording}
                    >
                      <StopCircle className="mr-2 h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Screen Share Preview */}
          {(isSharing || participants.some((p) => p.isScreenSharing)) && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Screen Share</h3>
                <div className="w-full bg-black rounded aspect-video flex items-center justify-center">
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Participants Panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Participants ({participants.length})
              </h3>

              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`flex items-center p-2 rounded ${
                      participant.isSpeaking
                        ? "border-l-4 border-green-500 bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                      {participant.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-xs text-gray-500">
                        Joined:{" "}
                        {new Date(participant.joinTime).toLocaleTimeString()}
                      </div>
                    </div>
                    {participant.isSpeaking && (
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                ))}
              </div>

              {/* Pending Requests (Host Only) */}
              {isHost && pendingRequests.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">
                    Pending Speaker Requests
                  </h4>
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center p-2 rounded bg-yellow-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center mr-2">
                        {request.id.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{request.id}</div>
                        <div className="text-xs text-gray-500">
                          Requested:{" "}
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}