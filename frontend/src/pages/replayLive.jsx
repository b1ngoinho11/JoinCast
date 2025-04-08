import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, UserPlus, MessageSquare } from "lucide-react";
import api from "../services/api";

export default function ReplayLive() {
  const { episode_id } = useParams();
  const [episodeData, setEpisodeData] = useState(null);
  const [sessionLog, setSessionLog] = useState({ events: [] });
  const [speechLog, setSpeechLog] = useState({ events: [] });
  const [commentsLog, setCommentsLog] = useState({ messages: [] });
  const [mediaSource, setMediaSource] = useState(null);
  const [mediaType, setMediaType] = useState("video");
  const mediaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [activeParticipants, setActiveParticipants] = useState([]);
  const [firstJoinTime, setFirstJoinTime] = useState(null);

  const [clientId] = useState("135f958f-20cc-4cd0-be76-d5106a9a72c5");
  const [userCache] = useState(new Map([[clientId, { username: "user" }]]));
  const [chatInput] = useState("");

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const episodeResponse = await api.get(`/api/v1/episodes/live/${episode_id}`);
        setEpisodeData(episodeResponse.data);
      } catch (error) {
        console.error("Error fetching episode data:", error);
      }
    };

    const fetchLogs = async () => {
      try {
        const [sessionResponse, speechResponse, commentsResponse] = await Promise.all([
          api.get(`/api/v1/replay/${episode_id}/session_log`),
          api.get(`/api/v1/replay/${episode_id}/speech_log`),
          api.get(`/api/v1/replay/${episode_id}/comments_log`),
        ]);
        setSessionLog(sessionResponse.data);
        setSpeechLog(speechResponse.data);
        setCommentsLog(commentsResponse.data); // Fixed: Use commentsResponse.data

        const firstJoin = sessionResponse.data.events
          .filter((event) => event.type === "join")
          .sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp;
        setFirstJoinTime(firstJoin || null);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
    };

    const fetchMediaFile = async () => {
      try {
        const fileResponse = await api.get(`/api/v1/replay/${episode_id}`, {
          responseType: "blob",
        });
        const contentType = fileResponse.headers["content-type"];
        const blob = new Blob([fileResponse.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        setMediaSource(url);
        setMediaType(contentType.startsWith("audio/") ? "audio" : "video");
      } catch (error) {
        console.error("Error fetching media file:", error);
      }
    };

    const fetchParticipants = async () => {
      try {
        const clientIds = [...new Set(sessionLog.events.map((event) => event.client_id))];
        const creatorId = episodeData?.creator_id;
        const participantPromises = clientIds.map(async (id) => {
          try {
            const response = await api.get(`/api/v1/users/${id}`);
            const user = response.data;
            const isHost = creatorId && id === creatorId;
            return {
              id: user.id,
              name: user.username,
              profilePicture: user.profile_picture,
              isSpeaker: isHost,
              isHost: isHost,
              isSpeaking: false,
            };
          } catch (error) {
            console.error(`Error fetching user ${id}:`, error);
            return null;
          }
        });
        const participantsData = (await Promise.all(participantPromises)).filter((p) => p !== null);
        setParticipants(participantsData);

        if (creatorId && !participantsData.some((p) => p.id === creatorId)) {
          console.warn(`Host with creator_id ${creatorId} not found in session log`);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchEpisodeData();
    fetchLogs();
    fetchMediaFile();

    if (sessionLog.events.length > 0 && episodeData?.creator_id) {
      fetchParticipants();
    }

    return () => {
      if (mediaSource) {
        URL.revokeObjectURL(mediaSource);
      }
    };
  }, [episode_id, sessionLog.events.length, episodeData?.creator_id]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => {
      setCurrentTime(media.currentTime);
    };

    media.addEventListener("timeupdate", updateTime);

    return () => {
      media.removeEventListener("timeupdate", updateTime);
    };
  }, [mediaSource]);

  useEffect(() => {
    if (!firstJoinTime || !sessionLog.events) return;

    const currentRelativeTime = currentTime * 1000;
    const creatorId = episodeData?.creator_id;

    const activeSet = new Set();
    const speakerMap = new Map();

    sessionLog.events.forEach((event) => {
      const eventRelativeTime = event.timestamp - firstJoinTime;
      if (eventRelativeTime <= currentRelativeTime) {
        if (event.type === "join") {
          activeSet.add(event.client_id);
        } else if (event.type === "leave") {
          activeSet.delete(event.client_id);
        } else if (event.type === "speaker-request-response" && event.approved) {
          speakerMap.set(event.recipient, true);
        } else if (event.type === "revoke-speaker" && event.recipient !== creatorId) {
          speakerMap.set(event.recipient, false);
        }
      }
    });

    const speakingMap = new Map();
    speechLog.events.forEach((event) => {
      const eventRelativeTime = event.timestamp - firstJoinTime;
      if (eventRelativeTime <= currentRelativeTime) {
        speakingMap.set(event.client_id, event.speaking);
      }
    });

    const active = participants
      .filter((p) => activeSet.has(p.id))
      .map((p) => ({
        ...p,
        isSpeaker: p.isHost || speakerMap.get(p.id) || false,
        isSpeaking: speakingMap.get(p.id) || false,
      }));
    setActiveParticipants(active);
  }, [currentTime, sessionLog, speechLog, firstJoinTime, participants, episodeData?.creator_id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [commentsLog, currentTime]);

  return (
    <div className="flex flex-col items-center p-4 min-h-screen">
      <div className="w-full max-w-6xl flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{episodeData?.name || "Loading..."}</h1>
      </div>
      <div
        className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6"
        style={{ height: "calc(100vh - 220px)" }}
      >
        <Card className="md:col-span-2">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="mb-6">
                {mediaSource ? (
                  mediaType === "audio" ? (
                    <audio
                      ref={mediaRef}
                      src={mediaSource}
                      controls
                      playsInline
                      className="w-full"
                    />
                  ) : (
                    <video
                      ref={mediaRef}
                      src={mediaSource}
                      controls
                      playsInline
                      className="w-full aspect-video object-contain"
                    />
                  )
                ) : (
                  <span className="text-white">Loading media...</span>
                )}
              </div>
            <div className="flex-1 overflow-y-auto">
              <div className="mb-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <Mic className="w-5 h-5" />
                  Speakers (
                  {activeParticipants.filter((p) => p.isSpeaker || p.isHost).length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {activeParticipants
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
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-lg">
                  <UserPlus className="w-5 h-5" />
                  Listeners (
                  {activeParticipants.filter((p) => !p.isSpeaker && !p.isHost).length}
                  )
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {activeParticipants
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
                          {participant.isSpeaking && (
                            <div className="absolute inset-0 rounded-full border-3 border-green-500 animate-pulse" />
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {participant.name}
                            {participant.id === clientId && " (You)"}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
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
              {commentsLog.messages.map((msg, index) => {
                const relativeTime = firstJoinTime ? msg.timestamp - firstJoinTime : 0;
                const isActive = relativeTime <= currentTime * 1000;
                return (
                  <div
                    key={index}
                    className={`text-sm ${
                      msg.sender === userCache.get(clientId)?.username
                        ? "text-right"
                        : "text-left"
                    } ${isActive ? "text-gray-900" : "text-gray-400"}`}
                  >
                    <span className="font-medium">
                      {msg.sender === userCache.get(clientId)?.username
                        ? "You"
                        : msg.sender}
                      :
                    </span>{" "}
                    <span>{msg.content}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto flex gap-2 w-full">
              <input
                type="text"
                value={chatInput}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded h-10"
                disabled
              />
              <button
                className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded"
                disabled
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
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}