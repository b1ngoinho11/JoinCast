import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Mic, MicOff, ScreenShare, StopCircle, MessageSquare, Circle } from "lucide-react";

export default function PodcastLive() {
  const [isMuted, setIsMuted] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const isHost = true;
  
  // Mock participant data
  const speakers = [
    { id: 1, name: "John Doe", isSpeaking: true },
    { id: 2, name: "Jane Smith", isSpeaking: false },
  ];
  
  const listeners = [
    { id: 3, name: "Bob Wilson" },
    { id: 4, name: "Alice Brown" },
  ];

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      {/* Main Card */}
      <Card className="w-full max-w-2xl p-4">
        <CardContent className="flex flex-col gap-6">
          {/* Speaker Request Panel */}
          <div className="space-y-2">
            <h3 className="font-semibold">Speaker Request</h3>
            <div className="flex gap-2">
              {!isHost && (
                <Button variant="outline">Request to Speak</Button>
              )}
              {isHost && (
                <>
                  <Button variant="outline" className="text-green-600">Accept</Button>
                  <Button variant="outline" className="text-red-600">Decline</Button>
                </>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className="space-y-2">
            <h3 className="font-semibold">Call Controls</h3>
            <Button 
              variant="outline" 
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="mr-2" /> : <Mic className="mr-2" />}
              {isMuted ? "Unmute" : "Mute"}
            </Button>
          </div>

          {/* Screen Sharing */}
          <div className="space-y-2">
            <h3 className="font-semibold">Screen Sharing</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSharing(true)}
                disabled={isSharing}
              >
                <ScreenShare className="mr-2" />
                Share Screen
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsSharing(false)}
                disabled={!isSharing}
              >
                <StopCircle className="mr-2" />
                Stop Sharing
              </Button>
            </div>
          </div>

          {/* Recording Controls - Host Only */}
          {isHost && (
            <div className="space-y-2">
              <h3 className="font-semibold">Recording</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsRecording(true)}
                  disabled={isRecording}
                >
                  <Video className="mr-2" />
                  Record
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRecording(false)}
                  disabled={!isRecording}
                >
                  <StopCircle className="mr-2" />
                  Stop
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants Display */}
      <Card className="w-full max-w-2xl p-4">
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Speakers</h3>
            <div className="flex flex-wrap gap-4">
              {speakers.map(speaker => (
                <div key={speaker.id} className="flex flex-col items-center">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center ${
                      speaker.isSpeaking ? 'ring-2 ring-green-500 animate-pulse' : ''
                    }`}>
                      {speaker.name[0]}
                    </div>
                  </div>
                  <span className="text-sm mt-1">{speaker.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Listeners</h3>
            <div className="flex flex-wrap gap-4">
              {listeners.map(listener => (
                <div key={listener.id} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    {listener.name[0]}
                  </div>
                  <span className="text-sm mt-1">{listener.name}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments/Chat */}
      <Card className="w-full max-w-2xl p-4">
        <CardContent>
          <h3 className="font-semibold mb-2">Live Chat</h3>
          <div className="h-40 border rounded p-2 overflow-y-auto">
            <p className="text-sm">John: Great discussion!</p>
            <p className="text-sm">Jane: Loving this topic</p>
          </div>
          <div className="mt-2 flex gap-2">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 border rounded p-1"
            />
            <Button size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}