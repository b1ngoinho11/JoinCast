# app/models/websocket.py
from fastapi import WebSocket
from typing import Dict, Set
import os
from datetime import datetime
import subprocess

RECORDINGS_DIR = "recordings"
os.makedirs(RECORDINGS_DIR, exist_ok=True)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.rooms: Dict[str, Set[str]] = {}
        self.recording_sessions: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, client_id: str, room_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(client_id)

    def disconnect(self, client_id: str, room_id: str):
        self.active_connections.pop(client_id, None)
        if room_id in self.rooms:
            self.rooms[room_id].discard(client_id)
            if not self.rooms[room_id]:
                self.rooms.pop(room_id)

    async def broadcast_to_room(self, message: str, room_id: str, sender_id: str):
        if room_id in self.rooms:
            for client_id in self.rooms[room_id]:
                if client_id != sender_id and client_id in self.active_connections:
                    await self.active_connections[client_id].send_text(message)

    def start_recording(self, room_id: str, mime_type: str):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_filename = f"{RECORDINGS_DIR}/temp_room_{room_id}_{timestamp}.webm"
        final_filename = f"{RECORDINGS_DIR}/room_{room_id}_{timestamp}.wav"
        
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