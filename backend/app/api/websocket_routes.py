# app/api/websocket_routes.py
from fastapi import APIRouter, Depends, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import json
import base64

from app.api.dependencies import get_db
from app.repositories.episode_repository import episode_repository
from app.schemas.episode import EpisodeUpdate
from app.models.websocket import manager

router = APIRouter(prefix="/api/v1/websocket", tags=["websocket"])

@router.websocket("/{episode_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    episode_id: str, 
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for live episodes.
    
    This endpoint allows users to connect to a live episode and exchange messages.
    """
    # Check if the episode exists and is active
    episode = episode_repository.get(db, id=episode_id)
    if not episode or episode.type != "live" or not episode.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    
    # Create a room ID based on episode ID
    room_id = f"episode_{episode_id}"
    
    # Associate the room with the episode
    manager.associate_episode(room_id, episode_id)
    
    # Connect to WebSocket
    await manager.connect(websocket, user_id, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message['type'] == 'audio-data' and 'audio' in message:
                try:
                    # Decode base64 audio data
                    audio_bytes = base64.b64decode(message['audio'])
                    manager.add_audio_chunk(room_id, audio_bytes)
                except Exception as e:
                    print(f"Error processing audio chunk: {e}")
            
            elif message['type'] == 'start-recording':
                mime_type = message.get('mimeType', 'audio/webm')
                filename = manager.start_recording(room_id, mime_type)
                await manager.broadcast_to_room(
                    json.dumps({
                        'type': 'recording-started',
                        'filename': filename
                    }),
                    room_id,
                    user_id
                )
            
            elif message['type'] == 'stop-recording':
                filename = manager.stop_recording(room_id)
                if filename:
                    # Update the episode record with the recording file
                    episode_update = EpisodeUpdate(video=filename)
                    episode_repository.update(db, db_obj=episode, obj_in=episode_update)
                    
                    await manager.broadcast_to_room(
                        json.dumps({
                            'type': 'recording-stopped',
                            'filename': filename
                        }),
                        room_id,
                        user_id
                    )
            
            elif message['type'] == 'speech-event':
                # Process speech detection events
                is_speaking = message.get('speaking', False)
                timestamp = message.get('timestamp', 0)
                speaking_start = message.get('speakingStart')
                
                # Record the speech event in the database
                manager.record_speech_event(
                    room_id, 
                    message['sender'], 
                    is_speaking, 
                    timestamp,
                    speaking_start
                )
                
                # Broadcast to all participants
                await manager.broadcast_speech_event(
                    room_id, 
                    message['sender'], 
                    is_speaking
                )
            elif message['type'] == 'video-data' and 'video' in message:
                try:
                    # Decode base64 video data
                    video_bytes = base64.b64decode(message['video'])
                    manager.add_video_chunk(room_id, video_bytes)
                except Exception as e:
                    print(f"Error processing video chunk: {e}")
            
            elif message['type'] == 'start-screen-share':
                mime_type = message.get('mimeType', 'video/webm')
                await manager.broadcast_to_room(
                    json.dumps({
                        'type': 'screen-share-started',
                        'sender': user_id
                    }),
                    room_id,
                    user_id
                )
            
            elif message['type'] == 'stop-screen-share':
                await manager.broadcast_to_room(
                    json.dumps({
                        'type': 'screen-share-stopped',
                        'sender': user_id
                    }),
                    room_id,
                    user_id
                )
                
            elif message['type'] == 'speaker-request':
                # Log speaker request in session events
                manager.record_session_event(
                    room_id,
                    message['type'],
                    message['sender'],
                    message.get('timestamp')
                )
                await manager.broadcast_to_room(data, room_id, user_id)
            
            elif message['type'] == 'speaker-request-response':
                # Log speaker request response in session events
                manager.record_session_event(
                    room_id,
                    message['type'],
                    message['sender'],
                    message.get('timestamp'),
                    {
                        "recipient": message['recipient'],
                        "approved": message['approved']
                    }
                )
                await manager.broadcast_to_room(data, room_id, user_id)
            
            elif message['type'] == 'revoke-speaker':
                # Log revoke speaker event in session events
                manager.record_session_event(
                    room_id,
                    message['type'],
                    message['sender'],
                    message.get('timestamp'),
                    {"recipient": message['recipient']}
                )
                await manager.broadcast_to_room(data, room_id, user_id)
                
            else:
                await manager.broadcast_to_room(data, room_id, user_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id, room_id)
        await manager.broadcast_to_room(
            json.dumps({
                "type": "disconnect",
                "client_id": user_id
            }),
            room_id,
            user_id
        )