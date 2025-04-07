# app/models/websocket.py
from fastapi import WebSocket
from typing import Dict, Set, List, Optional
from datetime import datetime
import json
from app.utils.episode_file_handler import start_live_recording, add_audio_chunk, stop_live_recording, save_logs, add_video_chunk, save_chat_logs

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, Set[str]] = {}
        self.recording_sessions: Dict[str, dict] = {}
        self.speech_events: Dict[str, List[dict]] = {}  # Room ID -> list of speech events
        self.session_events: Dict[str, List[dict]] = {}  # Room ID -> list of session events (join/leave)
        self.episode_mappings: Dict[str, str] = {}  # Room ID -> Episode ID
        self.screen_sharers: Dict[str, str] = {}  # Room ID -> User ID
        self.chat_messages: Dict[str, List[dict]] = {}  # Room ID -> list of chat messages

    async def connect(self, websocket: WebSocket, client_id: str, room_id: str, is_host: bool = False):
        await websocket.accept()
        
        # Store client metadata
        self.active_connections[client_id] = {
            "websocket": websocket,
            "is_host": is_host,
            "is_speaker": is_host  # Host starts as speaker by default
        }
        
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
            self.speech_events[room_id] = []
            self.session_events[room_id] = []
        
        self.rooms[room_id].add(client_id)
        
        # Record join event using the new method
        timestamp = datetime.now().timestamp() * 1000
        join_event = self.record_session_event(room_id, "join", client_id, timestamp)
        
        # Notify everyone in the room about the new user
        await self.broadcast_to_room(
        json.dumps({
            "type": "user-joined",
            "client_id": client_id,
            "is_host": is_host,
            "is_speaker": is_host,  # Host is speaker by default
            "timestamp": join_event["timestamp"]
        }),
        room_id,
        ""
        )
        
        # Send the current users list to the new connection
        users = [
        {
            "id": uid,
            "is_host": self.active_connections[uid]["is_host"],
            "is_speaker": self.active_connections[uid]["is_speaker"]
        }
        for uid in self.rooms[room_id]
        ]
        await websocket.send_text(json.dumps({
            "type": "users-list",
            "users": users
        }))
        
        if room_id not in self.chat_messages:
            self.chat_messages[room_id] = []

    def disconnect(self, client_id: str, room_id: str):
        self.active_connections.pop(client_id, None)
        
        if room_id in self.rooms:
            # Record leave event using the new method
            if room_id in self.session_events:
                timestamp = datetime.now().timestamp() * 1000
                self.record_session_event(room_id, "leave", client_id, timestamp)
            
            self.rooms[room_id].discard(client_id)
            if not self.rooms[room_id]:
                self.rooms.pop(room_id)
                
                # Save both speech and session events for this room when it's emptied
                if room_id in self.speech_events:
                    self._save_logs(room_id)
                    self.speech_events.pop(room_id)
                    self.session_events.pop(room_id, None)
                    
                # Save chat messages when room is emptied
                if room_id in self.chat_messages:
                    self._save_chat_logs(room_id)
                    self.chat_messages.pop(room_id)

    def _save_logs(self, room_id: str):
        """Save speech and session events to JSON files when a room is closed"""
        episode_id = self.episode_mappings.get(room_id)
        save_logs(
            room_id, 
            self.speech_events.get(room_id, []), 
            self.session_events.get(room_id, []),
            episode_id
        )
    
    def record_session_event(self, room_id: str, event_type: str, client_id: str, 
                          timestamp: float, additional_data: Optional[dict] = None):
        """Record a generic session event"""
        if room_id not in self.session_events:
            self.session_events[room_id] = []
            
        event = {
            "type": event_type,
            "client_id": client_id,
            "timestamp": timestamp
        }
        
        if additional_data:
            event.update(additional_data)
            
        self.session_events[room_id].append(event)
        return event

    def record_speech_event(self, room_id: str, client_id: str, is_speaking: bool, 
                          timestamp: float, speaking_start: float = None):
        """Record a speech event from a user"""
        if room_id not in self.speech_events:
            self.speech_events[room_id] = []
            
        event = {
            "client_id": client_id,
            "speaking": is_speaking,
            "timestamp": timestamp
        }
        
        # For speech end events, calculate duration
        if not is_speaking and speaking_start:
            event["duration_ms"] = timestamp - speaking_start
            
        self.speech_events[room_id].append(event)
        
        return event

    async def broadcast_to_room(self, message: str, room_id: str, sender_id: str):
        if room_id in self.rooms:
            for client_id in self.rooms[room_id]:
                if client_id != sender_id and client_id in self.active_connections:
                    await self.active_connections[client_id]["websocket"].send_text(message)

    async def broadcast_speech_event(self, room_id: str, client_id: str, is_speaking: bool):
        """Broadcast speaking status to all users in a room"""
        if room_id in self.rooms:
            message = json.dumps({
                "type": "user-speaking",
                "client_id": client_id,
                "speaking": is_speaking
            })
            
            for uid in self.rooms[room_id]:
                if uid in self.active_connections:
                    await self.active_connections[uid]["websocket"].send_text(message)

    def start_recording(self, room_id: str, mime_type: str):
        """Start recording a live session"""
        episode_id = self.episode_mappings.get(room_id)
        recording_session = start_live_recording(room_id, mime_type, episode_id)
        self.recording_sessions[room_id] = recording_session
        return recording_session['final_filename']

    def stop_recording(self, room_id: str):
        """Stop recording a live session"""
        if room_id in self.recording_sessions:
            recording_info = self.recording_sessions[room_id]
            final_path = stop_live_recording(recording_info)
            self.recording_sessions.pop(room_id, None)
            return final_path
        return None

    def add_audio_chunk(self, room_id: str, audio_data: bytes):
        """Add an audio chunk to a recording"""
        if room_id in self.recording_sessions and self.recording_sessions[room_id]['is_recording']:
            add_audio_chunk(self.recording_sessions[room_id]['file_handle'], audio_data)
            
    def associate_episode(self, room_id: str, episode_id: str):
        """Associate a room with an episode"""
        self.episode_mappings[room_id] = episode_id
    
    def add_video_chunk(self, room_id: str, video_data: bytes):
        """Add a video chunk to a recording"""
        if room_id in self.recording_sessions and self.recording_sessions[room_id]['is_recording']:
            add_video_chunk(self.recording_sessions[room_id]['file_handle'], video_data)
    
    def set_screen_sharer(self, room_id: str, user_id: str):
        self.screen_sharers[room_id] = user_id
    
    def clear_screen_sharer(self, room_id: str):
        self.screen_sharers.pop(room_id, None)
        
    def _save_chat_logs(self, room_id: str):
        """Save chat messages to a JSON file when a room is closed"""
        episode_id = self.episode_mappings.get(room_id)
        save_chat_logs(room_id, self.chat_messages.get(room_id, []), episode_id)

    async def broadcast_chat_message(self, room_id: str, message: dict):
        """Broadcast chat message to all users in a room and store it"""
        if room_id not in self.chat_messages:
            self.chat_messages[room_id] = []
        
        self.chat_messages[room_id].append(message)
        
        if room_id in self.rooms:
            message_json = json.dumps({
                "type": "chat-message",
                "message": message
            })
            for client_id in self.rooms[room_id]:
                if client_id in self.active_connections:
                    await self.active_connections[client_id]["websocket"].send_text(message_json)
            
    def update_speaker_status(self, client_id: str, is_speaker: bool):
        """Update the speaker status of a client"""
        if client_id in self.active_connections:
            self.active_connections[client_id]["is_speaker"] = is_speaker

    async def broadcast_user_status(self, room_id: str, client_id: str, is_speaker: bool):
        """Broadcast updated user status to all clients in the room"""
        if room_id in self.rooms:
            message = json.dumps({
                "type": "user-status-update",
                "client_id": client_id,
                "is_speaker": is_speaker,
                "timestamp": datetime.now().timestamp() * 1000
            })
            for uid in self.rooms[room_id]:
                if uid in self.active_connections:
                    await self.active_connections[uid]["websocket"].send_text(message)
                    
manager = ConnectionManager()