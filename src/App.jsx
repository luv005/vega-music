import React, { useState, useCallback } from 'react'
import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioError, setAudioError] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const [audioContext, setAudioContext] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioType, setAudioType] = useState('audio/wav');

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
          referInstrumental: referInstrumental,
          audio_setting: {
            format: 'mp3'  // Set the audio format to mp3
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate song');
      }

      const data = await response.json();
      console.log('Received data:', JSON.stringify(data, null, 2));  // Pretty print the entire response

      console.log('Received data type:', typeof data);
      console.log('Received data keys:', Object.keys(data));
      if (data.data) console.log('data.data keys:', Object.keys(data.data));
      if (data.output) console.log('data.output keys:', Object.keys(data.output));

      let audioBase64;
      if (data.data && data.data.audio) {
        audioBase64 = data.data.audio;
      } else if (data.output && data.output.audio_content) {
        audioBase64 = data.output.audio_content;
      } else if (data.audio_content) {
        audioBase64 = data.audio_content;
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid output format from API');
      }

      console.log('Audio content length:', audioBase64.length);
      
      // Decode the base64 string
      const byteCharacters = atob(audioBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }

      // Log the first few bytes of the decoded content for manual inspection
      console.log('First 32 bytes of audio content:', Array.from(byteArray.slice(0, 32)));

      // Determine the audio format based on the header
      let detectedAudioType = 'audio/mpeg';  // Default to MP3
      if (byteArray[0] === 0xFF && (byteArray[1] === 0xFB || byteArray[1] === 0xF3 || byteArray[1] === 0xF2)) {
        console.log('Detected standard MP3');
      } else if (byteArray[0] === 0x49 && byteArray[1] === 0x44 && byteArray[2] === 0x33) {
        console.log('Detected MP3 with ID3 tag');
      } else if (byteArray[0] === 0x52 && byteArray[1] === 0x49 && byteArray[2] === 0x46 && byteArray[3] === 0x46) {
        console.log('Detected WAV format');
        detectedAudioType = 'audio/wav';
      } else if (byteArray[0] === 0x4F && byteArray[1] === 0x67 && byteArray[2] === 0x67 && byteArray[3] === 0x53) {
        console.log('Detected OGG format');
        detectedAudioType = 'audio/ogg';
      } else {
        console.warn('Unexpected audio format, defaulting to MP3');
        console.log('First four bytes:', byteArray[0], byteArray[1], byteArray[2], byteArray[3]);
      }

      // Create a Blob with the detected audio type
      const blob = new Blob([byteArray], {type: detectedAudioType});
      console.log('Blob size:', blob.size);

      // Create a download link for the audio file
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setAudioType(detectedAudioType);
      console.log('Audio URL created');

      // Log the first 100 characters of the base64 string
      console.log('First 100 characters of audioBase64:', audioBase64.substring(0, 100));
    } catch (error) {
      console.error("Error generating song:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = useCallback(() => {
    if (audioContext && audioBuffer && !isPlaying) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      setIsPlaying(true);
      source.onended = () => setIsPlaying(false);
    }
  }, [audioContext, audioBuffer, isPlaying]);

  // Style definitions
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
          {audioType && (
            <a href={audioUrl} download={`generated_song.${audioType.split('/')[1]}`}>
              Download Generated Song
            </a>
          )}
          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
      {audioError && (
        <div className="outputContainer">
          <p className="error">{audioError}</p>
          <p>A download link for the audio file has been generated.</p>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </main>
  )
}

export default App;
