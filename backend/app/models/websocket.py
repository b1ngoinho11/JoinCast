# app/models/websocket.py
from fastapi import WebSocket
from typing import Dict, Set, List
import os
from datetime import datetime
import subprocess
import json

LIVES_DIR = "episodes/lives"
LIVES_LOG_DIR = "episodes/live_logs"
SESSIONS_LOG_DIR = "episodes/session_logs"
os.makedirs(LIVES_DIR, exist_ok=True)
os.makedirs(LIVES_LOG_DIR, exist_ok=True)
os.makedirs(SESSIONS_LOG_DIR, exist_ok=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, Set[str]] = {}
        self.recording_sessions: Dict[str, dict] = {}
        self.speech_events: Dict[str, List[dict]] = {}  # Room ID -> list of speech events
        self.session_events: Dict[str, List[dict]] = {}  # Room ID -> list of session events (join/leave)

    async def connect(self, websocket: WebSocket, client_id: str, room_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
            self.speech_events[room_id] = []
            self.session_events[room_id] = []
        
        self.rooms[room_id].add(client_id)
        
        # Record join event
        join_event = {
            "type": "join",
            "client_id": client_id,
            "timestamp": datetime.now().timestamp() * 1000  # milliseconds
        }
        self.session_events[room_id].append(join_event)
        
        # Notify everyone in the room about the new user
        await self.broadcast_to_room(
            json.dumps({
                "type": "user-joined",
                "client_id": client_id,
                "timestamp": join_event["timestamp"]
            }),
            room_id,
            ""  # Empty sender means system message
        )
        
        # Send the current users list to the new connection
        users = [{"id": uid} for uid in self.rooms[room_id]]
        await websocket.send_text(json.dumps({
            "type": "users-list",
            "users": users
        }))

    def disconnect(self, client_id: str, room_id: str):
        self.active_connections.pop(client_id, None)
        if room_id in self.rooms:
            # Record leave event
            if room_id in self.session_events:
                leave_event = {
                    "type": "leave",
                    "client_id": client_id,
                    "timestamp": datetime.now().timestamp() * 1000  # milliseconds
                }
                self.session_events[room_id].append(leave_event)
            
            self.rooms[room_id].discard(client_id)
            if not self.rooms[room_id]:
                self.rooms.pop(room_id)
                
                # Save both speech and session events for this room when it's emptied
                if room_id in self.speech_events:
                    self._save_logs(room_id)
                    self.speech_events.pop(room_id)
                    self.session_events.pop(room_id, None)

    def _save_logs(self, room_id: str):
        """Save speech and session events to JSON files when a room is closed"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save speech events
        if room_id in self.speech_events and self.speech_events[room_id]:
            speech_filename = f"{LIVES_LOG_DIR}/recording_log_{room_id}_{timestamp}.json"
            
            try:
                with open(speech_filename, 'w') as f:
                    json.dump({
                        "room_id": room_id,
                        "session_end": datetime.now().isoformat(),
                        "events": self.speech_events[room_id]
                    }, f, indent=2)
                
                print(f"Speech log saved: {speech_filename}")
            except Exception as e:
                print(f"Error saving speech log: {e}")
        
        # Save session events
        if room_id in self.session_events and self.session_events[room_id]:
            session_filename = f"{SESSIONS_LOG_DIR}/session_log_{room_id}_{timestamp}.json"
            
            try:
                with open(session_filename, 'w') as f:
                    json.dump({
                        "room_id": room_id,
                        "session_end": datetime.now().isoformat(),
                        "events": self.session_events[room_id]
                    }, f, indent=2)
                
                print(f"Session log saved: {session_filename}")
            except Exception as e:
                print(f"Error saving session log: {e}")

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
                    await self.active_connections[client_id].send_text(message)

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
                    await self.active_connections[uid].send_text(message)

    def start_recording(self, room_id: str, mime_type: str):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_filename = f"{LIVES_DIR}/temp_room_{room_id}_{timestamp}.webm"
        final_filename = f"{LIVES_DIR}/room_{room_id}_{timestamp}.wav"
        
        self.recording_sessions[room_id] = {
            'temp_filename': temp_filename,
            'final_filename': final_filename,
            'mime_type': mime_type,
            'file_handle': open(temp_filename, 'wb'),
            'is_recording': True,
            'start_time': datetime.now()
        }
        return final_filename

    def stop_recording(self, room_id: str):
        if room_id in self.recording_sessions and self.recording_sessions[room_id]['is_recording']:
            recording_info = self.recording_sessions[room_id]
            recording_info['is_recording'] = False
            
            try:
                # Close the temporary file
                recording_info['file_handle'].close()

                # Convert WebM to WAV using FFmpeg
                subprocess.run([
                    'ffmpeg',
                    '-i', recording_info['temp_filename'],
                    '-acodec', 'pcm_s16le',
                    '-ar', '44100',
                    recording_info['final_filename']
                ], check=True)

                # Remove temporary file
                os.remove(recording_info['temp_filename'])
                
                return recording_info['final_filename']
            except Exception as e:
                print(f"Error processing recording: {e}")
                return None
            finally:
                # Clean up recording session
                self.recording_sessions.pop(room_id, None)
        return None

    def add_audio_chunk(self, room_id: str, audio_data: bytes):
        if room_id in self.recording_sessions and self.recording_sessions[room_id]['is_recording']:
            try:
                # Write the raw audio data directly to the temporary file
                self.recording_sessions[room_id]['file_handle'].write(audio_data)
                self.recording_sessions[room_id]['file_handle'].flush()
            except Exception as e:
                print(f"Error writing audio chunk: {e}")