import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Mic,
  MicOff,
  ScreenShare,
  Video,
  UserPlus,
  Check,
  X,
  CircleDot,
  Hand,
  MessageSquare,
} from "lucide-react";

const ROOM_ID = "33aa041b-500e-4b32-af0e-91a28ec7dd13";

// Utility function to get cookie value by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function PodcastLive() {
  // State variables
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Add these new state variables inside the PodcastLive component
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [speakerRequestStatus, setSpeakerRequestStatus] = useState(null); // null | 'pending' | 'approved' | 'declined'
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isHost, setIsHost] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [clientId, setClientId] = useState(null);

  // Refs for WebRTC and media streams
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const speechDetectionIntervalRef = useRef(null);

  // Data structures
  const peerConnectionsRef = useRef({});
  const screenSharePeerConnectionsRef = useRef({});
  const participantsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const screenShareStreamsRef = useRef(new Map());

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

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

  // Fetch user data to get CLIENT_ID
  const fetchUserData = async () => {
    const authToken = getCookie("auth_token");
    if (!authToken) {
      console.error("No auth_token found in cookies");
      return null;
    }
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("User data:", data);
      return data.id;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
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
    console.log("Notification:", message);
  };

  // Participant management
  const addParticipant = (
    id,
    name,
    joinTime = Date.now(),
    isHost = false,
    isSpeaker = false
  ) => {
    if (!participantsRef.current.has(id)) {
      const newParticipant = {
        id,
        name,
        isSpeaking: false,
        isScreenSharing: false,
        joinTime,
        leaveTime: null,
        totalSpeakingTime: 0,
        isHost,
        isSpeaker,
      };
      participantsRef.current.set(id, newParticipant);
      setParticipants(Array.from(participantsRef.current.values()));
      showNotification(`${name} joined the room`);
    }
  };

  const removeParticipant = (id) => {
    const participant = participantsRef.current.get(id);
    if (participant) {
      participant.leaveTime = Date.now();
      participantsRef.current.set(id, participant);
      participantsRef.current.delete(id);
      setParticipants(Array.from(participantsRef.current.values()));
      showNotification(`${participant.name} left the room`);
      setTimeout(() => {
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

  // Fetch episode data
  const fetchEpisode = async () => {
    if (!clientId) {
      console.error("No client ID available");
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/episodes/${ROOM_ID}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Episode data:", data);
      if (data.creator_id === clientId) {
        setIsHost(true);
      }
    } catch (error) {
      console.error("Error fetching episode:", error);
    }
  };

  // WebSocket and WebRTC functions
  const joinRoom = async () => {
    if (!clientId) {
      console.error("Cannot join room: No client ID available");
      return;
    }
    setConnectionStatus("connecting");
    wsRef.current = new WebSocket(
      `ws://localhost:8000/api/v1/websocket/${ROOM_ID}/${clientId}`
    );

    wsRef.current.onopen = () => {
      setConnectionStatus("connected");
      addParticipant(clientId, "You (Local)", Date.now(), isHost, isHost);
      wsRef.current.send(
        JSON.stringify({
          type: "user-joined",
          client_id: clientId,
          isHost: isHost,
          isSpeaker: isHost,
        })
      );
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
        case "speaker-request":
          console.log("Speaker request received:", message);
          if (isHost) {
            setPendingRequests((prev) => [
              ...prev,
              {
                id: message.sender,
                timestamp: message.timestamp,
              },
            ]);
          }
          break;
        case "speaker-request-response":
          if (message.recipient === clientId) {
            setSpeakerRequestStatus(message.approved ? "approved" : "declined");
            if (message.approved) {
              setIsSpeaker(true);
              // Enable audio tracks when promoted to speaker
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((track) => {
                  track.enabled = !isMuted;
                });
              }
            }
          }
          break;
        case "revoke-speaker":
          if (message.recipient === clientId) {
            setIsSpeaker(false);
            // Disable audio tracks when demoted
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
            }
          }
          break;
        case "chat-message":
          setChatMessages((prev) => [
            ...prev,
            {
              sender: message.message.sender,
              content: message.message.content,
              timestamp: message.message.timestamp,
            },
          ]);
          break;
      }
    };
  };

  const handleUserJoined = (message) => {
    if (message.client_id !== clientId) {
      addParticipant(
        message.client_id,
        message.client_id,
        Date.now(),
        message.isHost || false,
        message.isSpeaker || false
      );
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
      if (
        screenShareVideoRef.current &&
        screenShareStreamsRef.current.size === 0
      ) {
        screenShareVideoRef.current.srcObject = null;
      }
    }
    removeParticipant(clientIdToRemove);
  };

  // Call controls
  const startCall = async () => {
    if (!clientId) {
      console.error("Cannot start call: No client ID available");
      return;
    }
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
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
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
    setIsMuted(true);
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
    if (!clientId) {
      console.error("Cannot start screen share: No client ID available");
      return;
    }
    try {
      screenStreamRef.current = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 15,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      if (screenShareVideoRef.current) {
        screenShareVideoRef.current.srcObject = screenStreamRef.current;
        screenShareVideoRef.current
          .play()
          .catch((err) => console.error("Error playing local stream:", err));
      }
      setIsSharing(true);
      wsRef.current.send(
        JSON.stringify({
          type: "screen-share-started",
          sender: clientId,
        })
      );
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
  // Add these new functions inside the PodcastLive component
  const requestToSpeak = () => {
    if (!wsRef.current || !clientId) return;

    const timestamp = Date.now();
    wsRef.current.send(
      JSON.stringify({
        type: "speaker-request",
        sender: clientId,
        timestamp: timestamp,
      })
    );

    setSpeakerRequestStatus("pending");
  };

  const approveRequest = (requesterId) => {
    if (!wsRef.current || !isHost) return;

    const timestamp = Date.now();
    wsRef.current.send(
      JSON.stringify({
        type: "speaker-request-response",
        approved: true,
        recipient: requesterId,
        sender: clientId,
        timestamp: timestamp,
      })
    );

    setPendingRequests((prev) => prev.filter((req) => req.id !== requesterId));
  };

  const declineRequest = (requesterId) => {
    if (!wsRef.current || !isHost) return;

    const timestamp = Date.now();
    wsRef.current.send(
      JSON.stringify({
        type: "speaker-request-response",
        approved: false,
        recipient: requesterId,
        sender: clientId,
        timestamp: timestamp,
      })
    );

    setPendingRequests((prev) => prev.filter((req) => req.id !== requesterId));
  };

  const demoteSpeaker = (speakerId) => {
    if (!wsRef.current || !isHost) return;

    const timestamp = Date.now();
    wsRef.current.send(
      JSON.stringify({
        type: "revoke-speaker",
        recipient: speakerId,
        sender: clientId,
        timestamp: timestamp,
      })
    );

    setParticipants((prev) =>
      prev.map((p) => (p.id === speakerId ? { ...p, isSpeaker: false } : p))
    );
  };

  // Recording
  const startRecording = async () => {
    if (!clientId) {
      console.error("Cannot start recording: No client ID available");
      return;
    }
    try {
      // Create a new audio context
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Create audio sources for all remote streams and connect them to destination
      remoteStreamsRef.current.forEach((remoteStream) => {
        if (remoteStream.getAudioTracks().length > 0) {
          const remoteSource =
            audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(destination);
          console.log("Added remote stream to recording");
        }
      });

      // Add local audio stream if it exists
      if (
        localStreamRef.current &&
        localStreamRef.current.getAudioTracks().length > 0
      ) {
        const localSource = audioContext.createMediaStreamSource(
          localStreamRef.current
        );
        localSource.connect(destination);
        console.log("Added local stream to recording");
      }

      // Create the final media stream
      const combinedStream = new MediaStream();

      // Add all audio tracks from the destination
      destination.stream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
        console.log("Added audio track to combined stream");
      });

      // Add screen share video if it exists
      if (
        screenStreamRef.current &&
        screenStreamRef.current.getVideoTracks().length > 0
      ) {
        screenStreamRef.current.getVideoTracks().forEach((track) => {
          combinedStream.addTrack(track);
          console.log("Added video track to combined stream");
        });
      }

      // Log stream information
      console.log("Combined stream tracks:", combinedStream.getTracks().length);
      console.log("Audio tracks:", combinedStream.getAudioTracks().length);
      console.log("Video tracks:", combinedStream.getVideoTracks().length);

      const mimeType = screenStreamRef.current
        ? "video/webm;codecs=vp8,opus"
        : "audio/webm;codecs=opus";

      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000,
      });

      const recordedChunks = [];
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          // Optional: Send chunks to server
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

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        console.log("Recording finished, blob URL:", url);

        // Download the recording
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        a.click();
      };

      // Start recording
      setIsRecording(true);
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingTime(formatDuration(elapsed));
      }, 1000);

      mediaRecorderRef.current.start(500);
      console.log("Recording started");
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
      setIsRecording(false);
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

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      remoteStreamsRef.current.set(clientId, stream);
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play().catch((err) => console.error("Error playing audio:", err));
    };

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

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    });

    await peerConnection.setLocalDescription(offer);
    return offer;
  };

  // Modify the handleOffer function
  const handleOffer = async (message) => {
    const isScreenShare = message.streamType === "screen";
    const peerConnection = new RTCPeerConnection(configuration);

    if (isScreenShare) {
      screenSharePeerConnectionsRef.current[message.sender] = peerConnection;
    } else {
      peerConnectionsRef.current[message.sender] = peerConnection;
    }

    // Add local stream tracks if not screen share
    if (!isScreenShare && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (isScreenShare) {
        screenShareStreamsRef.current.set(message.sender, stream);
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
          screenShareVideoRef.current
            .play()
            .catch((err) => console.error("Error playing remote stream:", err));
        }
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === message.sender ? { ...p, isScreenSharing: true } : p
          )
        );
      } else {
        remoteStreamsRef.current.set(message.sender, stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play().catch((err) => console.error("Error playing audio:", err));
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
            sender: clientId,
            recipient: message.sender,
            streamType: isScreenShare ? "screen" : "audio",
          })
        );
      }
    };

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.offer)
    );

    const answer = await peerConnection.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: isScreenShare,
    });

    await peerConnection.setLocalDescription(answer);

    wsRef.current.send(
      JSON.stringify({
        type: "answer",
        answer: answer,
        sender: clientId,
        recipient: message.sender,
        streamType: isScreenShare ? "screen" : "audio",
      })
    );
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

  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current || !clientId) return;

    const message = {
      type: "chat-message",
      sender: clientId,
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    wsRef.current.send(JSON.stringify(message));
    setChatInput("");
  };

  // 1. Initialize clientId only once on mount
  useEffect(() => {
    const initialize = async () => {
      const id = await fetchUserData();
      if (id) setClientId(id);
    };
    initialize();
  }, []); // Empty dependency array - runs once on mount

  // 2. When clientId is set, fetch episode data
  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      await fetchEpisode();
    };
    fetchData();
  }, [clientId]); // Runs only when clientId changes

  // 3. When isHost is determined, join room and start call
  useEffect(() => {
    if (isHost === !clientId) return; // Wait until we know host status

    const setupCall = async () => {
      console.log("Joining room as host:", isHost);
      await joinRoom();
      console.log("Starting call as host:", isHost);
      await startCall();
    };
    setupCall();

    // Add cleanup function
    return () => {
      console.log("Cleaning up WebSocket and media connections");
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: "disconnect",
            client_id: clientId,
          })
        );
        wsRef.current.close();
        wsRef.current = null;
      }
      stopCall(); // This will clean up media streams and peer connections
    };
  }, [clientId, isHost]); // Runs when either changes

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="flex flex-col items-center p-4 min-h-screen">
      {/* Header moved to top center */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Live Voice & Screen Sharing</h1>
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

      {/* Main content centered */}
      <div
        className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6"
        style={{ height: "calc(100vh - 220px)" }} // Adjusted height calculation
      >
        {/* Combined Participants and Controls section - takes 2/3 width on md+ screens */}
        <Card className="md:col-span-2">
          <CardContent className="p-6 flex flex-col h-full">
            {/* Screen Share section - displayed above Participants if active */}
            {(isSharing || participants.some((p) => p.isScreenSharing)) && (
              <div className="mb-6">
                <div className="w-full bg-black rounded aspect-video flex items-center justify-center">
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="flex-1">
              <h3 className="font-semibold flex items-center gap-2 mb-6 text-lg">
                <UserPlus className="w-5 h-5" />
                Participants ({participants.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-medium bg-gray-500`}
                      >
                        {participant.name.charAt(0)}
                      </div>
                      {participant.isSpeaking && (
                        <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-pulse" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {participant.name}
                        {participant.id === clientId && " (You)"}
                      </div>
                      <div className="text-xs text-gray-500 flex flex-col items-center gap-1 mt-1">
                        {participant.isHost && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                            Host
                          </span>
                        )}
                        {participant.isSpeaker && !participant.isHost && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded">
                            Speaker
                          </span>
                        )}
                      </div>
                    </div>
                    {isHost && !participant.isHost && participant.isSpeaker && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          wsRef.current.send(
                            JSON.stringify({
                              type: "revoke-speaker",
                              recipient: participant.id,
                              sender: clientId,
                            })
                          );
                        }}
                      >
                        <MicOff className="h-4 w-4" />
                      </Button>
                    )}
                    {isHost &&
                      !participant.isHost &&
                      !participant.isSpeaker &&
                      pendingRequests.some(
                        (req) => req.id === participant.id
                      ) && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500 hover:text-green-700"
                            onClick={() => approveRequest(participant.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => declineRequest(participant.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* Control Buttons - Centered at the bottom */}
            <div className="mt-6 flex justify-center gap-4 flex-wrap">
              {!isHost && (
                <div className="flex flex-col items-center space-y-2">
                  <Button
                    variant="outline"
                    onClick={requestToSpeak}
                    disabled={speakerRequestStatus !== null || !isCallActive}
                    className={`rounded-full w-12 h-12 flex items-center justify-center p-0 ${
                      speakerRequestStatus === "pending"
                        ? "text-yellow-500"
                        : speakerRequestStatus === "approved"
                        ? "text-green-500"
                        : "text-gray-500"
                    }`}
                  >
                    <Hand className="h-6 w-6" />
                  </Button>
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
                      {speakerRequestStatus === "declined" &&
                        "Request declined"}
                    </div>
                  )}
                </div>
              )}

              {(isHost || isSpeaker) && (
                <>
                  {/* Audio Toggle */}
                  <Button
                    variant="outline"
                    onClick={toggleMute}
                    disabled={!isCallActive}
                    className={`rounded-full w-12 h-12 flex items-center justify-center p-0 ${
                      isMuted ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>

                  {/* Screen Share Toggle */}
                  <Button
                    variant="outline"
                    onClick={isSharing ? stopScreenShare : startScreenShare}
                    disabled={!isCallActive}
                    className={`rounded-full w-12 h-12 flex items-center justify-center p-0 ${
                      isSharing ? "text-green-500" : "text-gray-500"
                    }`}
                  >
                    <ScreenShare className="h-6 w-6" />
                  </Button>

                  {/* Recording Toggle (Host only) */}
                  {isHost && (
                    <Button
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!isCallActive}
                      className={`rounded-full w-12 h-12 flex items-center justify-center p-0 ${
                        isRecording ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      <Video className="h-6 w-6" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat section */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col h-full">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              Live Chat
            </h3>
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto mb-4 space-y-2"
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`text-sm ${
                    msg.sender === clientId ? "text-right" : "text-left"
                  }`}
                >
                  <span className="font-medium">
                    {msg.sender === clientId ? "You" : msg.sender}:
                  </span>{" "}
                  <span>{msg.content}</span>
                  <div className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            {/* Chat input fixed to bottom */}
            <div className="mt-auto flex gap-2 w-full">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded h-10"
                disabled={!isCallActive}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={sendChatMessage}
                disabled={!isCallActive || !chatInput.trim()}
                className="w-10 h-10 flex items-center justify-center"
              >
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
                  className="lucide lucide-send"
                >
                  <path d="m22 2-20 20" />
                  <path d="M22 2 12 22 2 12" />
                </svg>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
