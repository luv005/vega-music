import { exec } from 'child_process';
import fs from 'fs';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { prompt, isSong } = req.body;

    if (isSong) {
      // Call Python script for Bark model
      exec(`python bark_generator.py "${prompt}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).json({ error: 'Failed to generate song' });
        }
        
        const audioPath = 'generated_song.wav';
        const audioData = fs.readFileSync(audioPath);
        const base64Audio = audioData.toString('base64');
        
        res.status(200).json({ output: `data:audio/wav;base64,${base64Audio}` });
      });
    } else {
      // Existing melody generation logic
      // ...
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}