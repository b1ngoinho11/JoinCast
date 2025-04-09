import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  ScreenShare,
  Text,
  UserPlus,
  Check,
  X,
  Hand,
  MessageSquare,
  ArrowDown,
} from "lucide-react";
import api from "../services/api";

export default function PodcastLive() {
  const { id } = useParams();

  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [isCallActive, setIsCallActive] = useState(false);
  const [episodeName, setEpisodeName] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [speakerRequestStatus, setSpeakerRequestStatus] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isHost, setIsHost] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [userCache, setUserCache] = useState(new Map()); // Cache for user data

  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const speechDetectionIntervalRef = useRef(null);

  const peerConnectionsRef = useRef({});
  const screenSharePeerConnectionsRef = useRef({});
  const participantsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const screenShareStreamsRef = useRef(new Map());

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatContainerRef = useRef(null);

  const navigate = useNavigate();

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
    iceTransportPolicy: "all",
    iceCandidatePoolSize: 10,
  };

  // Fetch user data by ID
  const fetchUserDataById = async (userId) => {
    if (userCache.has(userId)) {
      return userCache.get(userId);
    }
    try {
      const response = await api.get(`/api/v1/users/${userId}`);
      const userData = response.data;
      setUserCache((prev) => new Map(prev).set(userId, userData));
      return userData;
    } catch (error) {
      console.error(`Error fetching user data for ${userId}:`, error);
      return { id: userId, username: userId }; // Fallback to ID if fetch fails
    }
  };

  // Fetch current user's data
  const fetchUserData = async () => {
    try {
      const response = await api.get("/api/v1/auth/me");
      console.log("User data:", response.data);
      setUserCache((prev) =>
        new Map(prev).set(response.data.id, response.data)
      );
      return response.data.id;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

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

  const addParticipant = async (
    id,
    joinTime = Date.now(),
    isHost = false,
    isSpeaker = false
  ) => {
    const userData = await fetchUserDataById(id);
    const name = userData.username || id; // Use username, fallback to ID
    const existingParticipant = participantsRef.current.get(id);
    if (existingParticipant) {
      existingParticipant.name = name;
      existingParticipant.isHost = isHost;
      existingParticipant.isSpeaker = isHost ? true : isSpeaker;
      participantsRef.current.set(id, existingParticipant);
    } else {
      const newParticipant = {
        id,
        name,
        isSpeaking: false,
        isScreenSharing: false,
        joinTime,
        leaveTime: null,
        totalSpeakingTime: 0,
        isHost,
        isSpeaker: isHost ? true : isSpeaker,
        profilePicture: userData.profile_picture,
      };
      participantsRef.current.set(id, newParticipant);
      showNotification(`${name} joined the room`);
    }
    setParticipants(Array.from(participantsRef.current.values()));
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

  const fetchEpisode = async () => {
    if (!clientId || !id) {
      console.error("No client ID or room ID available");
      return;
    }
    try {
      const response = await api.get(`/api/v1/episodes/${id}`);
      console.log("Episode data:", response.data);
      if (response.data.creator_id === clientId) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }
      setEpisodeName(response.data.name || "Untitled Episode");
    } catch (error) {
      console.error("Error fetching episode:", error);
    }
  };

  const joinRoom = async () => {
    if (!clientId || !id) {
      console.error("Cannot join room: No client ID or room ID available");
      return;
    }

    if (isHost === null) {
      await new Promise((resolve) => {
        const checkHost = setInterval(() => {
          if (isHost !== null) {
            clearInterval(checkHost);
            resolve();
          }
        }, 100);
      });
    }

    setConnectionStatus("connecting");
    wsRef.current = new WebSocket(
      `ws://localhost:8000/api/v1/websocket/${id}/${clientId}`
    );

    wsRef.current.onopen = async () => {
      setConnectionStatus("connected");
      await addParticipant(clientId, Date.now(), isHost, isHost);
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
        case "temp-recording-created":
          showNotification(`Temporary recording saved: ${message.filename}`);
          break;
        case "temp-recording-error":
          showNotification(`Error: ${message.message}`);
          break;
        case "user-joined":
          await handleUserJoined(message);
          break;
        case "user-speaking":
          handleUserSpeaking(message);
          break;
        case "users-list":
          await handleUsersList(message);
          break;
        case "screen-share-started":
          console.log(`Screen share started by ${message.sender}`);
          handleScreenShareStarted(message);
          break;
        case "screen-share-stopped":
          handleScreenShareStopped(message);
          break;
        case "request-screen-share-offer":
          if (message.recipient === clientId && isSharing) {
            console.log(
              `Received request-screen-share-offer from ${message.sender}`
            );
            if (!screenStreamRef.current) {
              console.error("No screen stream available to share");
              return;
            }
            const screenSharePeerConnection = new RTCPeerConnection(
              configuration
            );
            screenSharePeerConnectionsRef.current[message.sender] =
              screenSharePeerConnection;
            console.log(
              `Adding tracks to peer connection for ${message.sender}`
            );
            screenStreamRef.current.getTracks().forEach((track) => {
              console.log(
                `Adding track: ${track.kind}, enabled: ${track.enabled}`
              );
              screenSharePeerConnection.addTrack(
                track,
                screenStreamRef.current
              );
            });
            screenSharePeerConnection.onicecandidate = (event) => {
              if (event.candidate) {
                console.log(`Sending ICE candidate to ${message.sender}`);
                wsRef.current.send(
                  JSON.stringify({
                    type: "ice-candidate",
                    candidate: event.candidate,
                    sender: clientId,
                    recipient: message.sender,
                    streamType: "screen",
                  })
                );
              }
            };
            screenSharePeerConnection.onconnectionstatechange = () => {
              console.log(
                `Screen share connection state for ${message.sender}: ${screenSharePeerConnection.connectionState}`
              );
            };
            const offer = await screenSharePeerConnection.createOffer();
            await screenSharePeerConnection.setLocalDescription(offer);
            console.log(`Sending offer to ${message.sender}`);
            wsRef.current.send(
              JSON.stringify({
                type: "offer",
                offer: offer,
                sender: clientId,
                recipient: message.sender,
                streamType: "screen",
              })
            );
          }
          break;
        case "speaker-request":
          console.log("Speaker request received:", message);
          if (isHost) {
            setPendingRequests((prev) => [
              ...prev,
              { id: message.sender, timestamp: message.timestamp },
            ]);
          }
          break;
        case "revoke-speaker":
          if (message.recipient === clientId) {
            setIsSpeaker(false);
            setSpeakerRequestStatus(null); // Reset the request status
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
            }
            const participant = participantsRef.current.get(clientId);
            if (participant) {
              participant.isSpeaker = false;
              participantsRef.current.set(clientId, participant);
              setParticipants(Array.from(participantsRef.current.values()));
            }
          }
          break;
        case "speaker-request-response":
          if (message.recipient === clientId) {
            setSpeakerRequestStatus(message.approved ? "approved" : "declined");
            if (message.approved) {
              setIsSpeaker(true);
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((track) => {
                  track.enabled = !isMuted;
                });
              }
              const participant = participantsRef.current.get(clientId);
              if (participant) {
                participant.isSpeaker = true;
                participantsRef.current.set(clientId, participant);
                setParticipants(Array.from(participantsRef.current.values()));
              }
            } else {
              setSpeakerRequestStatus(null);
            }
          }
          if (isHost && message.approved) {
            const participant = participantsRef.current.get(message.recipient);
            if (participant) {
              participant.isSpeaker = true;
              participantsRef.current.set(message.recipient, participant);
              setParticipants(Array.from(participantsRef.current.values()));
            }
          }
          break;
        case "user-status-update":
          const participant = participantsRef.current.get(message.client_id);
          if (participant) {
            participant.isSpeaker = message.is_speaker;
            participantsRef.current.set(message.client_id, participant);
            setParticipants(Array.from(participantsRef.current.values()));
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
        case "live-ended":
          showNotification("Live session ended by host");
          stopCall();
          navigate("/");
          break;
      }
    };
  };

  const handleUserJoined = async (message) => {
    if (message.client_id !== clientId) {
      await addParticipant(
        message.client_id,
        Date.now(),
        message.is_host || false,
        message.is_host ? true : message.is_speaker || false
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
      // Request an offer from the screen sharer
      requestScreenShareOffer(message.sender);
    }
  };

  const requestScreenShareOffer = (screenSharerId) => {
    if (!wsRef.current || !clientId) {
      console.error(
        "Cannot request screen-share offer: WebSocket or client ID missing"
      );
      return;
    }
    console.log(`Sending request-screen-share-offer to ${screenSharerId}`);
    wsRef.current.send(
      JSON.stringify({
        type: "request-screen-share-offer",
        sender: clientId,
        recipient: screenSharerId,
        timestamp: Date.now(),
      })
    );
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
      showNotification(`${participant.name} stopped screen sharing`);
    }
  };

  const handleUsersList = async (message) => {
    console.log("Received users-list:", message.users);
    for (const user of message.users) {
      if (user.id !== clientId) {
        await addParticipant(
          user.id,
          Date.now(),
          user.is_host || false,
          user.is_speaker || user.is_host || false
        );
        const participant = participantsRef.current.get(user.id);
        if (participant) {
          participant.isScreenSharing = user.is_screen_sharing || false;
          participantsRef.current.set(user.id, participant);
        }
      }
    }
    setParticipants(Array.from(participantsRef.current.values()));
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
      console.log("Sending start-screen-share message");
      wsRef.current.send(
        JSON.stringify({
          type: "start-screen-share",
          sender: clientId,
          mimeType: "video/webm",
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
      const sendOffer = async () => {
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
      };
      await sendOffer();
      // Periodically send new offers to ensure late joiners receive one
      const offerInterval = setInterval(sendOffer, 10000); // Every 10 seconds
      screenStreamRef.current.getVideoTracks()[0].onended = () => {
        clearInterval(offerInterval);
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
    const participant = participantsRef.current.get(requesterId);
    if (participant) {
      participant.isSpeaker = true;
      participantsRef.current.set(requesterId, participant);
      setParticipants(Array.from(participantsRef.current.values()));
    }
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
    // Reset request status if it's the current user being declined
    if (requesterId === clientId) {
      setSpeakerRequestStatus("declined");
    }
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
    // Reset request status if it's the current user being demoted
    if (speakerId === clientId) {
      setSpeakerRequestStatus(null);
    }
    setParticipants((prev) =>
      prev.map((p) => (p.id === speakerId ? { ...p, isSpeaker: false } : p))
    );
  };

  const startRecording = async () => {
    if (!clientId) {
      console.error("Cannot start recording: No client ID available");
      return;
    }
    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      remoteStreamsRef.current.forEach((remoteStream) => {
        if (remoteStream.getAudioTracks().length > 0) {
          const remoteSource =
            audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(destination);
          console.log("Added remote stream to recording");
        }
      });
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
      const combinedStream = new MediaStream();
      destination.stream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
        console.log("Added audio track to combined stream");
      });
      if (
        screenStreamRef.current &&
        screenStreamRef.current.getVideoTracks().length > 0
      ) {
        screenStreamRef.current.getVideoTracks().forEach((track) => {
          combinedStream.addTrack(track);
          console.log("Added video track to combined stream");
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
      const recordedChunks = [];
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
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

  const createTempRecording = () => {
    if (!wsRef.current || !isRecording) {
      console.error(
        "Cannot create temp recording: WebSocket not connected or not recording"
      );
      return;
    }
    wsRef.current.send(
      JSON.stringify({
        type: "create-temp-recording",
        sender: clientId,
        timestamp: Date.now(),
      })
    );
    showNotification("Temporary recording checkpoint created");
  };

  const createOffer = async () => {
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionsRef.current[clientId] = peerConnection;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }
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

  const handleOffer = async (message) => {
    const isScreenShare = message.streamType === "screen";
    const peerConnection = new RTCPeerConnection(configuration);
    if (isScreenShare) {
      screenSharePeerConnectionsRef.current[message.sender] = peerConnection;
    } else {
      peerConnectionsRef.current[message.sender] = peerConnection;
    }
    if (!isScreenShare && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (isScreenShare) {
        console.log(`Received screen-share stream from ${message.sender}`);
        screenShareStreamsRef.current.set(message.sender, stream);
        if (screenShareVideoRef.current) {
          console.log("Setting screen-share stream to video element");
          screenShareVideoRef.current.srcObject = stream;
          screenShareVideoRef.current
            .play()
            .then(() => console.log("Screen-share video playing"))
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
    peerConnection.onconnectionstatechange = () => {
      console.log(
        `Connection state with ${message.sender}: ${peerConnection.connectionState}`
      );
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

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !wsRef.current || !clientId) return;
    const userData = await fetchUserDataById(clientId);
    const message = {
      type: "chat-message",
      sender: userData.username, // Send username instead of ID
      content: chatInput.trim(),
      timestamp: Date.now(),
    };
    wsRef.current.send(JSON.stringify(message));
    setChatInput("");
  };

  const endLive = async () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Send end live message through websocket
        wsRef.current.send(
          JSON.stringify({
            type: "end-live",
            sender: clientId,
          })
        );
      }

      // Update episode status through REST API
      await api.put(
        `/api/v1/episodes/live/end_live/${id}?creator_id=${clientId}`
      );

      // Stop all media and connections
      stopCall();

      // Redirect to homepage
      navigate("/");
    } catch (error) {
      console.error("Error ending live session:", error);
      alert("Failed to end live session");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const userId = await fetchUserData();
      if (userId) setClientId(userId);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!clientId || !id) return;
    const fetchData = async () => {
      await fetchEpisode();
    };
    fetchData();
  }, [clientId, id]);

  useEffect(() => {
    if (isHost === null || !clientId || !id) return;
    const setupCall = async () => {
      console.log("Joining room as host:", isHost);
      await joinRoom();
      console.log("Starting call as host:", isHost);
      await startCall();
      if (isHost) {
        console.log("Starting recording as host");
        await startRecording();
      }
    };
    setupCall();
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
      stopCall();
    };
  }, [clientId, isHost, id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="flex flex-col items-center p-4 min-h-screen">
      <div className="w-full max-w-6xl flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{episodeName}</h1>
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
      <div
        className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6"
        style={{ height: "calc(100vh - 220px)" }}
      >
        <Card className="md:col-span-2">
          <CardContent className="p-6 flex flex-col h-full">
            {(isSharing || participants.some((p) => p.isScreenSharing)) && (
              <div className="mb-6">
                <div className="w-full bg-black rounded aspect-video flex items-center justify-center relative">
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {isSharing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xl bg-black bg-opacity-50 px-4 py-2 rounded">
                        Now sharing screen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <div className="mb-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <Mic className="w-5 h-5" />
                  Speakers (
                  {participants.filter((p) => p.isSpeaker || p.isHost).length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {participants
                    .filter((p) => p.isSpeaker || p.isHost)
                    .map((participant) => (
                      <div
                        key={participant.id}
                        className="flex flex-col items-center gap-0"
                      >
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-medium bg-gray-500`}
                          >
                            <img
                              src={`http://127.0.0.1:8000/api/v1/users/profile-picture/${participant.profilePicture}`}
                              alt={participant.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) =>
                                (e.target.src = "/default-avatar.png")
                              }
                            />
                          </div>
                          {participant.isSpeaking && (
                            <div className="absolute inset-0 rounded-full border-3 border-green-500 animate-pulse" />
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
                          </div>
                        </div>
                        {isHost && !participant.isHost && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700"
                            onClick={() => demoteSpeaker(participant.id)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <UserPlus className="w-5 h-5" />
                  Listeners (
                  {participants.filter((p) => !p.isSpeaker && !p.isHost).length}
                  )
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {participants
                    .filter((p) => !p.isSpeaker && !p.isHost)
                    .map((participant) => (
                      <div
                        key={participant.id}
                        className="flex flex-col items-center gap-0"
                      >
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-medium bg-gray-500`}
                          >
                            <img
                              src={`http://127.0.0.1:8000/api/v1/users/profile-picture/${participant.profilePicture}`}
                              alt={participant.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) =>
                                (e.target.src = "/default-avatar.png")
                              }
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {participant.name}
                            {participant.id === clientId && " (You)"}
                          </div>
                        </div>
                        {isHost &&
                          !participant.isHost &&
                          pendingRequests.some(
                            (req) => req.id === participant.id
                          ) && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full w-5 h-5 flex items-center justify-center text-green-500 hover:text-green-700"
                                onClick={() => approveRequest(participant.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-700"
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
            </div>
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
                      {speakerRequestStatus === "pending" && "Request sent"}
                    </div>
                  )}
                </div>
              )}
              {(isHost || isSpeaker) && (
                <>
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
                  {/* New Button */}
                  <Button
                    variant="outline"
                    onClick={createTempRecording}
                    disabled={!isRecording}
                    className={`rounded-full w-12 h-12 flex items-center justify-center p-0 ${
                      isRecording ? "text-blue-500" : "text-gray-500"
                    }`}
                  >
                    <Text className="h-6 w-6" />
                  </Button>
                  {isHost && (
                    <>
                      {/* Add the new End Live button here */}
                      <Button
                        variant="destructive"
                        onClick={endLive}
                        className="rounded-full px-4 h-12 flex items-center justify-center gap-2"
                      >
                        End Live
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
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
                    msg.sender === userCache.get(clientId)?.username
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <span className="font-medium">
                    {msg.sender === userCache.get(clientId)?.username
                      ? "You"
                      : msg.sender}
                    :
                  </span>{" "}
                  <span>{msg.content}</span>
                </div>
              ))}
            </div>
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
