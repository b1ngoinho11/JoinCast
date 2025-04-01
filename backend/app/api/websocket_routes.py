# app/api/websocket_routes.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import base64

from app.models.websocket import ConnectionManager

manager = ConnectionManager()

router = APIRouter(prefix="/api/v1/websocket", tags=["websocket"])

@router.websocket("/{user_id}/{room_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, room_id: str):
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
                    await manager.broadcast_to_room(
                        json.dumps({
                            'type': 'recording-stopped',
                            'filename': filename
                        }),
                        room_id,
                        user_id
                    )
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