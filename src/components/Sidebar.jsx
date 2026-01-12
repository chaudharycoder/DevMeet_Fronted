import React, { memo } from 'react';
import { MessageSquare, Users, Send } from 'lucide-react';

/**
 * Sidebar Component
 * Manages the Chat and People tabs.
 */
const Sidebar = memo(({
    activeTab,
    setActiveTab,
    messages,
    users,
    socketId,
    inputMessage,
    setInputMessage,
    handleSendMessage
}) => {
    return (
        <div className="w-80 border-l border-white/5 bg-bg-card flex flex-col animate-slide-in">
            {/* Tab Selection */}
            <div className="p-4 border-b border-white/5 flex gap-2">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-2 rounded-lg font-black uppercase tracking-widest transition-all text-[10px] ${activeTab === 'chat' ? 'bg-white text-bg-dark shadow-lg' : 'text-text-muted hover:bg-white/5'}`}
                >
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab('people')}
                    className={`flex-1 py-2 rounded-lg font-black uppercase tracking-widest transition-all text-[10px] ${activeTab === 'people' ? 'bg-white text-bg-dark shadow-lg' : 'text-text-muted hover:bg-white/5'}`}
                >
                    People
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'chat' ? (
                    <div className="space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{msg.name}</span>
                                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-text-main border border-white/5">
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {Object.entries(users).map(([id, name]) => (
                            <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                    {name.charAt(0).toUpperCase()}
                                </div>
                                <span className="flex-1 font-medium truncate">{name}</span>
                                {id === socketId && (
                                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider">You</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Chat Input */}
            {activeTab === 'chat' && (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2">
                    <input
                        type="text"
                        placeholder="Message everyone"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl bg-bg-dark border border-white/10 text-text-main outline-none focus:border-primary transition-all text-sm"
                    />
                    <button type="submit" className="p-3 bg-white text-bg-dark rounded-xl hover:bg-white/90 transition-all shadow-lg active:scale-95">
                        <Send size={18} strokeWidth={3} />
                    </button>
                </form>
            )}
        </div>
    );
});

export default Sidebar;
