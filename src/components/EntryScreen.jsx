import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, ArrowRight, User, Shield, Zap, Plus } from 'lucide-react';

const EntryScreen = ({ onJoin }) => {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [previewStream, setPreviewStream] = useState(null);
    const videoRef = useRef(null);

    // Initialise camera preview
    useEffect(() => {
        let stream = null;
        const getPreview = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setPreviewStream(stream);
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Video preview failed:", err);
            }
        };
        getPreview();
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && roomId.trim()) {
            onJoin(name.trim(), roomId.trim());
        }
    };

    const generateRoomId = () => {
        const id = Math.random().toString(36).substring(2, 11);
        setRoomId(id);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-dark font-outfit text-text-main relative overflow-hidden">
            {/* Subtle Texture/Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            <div className="max-w-4xl w-full px-8 flex flex-col items-center gap-6 relative z-10 py-6">
                {/* Header Section */}
                <div className="text-center space-y-6 text-balance">
                    <div>
                        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] text-white tracking-tighter uppercase">
                            Premium <br />
                            <span className="text-white/20">Meetings.</span>
                        </h1>
                        <div className="h-1.5 w-20 bg-white mt-6 mx-auto"></div>
                    </div>

                    <p className="text-text-muted text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-medium">
                        A high-performance collaborative environment for modern teams. Secure video, whiteboarding, and code editing.
                    </p>
                </div>

                {/* Video Preview Section */}


                {/* Join Card */}
                <div className="w-full max-w-md bg-white p-1 rounded-[32px] shadow-2xl">
                    <div className="bg-bg-card p-8 md:p-5 rounded-[30px] border border-white/5">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[3px] text-text-muted ml-2">Username</label>
                                <div className="group relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-5 rounded-2xl bg-bg-dark border border-white/10 text-white outline-none focus:border-white transition-all text-lg font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[3px] text-text-muted ml-2">Room Access</label>
                                    <div className="relative group">
                                        <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white transition-colors" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Enter room code"
                                            value={roomId}
                                            onChange={(e) => setRoomId(e.target.value)}
                                            required
                                            className="w-full pl-12 pr-4 py-5 rounded-2xl bg-bg-dark border border-white/10 text-white outline-none focus:border-white transition-all text-lg font-bold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-white text-bg-dark hover:bg-white/90 font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-sm"
                                >
                                    Join Meeting
                                    <ArrowRight size={18} strokeWidth={3} />
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-4 w-full">
                                <div className="h-px flex-1 bg-white/10"></div>
                                <span className="text-[10px] font-black tracking-[4px] text-white/20">OR</span>
                                <div className="h-px flex-1 bg-white/10"></div>
                            </div>

                            <button
                                onClick={generateRoomId}
                                className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[2px] text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} strokeWidth={3} />
                                Create New Room
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Badges */}
                <div className="flex items-center gap-10 pt-4">
                    <div className="flex items-center gap-3">
                        <Zap size={20} className="text-white" />
                        <div className="flex flex-col text-left">
                            <span className="text-base font-black leading-none text-white">FAST</span>
                            <span className="text-[8px] text-text-muted font-black uppercase tracking-widest leading-loose">Low Latency</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Shield size={20} className="text-white" />
                        <div className="flex flex-col text-left">
                            <span className="text-base font-black leading-none text-white">SECURE</span>
                            <span className="text-[8px] text-text-muted font-black uppercase tracking-widest leading-loose">End-to-End</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EntryScreen;
