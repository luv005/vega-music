import axios from 'axios';
import FormData from 'form-data';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { lyrics, referVoice, referInstrumental } = req.body;

  if (!lyrics) {
    res.status(400).json({ message: 'Lyrics are required' });
    return;
  }

  try {
    const apiKey = process.env.MINIMAXI_API_KEY;
    if (!apiKey) {
      throw new Error('MINIMAXI_API_KEY environment variable is not set');
    }

    const formData = new FormData();
    formData.append('refer_voice', referVoice || '');
    formData.append('refer_instrumental', referInstrumental || '');
    formData.append('lyrics', lyrics);
    formData.append('model', 'music-01');
    formData.append('audio_setting', JSON.stringify({
      sample_rate: 44100,
      bitrate: 256000,
      format: 'mp3'
    }));

    const response = await axios.post(
      'https://api.minimax.chat/v1/music_generation',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        }
      }
    );

    const audioData = response.data; // Adjust this based on the actual response structure

    res.status(200).json({ output: audioData });
  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ message: 'Error generating music', error: error.message });
  }
}