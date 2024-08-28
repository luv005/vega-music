import Replicate from "replicate";

export default async function handler(req, res, env) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Method not allowed' }));
    return;
  }

  const { prompt } = req.body;

  if (!prompt) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Prompt is required' }));
    return;
  }

  try {
    const replicate = new Replicate({
      auth: env.VITE_REPLICATE_API_TOKEN,
    });

    const model = "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb";
    const input = {
      prompt: prompt,
      model_version: "stereo-large",
      output_format: "mp3",
      normalization_strategy: "peak"
    };

    const output = await replicate.run(model, { input });

    console.log('Replicate output:', output);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ output }));
  } catch (error) {
    console.error('Error generating music:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Error generating music', error: error.message }));
  }
}