import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import generateSongHandler from './api/generate-song.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve static files from the Vite build output directory
app.use(express.static(join(__dirname, 'dist')));

// API route
app.post('/api/generate-song', (req, res) => {
  const { lyrics } = req.body;
  
  const pythonProcess = spawn('python', ['process_song.py', lyrics]);

  let outputData = '';

  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python script error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({ message: 'Failed to generate song' });
    }
    
    // Assuming the Python script saves the file and returns the filename
    const audioUrl = `/generated_songs/${outputData.trim()}`;
    res.json({ audioUrl });
  });
});

// Serve the index.html for any other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${join(__dirname, 'dist')}`);
});