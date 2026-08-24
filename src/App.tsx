import React, { useState } from 'react';
import { connectWallet } from '@dataverse/sdk';

export default function App() {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  const handleConnect = async () => {
    await connectWallet();
  };

  const addNote = () => {
    if (newNote) {
      setNotes([...notes, newNote]);
      setNewNote('');
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dataverse Notes</h1>
      <button onClick={handleConnect}>Connect Identity</button>
      <div style={{ marginTop: '1rem' }}>
        <input 
          value={newNote} 
          onChange={e => setNewNote(e.target.value)} 
          placeholder="Write a note..."
        />
        <button onClick={addNote}>Save to Dataverse</button>
      </div>
      <ul>
        {notes.map((n, i) => <li key={i}>{n}</li>)}
      </ul>
    </div>
  );
}