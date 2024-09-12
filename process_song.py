from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback
import openai
import boto3
from botocore.exceptions import NoCredentialsError
from main import generate_song  # Import the function from main.py

app = Flask(__name__, static_folder='build', static_url_path='/')
CORS(app)

# AWS S3 configuration
S3_BUCKET = 'vegasongs'
S3_REGION = 'ap-southeast-1'

# Initialize S3 client
s3_client = boto3.client('s3', region_name=S3_REGION)

openai.api_key = os.getenv("OPENAI_API_KEY")

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
    print("Received request:", request.json)  # Log the received request
    if 'lyrics' not in request.json:
        return jsonify({'error': 'No lyrics provided'}), 400

    lyrics = request.json['lyrics']

    try:
        # Call the generate_song function directly
        output_filename = generate_song(lyrics)
        
        print("Output filename:", output_filename)
        
        if not output_filename:
            raise ValueError("No output filename received from generate_song")
        
        # Upload file to S3
        local_file_path = os.path.join('public/generated_songs', output_filename)
        s3_file_path = f'generated_songs/{output_filename}'
        
        s3_client.upload_file(
            local_file_path, 
            S3_BUCKET, 
            s3_file_path,
            ExtraArgs={'ContentType': 'audio/mpeg'}
        )
        
        # Generate URL for the audio file in S3
        audio_url = f'https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_file_path}'
        
        # Remove local file after uploading to S3
        os.remove(local_file_path)
        
        response_data = {'audio_url': audio_url}
        print("Sending response:", response_data)
        return jsonify(response_data)
    
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