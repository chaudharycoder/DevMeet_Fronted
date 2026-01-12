import React, { memo } from 'react';
import { Mic, MicOff, Video, VideoOff, Pencil, Monitor, Code, PhoneOff, Users, MessageSquare } from 'lucide-react';

/**
 * ControlBar Component
 * Contains all meeting controls like Mute, Video, Whiteboard, Code Editor, etc.
 */
const ControlBar = memo(({
    toggleMic,
    isMuted,
    toggleVideo,
    isVideoOff,
    showWhiteboard,
    setShowWhiteboard,
    showCodeEditor,
    setShowCodeEditor,
    handleLeave,
    userCount,
    setActiveTab,
    setShowSidebar
}) => {
    return (
        <div className="p-6 flex justify-center items-center bg-bg-dark relative">
            <div className="flex items-center gap-4">
                {/* Audio/Video Controls */}
                <button
                    onClick={toggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-danger text-white' : 'bg-bg-dark text-white hover:bg-bg-dark/80 border border-white/5'}`}
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-danger text-white' : 'bg-bg-dark text-white hover:bg-bg-dark/80 border border-white/5'}`}
                    title={isVideoOff ? "Start Video" : "Stop Video"}
                >
                    {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>

                <div className="w-px h-8 bg-white/10 mx-2"></div>

                {/* Collaboration Tools */}
                <button
                    onClick={() => setShowWhiteboard(!showWhiteboard)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showWhiteboard ? 'bg-white text-bg-dark' : 'bg-bg-dark text-white hover:bg-bg-dark/80 border border-white/5'}`}
                    title="Whiteboard"
                >
                    <Pencil size={20} strokeWidth={2.5} />
                </button>
                <button
                    className="w-12 h-12 rounded-full bg-bg-dark text-white hover:bg-bg-dark/80 border border-white/5 flex items-center justify-center transition-all opacity-40 grayscale"
                    title="Present Screen (Coming Soon)"
                >
                    <Monitor size={20} />
                </button>
                <button
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showCodeEditor ? 'bg-white text-bg-dark' : 'bg-bg-dark text-white hover:bg-bg-dark/80 border border-white/5'}`}
                    title="Collaborative Code Editor"
                >
                    <Code size={20} strokeWidth={2.5} />
                </button>

                {/* Leave Button */}
                <button
                    onClick={handleLeave}
                    className="w-16 h-12 rounded-full bg-danger hover:opacity-90 text-white flex items-center justify-center transition-all px-4 ml-4"
                    title="Leave Call"
                >
                    <PhoneOff size={24} />
                </button>
            </div>

            {/* Quick Access to Sidebar */}
            <div className="absolute right-8 flex items-center gap-4 text-text-muted">
                <button
                    onClick={() => { setActiveTab('people'); setShowSidebar(true); }}
                    className="hover:text-white transition-all flex items-center gap-2"
                >
                    <Users size={20} />
                    <span className="text-sm font-medium">{userCount}</span>
                </button>
                <button
                    onClick={() => { setActiveTab('chat'); setShowSidebar(true); }}
                    className="hover:text-white transition-all"
                >
                    <MessageSquare size={20} />
                </button>
            </div>
        </div>
    );
});

export default ControlBar;
