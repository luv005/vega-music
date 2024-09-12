import requests
import base64
import os
import json
import sys
import time
import traceback
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def get_api_key():
    api_key = os.environ.get('MINIMAXI_API_KEY')
    if not api_key:
        raise ValueError("MINIMAXI_API_KEY environment variable is not set")
    return api_key

def create_song(lyrics, refer_voice, refer_instrumental):
    print("Creating song...", refer_voice)
    url = "https://api.minimax.chat/v1/music_generation"
    api_key = get_api_key()

    payload = {
        'refer_voice': refer_voice,
        'refer_instrumental': refer_instrumental,
        'lyrics': lyrics,
        'model': 'music-01',
        'audio_setting': '{"sample_rate":44100,"bitrate":256000,"format":"mp3"}'
    }

    headers = {
        'authorization': 'Bearer ' + api_key,
    }
    print(payload, headers)
    response = requests.post(url, headers=headers, data=payload)
    response.raise_for_status()  # This will raise an exception for HTTP errors
    return response.json()['data']['audio']

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("No lyrics provided")
        
        lyrics = sys.argv[1]
        api_key = get_api_key()  # Check if the API key is available at the start
        print(f"API Key (first 5 chars): {api_key[:5]}...", file=sys.stderr)
        
        # For this example, we're using pre-defined IDs
        refer_instrumental = "instrumental-2024091210533224-2535"
        refer_voice = "vocal-2024091210533224-2508"

        print("Generating song...", file=sys.stderr)
        audio_content = create_song(lyrics, refer_voice, refer_instrumental)

        print("Saving audio file...", file=sys.stderr)
        output_filename = f'output_{int(time.time())}.mp3'
        output_path = os.path.join('public', 'generated_songs', output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(bytes.fromhex(audio_content))
        
        print(output_filename)  # Print only the filename for the server to read
        sys.stdout.flush()  # Ensure the output is immediately written

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)  # Print the full traceback
        sys.stderr.flush()  # Ensure the error is immediately written
        sys.exit(1)

if __name__ == "__main__":
    main()