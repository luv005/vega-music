import React, { useState } from 'react';
import './App.css'; // Ensure this import is present

function App() {
  const [lyrics, setLyrics] = useState('');
  const [theme, setTheme] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Pop');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [error, setError] = useState(null);

  const handleLyricsChange = (e) => setLyrics(e.target.value);
  const handleThemeChange = (e) => setTheme(e.target.value);
  const handleStyleChange = (e) => setSelectedStyle(e.target.value);

  const generateLyrics = async () => {
    if (!theme.trim()) {
      setError('Please enter a theme for the lyrics.');
      return;
    }

    setIsGeneratingLyrics(true);
    setError(null);

    try {
      const response = await fetch('http://13.228.25.164:5000/api/generate_lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate lyrics');
      }

      const data = await response.json();
      const generatedLyrics = data.lyrics;

      // Display lyrics one line at a time
      console.log(generatedLyrics);
      setLyrics('');
      for (const line of generatedLyrics.split('\n')) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay between lines
        setLyrics(prevLyrics => prevLyrics + line + '\n');
      }
    } catch (err) {
      setError('Error generating lyrics. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const generateSong = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://13.228.25.164:5000/api/process_song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lyrics, style: selectedStyle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate song');
      }

      const data = await response.json();
      console.log("data", data);
      const newSong = { 
        lyrics, 
        style: selectedStyle, 
        id: Date.now(),
        audioUrl: data.audio_url 
      };
      console.log("newSong", newSong);
      setCurrentSong(newSong);
    } catch (err) {
      setError('Error generating song. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1>Vega Music</h1>
        <input
          type="text"
          placeholder="Enter a song title..."
          value={theme}
          onChange={handleThemeChange}
          className="theme-input"
        />
        <button 
          onClick={generateLyrics} 
          disabled={isGeneratingLyrics} 
          className="generate-lyrics-btn"
        >
          {isGeneratingLyrics ? 'Writing Lyrics...' : 'Write Lyrics for Me'}
        </button>
        <textarea
          placeholder="Enter your lyrics here..."
          value={lyrics}
          onChange={handleLyricsChange}
          className="lyrics-input"
        />
        <div className="style-selection">
          <h3>Choose a style:</h3>
          <div className="style-options">
            {['Pop', 'Rock', 'Jazz', 'Classical'].map(style => (
              <label key={style}>
                <input
                  type="radio"
                  value={style}
                  checked={selectedStyle === style}
                  onChange={handleStyleChange}
                />
                {style}
              </label>
            ))}
          </div>
        </div>
        {currentSong && (
          <div className="current-song">
            <h3>Generated Song</h3>
            <audio controls src={currentSong.audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <button onClick={generateSong} disabled={isLoading} className="generate-btn">
          {isLoading ? 'Generating...' : 'Generate Song'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
      {/* <div className="right-panel">
        <h2>Generated Songs</h2>
        <ul className="song-list">
          {generatedSongs.map(song => (
            <li key={song.id} className="song-item">
              <p><strong>Lyrics:</strong> {song.lyrics}</p>
              <p><strong>Style:</strong> {song.style}</p>
              <audio controls src={song.audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </li>
          ))}
        </ul>
      </div> */}
    </div>
  );
}

export default App;
