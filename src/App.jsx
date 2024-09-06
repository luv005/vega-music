import React, { useRef, useEffect, useState } from 'react'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const audioRef = useRef(null);

  const [lyrics, setLyrics] = useState('');
  const musicFileUrl = 'https://cdn.hailuoai.com/prod/2024-08-21-16/featured_music/1724227340181812789-Echoes%20Of%20Love.wav';

  const handleLyricsChange = (e) => {
    setLyrics(e.target.value);
  };

  const uploadFile = async (url) => {
    try {
      // First, fetch the file content from the URL
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        throw new Error('Failed to fetch the file from the provided URL');
      }
      const fileBlob = await fileResponse.blob();

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('purpose', 'song');
      formData.append('file', fileBlob, 'audio.wav'); // 'audio.wav' is the filename sent to the server

      // Send the upload request
      const uploadResponse = await fetch('https://api.minimax.chat/v1/music_upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MINIMAXI_API_KEY}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await uploadResponse.json();
      return { referVoice: data.voice_id, referInstrumental: data.instrumental_id };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  };

  const createSong = async () => {
    if (!lyrics.trim()) {
      console.log("Lyrics are empty, returning");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioError(null);

    try {
      console.log("Uploading file...");
      const { referVoice, referInstrumental } = await uploadFile(musicFileUrl);
      console.log('referVoice', referVoice, 'referInstrumental', referInstrumental, 'musicFileUrl', musicFileUrl);

      console.log("Generating song...");
      const response = await fetch('/api/generate-song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lyrics: lyrics,
          referVoice: referVoice,
          referInstrumental: referInstrumental
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate song');
      }

      const data = await response.json();
      console.log('Received data:', data);
      if (data.output && data.output.audio_content) {
        console.log('Audio content length:', data.output.audio_content.length);
        
        // Convert base64 to Blob
        const byteCharacters = atob(data.output.audio_content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: data.output.content_type || 'audio/mpeg'});
        
        console.log('Blob size:', blob.size);
        
        // Create Blob URL
        const audioUrl = URL.createObjectURL(blob);
        setAudioUrl(audioUrl);
      } else {
        throw new Error('Invalid output format from API');
      }
    } catch (error) {
      console.error("Error generating song:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (audioUrl) {
      const audio = audioRef.current;
      audio.src = audioUrl;
      console.log('Setting audio source:', audioUrl);
      audio.load(); // Explicitly load the audio

      return () => {
        URL.revokeObjectURL(audioUrl);
      };
    }
  }, [audioUrl]);

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
    width: '180px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const inputContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '30px',
    padding: '5px',
    margin: '10px 0',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    width: '100%',
  };

  return (
    <main className="container" style={containerStyle}>
      <div className="logo">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 18.5L4 17v-7.5L12 5l8 4.5V17l-8 3.5z"/>
        </svg>
        <h1>Vega Music</h1>
      </div>
      
      <div className="searchContainer" style={inputContainerStyle}>
        <input
          type="text"
          placeholder="Enter your lyrics here"
          className="searchInput"
          value={lyrics}
          onChange={handleLyricsChange}
          style={{ flexGrow: 1, border: 'none', background: 'transparent', padding: '10px 15px', fontSize: '16px', outline: 'none' }}
        />

        <button 
          className="createButton" 
          onClick={() => {
            console.log("Button clicked");
            createSong();
          }}
          disabled={isLoading}
          style={buttonStyle}
        >
          {isLoading ? <div className="loader"></div> : "Create a Song"}
        </button>
      </div>

      {audioUrl && (
        <div className="outputContainer">
          <h2>Generated Song:</h2>
          <audio 
            ref={audioRef} 
            controls 
            onError={(e) => {
              console.error('Audio error:', e);
              console.error('Audio error details:', e.target.error);
              console.error('Audio src:', e.target.src);
              console.log(audioRef)
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
