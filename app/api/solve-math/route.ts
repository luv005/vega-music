import { NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from "openai/resources/chat";
import OpenAI from "openai";

export async function POST(req: Request) {
  const openai = new OpenAI();
  const { image, input } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
  }

  if (image && image.length > 200000) { // Adjust the size limit as needed
    console.error('Image data is too large');
    return NextResponse.json({ error: 'Image data is too large' }, { status: 400 });
  }

  try {
    console.log('Sending request to OpenAI API...');
    const messages: ChatCompletionMessageParam[] = [];

    if (input) {
      messages.push({
        role: "user",
        content: input,
      });
    }

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Solve the math problem in this image and explain the solution step by step." },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Corrected model name
      messages,
    });

    const solution = response.choices[0].message.content; // Directly access the response
    return NextResponse.json({ solution });
  } catch (error) {
    console.error('Error in solve-math API:', error);
    return NextResponse.json({ error: 'Failed to solve math problem', details: (error as Error).message }, { status: 500 });
  }
}