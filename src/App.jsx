import React, { useRef, useEffect, useState } from 'react'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl) {
      const audio = audioRef.current;
      audio.src = audioUrl;
      console.log('Setting audio source:', audioUrl);
      audio.load(); // Explicitly load the audio
    }
  }, [audioUrl]);

  const generateMusic = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setAudioError(null);
    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate music');
      }

      const data = await response.json();
      console.log('Received data:', data);
      if (data.output && typeof data.output === 'string') {
        setAudioUrl(data.output);
      } else {
        throw new Error('Invalid output format from API');
      }
    } catch (error) {
      console.error("Error generating music:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      generateMusic();
    }
  };

  const buttonStyle = {
    backgroundColor: '#000000',
    color: 'white',
    border: 'none',
    borderRadius: '0 30px 30px 0',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  };

  return (
    <main className="container">
      <div className="logo">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 18.5L4 17v-7.5L12 5l8 4.5V17l-8 3.5z"/>
        </svg>
        <h1>Vega Music</h1>
      </div>
      <div className="searchContainer" style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: '30px', padding: '5px', margin: '20px 0', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}>
        <input
          type="text"
          placeholder="A melody about a cozy rainy day"
          className="searchInput"
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          style={{ flexGrow: 1, border: 'none', background: 'transparent', padding: '10px 15px', fontSize: '16px', outline: 'none' }}
        />
        <button 
          className="createButton" 
          onClick={generateMusic} 
          disabled={isLoading}
          style={buttonStyle}
        >
          {isLoading ? <div className="loader"></div> : "Create"}
        </button>
      </div>
      {audioUrl && (
        <div className="outputContainer">
          <h2>Generated Music:</h2>
          <audio 
            ref={audioRef} 
            controls 
            onError={(e) => {
              console.error('Audio error:', e);
              setAudioError(`Error loading audio: ${e.target.error ? e.target.error.message : 'Unknown error'}`);
            }}
          />
          {audioError && <p className="error">{audioError}</p>}
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </main>
  )
}

export default App;
