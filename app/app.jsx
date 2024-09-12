import React, { useState, useCallback, useRef, useEffect } from 'react';
// ... other imports ...

function App() {
  // ... existing state and other functions ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (response.ok) {
        const data = await response.json();
        processAndPlayAudio(data.data.audio);
        setResult('Audio generated and played successfully!');
      } else {
        setResult('Error generating audio');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const processAndPlayAudio = useCallback((audioHex) => {
    // Play the audio
    const arrayBuffer = new Uint8Array(audioHex).buffer;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    });

    // Create a Blob and download the file
    const blob = new Blob([new Uint8Array(audioHex)], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // ... rest of the component ...

  return (
    // ... your JSX ...
  );
}

export default App;