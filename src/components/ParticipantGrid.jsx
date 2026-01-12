import React, { useRef, useEffect, memo } from 'react';
import { Users } from 'lucide-react';

/**
 * VideoStream Component
 * Handles a single video element to ensure srcObject is only set once per stream change.
 */
const VideoStream = memo(({ stream, isLocal, name }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            // Only set srcObject if it's different to avoid flicker
            if (videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
            }
        }
    }, [stream]);

    return (
        <div className="relative bg-bg-card rounded-2xl overflow-hidden shadow-lg border border-white/5 aspect-video">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover mirror"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-bg-dark/50">
                    <Users size={48} className="text-text-muted/30" />
                </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium text-text-main">
                {name}
            </div>
        </div>
    );
});

/**
 * ParticipantGrid Component
 * Displays a responsive grid of local and remote video streams.
 * Wrapped in React.memo to prevent re-renders when other states (like chat) change.
 */
const ParticipantGrid = memo(({ localStream, remoteStreams, username }) => {
    // Combine local user and remote peers into a single array
    const participants = [
        { id: 'local', stream: localStream, name: `${username} (You)`, isLocal: true },
        ...Object.entries(remoteStreams).map(([id, data]) => ({
            id,
            stream: data.stream,
            name: data.username,
            isLocal: false
        }))
    ];

    // Determine grid columns based on number of participants
    const getGridCols = (count) => {
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-1 md:grid-cols-2';
        if (count <= 4) return 'grid-cols-2';
        return 'grid-cols-3';
    };

    return (
        <div className={`grid gap-4 w-full h-full p-4 transition-all duration-500 ${getGridCols(participants.length)}`}>
            {participants.map((p) => (
                <VideoStream
                    key={p.id}
                    stream={p.stream}
                    isLocal={p.isLocal}
                    name={p.name}
                />
            ))}
        </div>
    );
});

export default ParticipantGrid;
