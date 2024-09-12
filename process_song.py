from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback
import openai
import boto3
from botocore.exceptions import NoCredentialsError
import requests
import time
from dotenv import load_dotenv

app = Flask(__name__, static_folder='build', static_url_path='/')
CORS(app)

# Load environment variables
load_dotenv()

# AWS S3 configuration
S3_BUCKET = 'vegasongs'
S3_REGION = 'ap-southeast-1'

# Initialize S3 client
s3_client = boto3.client('s3', region_name=S3_REGION)

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

@app.route('/')
def serve():
    return app.send_static_file('index.html')

@app.route('/api/generate_lyrics', methods=['POST'])
def generate_lyrics_route():
    print("Received request:", request.json)  # Log the received request
    if 'theme' not in request.json:
        return jsonify({'error': 'No theme provided'}), 400

    theme = request.json['theme']

    try:
        lyrics = generate_lyrics(theme)
        return jsonify({'lyrics': lyrics})
    except Exception as e:
        print(f"Error generating lyrics: {str(e)}")
        return jsonify({'error': 'Failed to generate lyrics: ' + str(e)}), 500

@app.route('/api/process_song', methods=['POST'])
def process_song():
    print("Received request:", request.json)
    if 'lyrics' not in request.json:
        return jsonify({'error': 'No lyrics provided'}), 400

    lyrics = request.json['lyrics']

    try:
        api_key = get_api_key()
        print(f"API Key (first 5 chars): {api_key[:5]}...")
        
        refer_instrumental = "instrumental-2024091210533224-2535"
        refer_voice = "vocal-2024091210533224-2508"

        print("Generating song...")
        audio_content = create_song(lyrics, refer_voice, refer_instrumental)

        print("Saving audio file...")
        output_filename = f'output_{int(time.time())}.mp3'
        output_path = os.path.join('public', 'generated_songs', output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(bytes.fromhex(audio_content))
        
        # Upload file to S3
        s3_file_path = f'generated_songs/{output_filename}'
        
        s3_client.upload_file(
            output_path, 
            S3_BUCKET, 
            s3_file_path,
            ExtraArgs={'ContentType': 'audio/mpeg'}
        )
        
        # Generate URL for the audio file in S3
        audio_url = f'https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_file_path}'
        
        # Remove local file after uploading to S3
        os.remove(output_path)
        
        response_data = {'audio_url': audio_url}
        print("Sending response:", response_data)
        return jsonify(response_data)
    
    except requests.exceptions.RequestException as e:
        print(f"Error in API request: {e}")
        return jsonify({'error': 'Failed to generate song: ' + str(e)}), 500
    except NoCredentialsError:
        return jsonify({'error': 'AWS credentials not available'}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': 'An unexpected error occurred: ' + str(e)}), 500

@app.route('/generated_songs/<path:filename>')
def serve_audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error
    app.logger.error(f"Unhandled exception: {str(e)}")
    # Return JSON instead of HTML for HTTP errors
    return jsonify(error=str(e)), 500

@app.route('/api/test', methods=['GET'])
def test_route():
    print("Test route accessed")
    return jsonify({"message": "Server is running"}), 200

def generate_lyrics(theme):
    print("Generating lyrics for theme:", theme)
    try:
        chat_completion = openai.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": f"Write song lyrics (no more than 70 words) with the theme: {theme}. The lyrics should be creative and engaging.",

                }
            ],
            model="gpt-4o-mini",
        )

        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating lyrics: {str(e)}")
        raise Exception("Failed to generate lyrics")


if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5000)