'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const generateMusic = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate music');
      }

      const data = await response.json();
      setOutput(data.output[0]);
    } catch (error) {
      console.error("Error generating music:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.logo}>
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path fill="currentColor" d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 18.5L4 17v-7.5L12 5l8 4.5V17l-8 3.5z"/>
        </svg>
        <h1>Vega Music</h1>
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="Type the music you want to create"
          className={styles.input}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && generateMusic()}
        />
        <button className={styles.button} onClick={generateMusic} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create'}
        </button>
      </div>
      {output && (
        <div className={styles.outputContainer}>
          <h2>Generated Music:</h2>
          <audio controls src={output}></audio>
        </div>
      )}
    </main>
  );
}