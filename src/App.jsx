import React, { useState } from 'react';
import io from 'socket.io-client';
import EntryScreen from './components/EntryScreen.jsx';
import GameBoard from './components/GameBoard.jsx'; // We'll keep the name for now but refactor its content

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(BACKEND_URL, {
    transports: ['websocket'],
});

function App() {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isJoined, setIsJoined] = useState(false);

    const handleJoin = (name, room) => {
        setUsername(name);
        setRoomId(room);
        setIsJoined(true);
        // Socket emit 'join-room' will be handled inside GameBoard (MeetingRoom)
    };

    return (
        <div className="App overflow-hidden">
            {!isJoined ? (
                <EntryScreen onJoin={handleJoin} />
            ) : (
                <GameBoard socket={socket} username={username} roomId={roomId} onLeave={() => setIsJoined(false)} />
            )}
        </div>
    );
}

export default App;
