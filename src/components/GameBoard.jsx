import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';

// Modular Components
import CollaborativeEditor from './CollaborativeEditor';
import Whiteboard from './Whiteboard';
import ParticipantGrid from './ParticipantGrid';
import Sidebar from './Sidebar';
import ControlBar from './ControlBar';

/**
 * GameBoard Component (Orchestrator)
 * 
 * Responsibilities:
 * 1. WebRTC Signaling (Offers, Answers, ICE Candidates).
 * 2. Socket.io Connection Management.
 * 3. Media Stream Management (Local/Remote).
 * 4. High-level UI Layout and State (Sidebar toggle, active tabs).
 */
const GameBoard = ({ socket, username, roomId, onLeave }) => {
    // --- MEDIA STATE ---
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: { stream, username } }
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // --- UI/MODAL STATE ---
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showCodeEditor, setShowCodeEditor] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'people'

    // --- GAME/ROOM STATE ---
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [users, setUsers] = useState({});

    // --- REFS ---
    const peers = useRef({}); // { socketId: RTCPeerConnection }
    const localStreamRef = useRef(null);
    const usersRef = useRef({});

    // Keep refs in sync with state for access in listeners
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { usersRef.current = users; }, [users]);

    // --- WEBRTC CONFIG ---
    const iceServers = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    // --- INITIALIZATION & SIGNALING ---
    useEffect(() => {
        const initMedia = async () => {
            console.log("Initialising media for room:", roomId);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                console.log("Media stream successfully captured:", stream.id);
                setLocalStream(stream);
                localStreamRef.current = stream;
                console.log("Emitting join-room for:", username);
                socket.emit('join-room', { roomId, username });
            } catch (err) {
                console.error("CRITICAL: Failed to access camera/mic:", err);
                socket.emit('join-room', { roomId, username });
            }
        };

        initMedia();

        const handlePeerJoined = async ({ socketId, username: peerName }) => {
            const pc = createPeerConnection(socketId, peerName);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { to: socketId, offer });
        };

        const handleOffer = async ({ from, offer }) => {
            const pc = createPeerConnection(from);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { to: from, answer });
        };

        const handleAnswer = async ({ from, answer }) => {
            const pc = peers.current[from];
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        };

        const handleIceCandidate = async ({ from, candidate }) => {
            const pc = peers.current[from];
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        };

        const handlePeerLeft = (socketId) => {
            if (peers.current[socketId]) {
                peers.current[socketId].close();
                delete peers.current[socketId];
            }
            setRemoteStreams(prev => {
                const updated = { ...prev };
                delete updated[socketId];
                return updated;
            });
        };

        // Network Listeners
        socket.on('peer-joined', handlePeerJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);
        socket.on('peer-left', handlePeerLeft);

        // State Listeners
        socket.on('users-list', (data) => setUsers(data.users));
        socket.on('chat', (msg) => setMessages(prev => [...prev, msg]));

        return () => {
            socket.off('peer-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('peer-left');
            socket.off('chat');
            socket.off('users-list');

            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            Object.values(peers.current).forEach(pc => pc.close());
        };
    }, [roomId, socket]);

    // --- PEER CONNECTION HELPER ---
    const createPeerConnection = (socketId, peerName) => {
        const pc = new RTCPeerConnection(iceServers);
        peers.current[socketId] = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { to: socketId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStreams(prev => ({
                ...prev,
                [socketId]: {
                    stream: event.streams[0],
                    username: peerName || usersRef.current[socketId] || 'Guest'
                }
            }));
        };

        return pc;
    };

    // --- UI HANDLERS ---
    const toggleMic = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMuted(!audioTrack.enabled);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;
        socket.emit('chat', inputMessage);
        setInputMessage('');
    };

    const handleLeave = () => {
        if (localStream) localStream.getTracks().forEach(track => track.stop());
        onLeave();
    };

    return (
        <div className="h-screen bg-bg-dark text-text-main flex flex-col font-outfit overflow-hidden">
            {/* Header - Collapses when a tool is active */}
            <div className={`relative z-[110] bg-bg-card/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between transition-all duration-500 ease-in-out ${(showWhiteboard || showCodeEditor) ? '-translate-y-full opacity-0 h-0 p-0 overflow-hidden' : 'translate-y-0'
                }`}>
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white px-2 tracking-tight">Meeting Room: {roomId}</h2>
                    <div className="h-4 w-px bg-white/10"></div>
                    <span className="text-xs text-text-muted font-medium uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                        Active Session
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-white/20 text-white' : 'hover:bg-white/5'}`}
                    >
                        {activeTab === 'chat' ? <MessageSquare size={20} /> : <Users size={20} />}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex relative overflow-hidden">
                <div className="flex-1 flex flex-col relative">
                    {showWhiteboard ? (
                        <Whiteboard socket={socket} roomId={roomId} />
                    ) : (
                        <ParticipantGrid
                            localStream={localStream}
                            remoteStreams={remoteStreams}
                            username={username}
                        />
                    )}
                </div>

                {/* Sidebar (Chat/People) */}
                {showSidebar && (
                    <Sidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        messages={messages}
                        users={users}
                        socketId={socket.id}
                        inputMessage={inputMessage}
                        setInputMessage={setInputMessage}
                        handleSendMessage={handleSendMessage}
                    />
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-[110]">
                <ControlBar
                    toggleMic={toggleMic}
                    isMuted={isMuted}
                    toggleVideo={toggleVideo}
                    isVideoOff={isVideoOff}
                    showWhiteboard={showWhiteboard}
                    setShowWhiteboard={setShowWhiteboard}
                    showCodeEditor={showCodeEditor}
                    setShowCodeEditor={setShowCodeEditor}
                    handleLeave={handleLeave}
                    userCount={Object.keys(users).length}
                    setActiveTab={setActiveTab}
                    setShowSidebar={setShowSidebar}
                />
            </div>

            {/* Modal Components */}
            {showCodeEditor && (
                <CollaborativeEditor
                    roomId={roomId}
                    username={username}
                    onClose={() => setShowCodeEditor(false)}
                />
            )}
        </div>
    );
};

export default GameBoard;

