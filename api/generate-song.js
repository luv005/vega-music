import axios from 'axios';
import FormData from 'form-data';

export default async function generateSongHandler(req, res, env) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { lyrics, referVoice, referInstrumental } = req.body;
  console.log(lyrics, referVoice, referInstrumental);

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
      bitrate: 128000,
      format: 'mp3'
    }));

    const response = await axios.post(
      'https://api.minimax.chat/v1/music_generation',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...formData.getHeaders()
        },
        responseType: 'arraybuffer'
      }
    );
    console.log('API response status:', response.status);
    console.log('API response headers:', response.headers);
    console.log('API response data length:', response.data.length);
    const audioContent = Buffer.from(response.data).toString('base64');
    console.log('Base64 audio content length:', audioContent.length);
    res.status(200).json({ 
      message: "Song generated successfully", 
      output: { 
        audio_content: audioContent,
        content_type: 'audio/mpeg'  // Add this line
      } 
    });
  } catch (error) {
    console.error('Error generating music:', error);
    res.status(500).json({ message: "Error generating song", error: error.message });
  }
}