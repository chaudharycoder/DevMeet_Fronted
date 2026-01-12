import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { MonacoBinding } from 'y-monaco';
import { X, Settings, Code, Copy, Check } from 'lucide-react';

/**
 * CollaborativeEditor Component
 * 
 * Provides a real-time, multi-user code editor using Monaco and Yjs.
 * 
 * Features:
 * - Real-time sync via WebRTC (P2P).
 * - Persistent storage via IndexedDB (local browser storage).
 * - Multi-language syntax highlighting.
 * - Conflict-free resolution (CRDTs).
 */
const CollaborativeEditor = ({ roomId, username, onClose }) => {
    // --- STATE ---
    const [language, setLanguage] = useState(() => {
        // Load last used language for this room from localStorage
        return localStorage.getItem(`monaco-lang-${roomId}`) || 'javascript';
    });
    const [editorRef, setEditorRef] = useState(null);
    const [copied, setCopied] = useState(false);
    const [provider, setProvider] = useState(null);

    const languages = [
        'javascript', 'typescript', 'python', 'cpp', 'java', 'html', 'css', 'json', 'markdown'
    ];

    // --- YJS & COLLABORATION SETUP ---
    useEffect(() => {
        // Initialize Yjs Document (the shared data model)
        const ydoc = new Y.Doc();

        // Setup WebRTC Provider for P2P networking
        const webrtcProvider = new WebrtcProvider(`monaco-room-${roomId}`, ydoc);

        // Setup IndexedDB Persistence so code survives page refreshes
        const persistence = new IndexeddbPersistence(`monaco-room-${roomId}`, ydoc);

        setProvider(webrtcProvider);

        // Define a shared text type for the editor
        const type = ydoc.getText('monaco');

        let binding;
        if (editorRef) {
            // Bind the Yjs text type to the Monaco editor model
            binding = new MonacoBinding(
                type,
                editorRef.getModel(),
                new Set([editorRef]),
                webrtcProvider.awareness
            );
        }

        // Cleanup on unmount
        return () => {
            if (binding) binding.destroy();
            webrtcProvider.destroy();
            persistence.destroy();
            ydoc.destroy();
        };
    }, [roomId, editorRef]);

    const handleEditorDidMount = (editor) => {
        setEditorRef(editor);
    };

    const copyCode = () => {
        if (editorRef) {
            navigator.clipboard.writeText(editorRef.getValue());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-bg-card w-full max-w-6xl h-full max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
                {/* Header */}
                <div className="p-4 bg-bg-dark/80 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Code className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-text-main">Collaborative Code Editor</h3>
                            <p className="text-xs text-text-muted italic">Ready for synchronization: {roomId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                            {languages.slice(0, 3).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setLanguage(lang);
                                        localStorage.setItem(`monaco-lang-${roomId}`, lang);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === lang ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                            <select
                                value={language}
                                onChange={(e) => {
                                    setLanguage(e.target.value);
                                    localStorage.setItem(`monaco-lang-${roomId}`, e.target.value);
                                }}
                                className="bg-transparent text-xs font-bold text-text-muted px-2 outline-none cursor-pointer border-l border-white/10"
                            >
                                <option value="" disabled>MORE</option>
                                {languages.map(lang => (
                                    <option key={lang} value={lang} className="bg-bg-card">{lang.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-white/10 hidden md:block"></div>

                        <button
                            onClick={copyCode}
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-text-main rounded-xl transition-all relative border border-white/5"
                            title="Copy Code"
                        >
                            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2.5 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl transition-all border border-danger/20"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-[#1e1e1e] relative">
                    <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        onMount={handleEditorDidMount}
                        options={{
                            fontSize: 14,
                            minimap: { enabled: true },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 20 },
                            fontFamily: "'Fira Code', monospace",
                            cursorSmoothCaretAnimation: "on",
                            smoothScrolling: true,
                            bracketPairColorization: { enabled: true },
                        }}
                    />

                    {/* Collaborative Users Indicator */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-bg-dark flex items-center justify-center text-[10px] font-black text-bg-dark shadow-lg">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            {/* In a real app, you'd map through provider.awareness.getStates() */}
                        </div>
                        <span className="text-[10px] font-black text-text-main bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                            LIVE COLLABORATION
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollaborativeEditor;
