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
  const [isHost, setIsHost] = useState(false);
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

    wsRef.current.send(
      JSON.stringify({
        type: "speaker-request",
        sender: clientId,
        timestamp: Date.now(),
      })
    );

    setSpeakerRequestStatus("pending");
  };

  const approveRequest = (requesterId) => {
    if (!wsRef.current || !isHost) return;

    wsRef.current.send(
      JSON.stringify({
        type: "speaker-request-response",
        approved: true,
        recipient: requesterId,
        sender: clientId,
      })
    );

    setPendingRequests((prev) => prev.filter((req) => req.id !== requesterId));
  };

  const declineRequest = (requesterId) => {
    if (!wsRef.current || !isHost) return;

    wsRef.current.send(
      JSON.stringify({
        type: "speaker-request-response",
        approved: false,
        recipient: requesterId,
        sender: clientId,
      })
    );

    setPendingRequests((prev) => prev.filter((req) => req.id !== requesterId));
  };

  const demoteSpeaker = (speakerId) => {
    if (!wsRef.current || !isHost) return;
  
    wsRef.current.send(
      JSON.stringify({
        type: "revoke-speaker",
        recipient: speakerId,
        sender: clientId,
      })
    );
  
    // Update local state to reflect the change
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === speakerId ? { ...p, isSpeaker: false } : p
      )
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
    if (isHost === null || !clientId) return; // Wait until we know host status

    const setupCall = async () => {
      console.log("Joining room as host:", isHost);
      await joinRoom();
      console.log("Starting call as host:", isHost);
      await startCall();
    };
    setupCall();
  }, [clientId, isHost]); // Runs when either changes

  return (
    <div className="flex flex-col items-center p-4 gap-4">
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
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                {!isHost && (
                  <>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Speaker Request
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={requestToSpeak}
                        disabled={
                          speakerRequestStatus !== null || !isCallActive
                        }
                      >
                        Request to Speak
                      </Button>
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
                        {speakerRequestStatus === "declined" &&
                          "Request declined"}
                      </div>
                    )}
                  </>
                )}
              </div>

              {(isHost || isSpeaker) && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call Controls
                  </h3>
                  <div className="flex gap-2">
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
              )}

              {(isHost || isSpeaker) && (
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
              )}

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

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Participants ({participants.length})
                </h3>

                {/* Combined Participants Section */}
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
                      <div
                        className={`w-8 h-8 rounded-full ${
                          participant.isHost || participant.isSpeaker
                            ? "bg-blue-600"
                            : "bg-gray-500"
                        } text-white flex items-center justify-center mr-2`}
                      >
                        {participant.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {participant.name}
                          {participant.id === clientId && " (You)"}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
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
                      {participant.isSpeaking && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                      {isHost &&
                        !participant.isHost &&
                        participant.isSpeaker && (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}