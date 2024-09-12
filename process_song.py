from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import subprocess
import time
import traceback
import os
import openai
import requests
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='build', static_url_path='/')
CORS(app)
# Configure this to your desired upload directory
UPLOAD_FOLDER = 'public/generated_songs'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
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
        # Call the main script with lyrics as an argument
        result = subprocess.run(['python', 'main.py', lyrics], 
                                capture_output=True, text=True, check=True)
        
        print("Subprocess stdout:", result.stdout)
        print("Subprocess stderr:", result.stderr)
        
        # The main.py script should print the output filename
        output_filename = result.stdout.strip()
        print("Output filename:", output_filename)  # Log the output filename
        
        if not output_filename:
            raise ValueError("No output filename received from main.py")
        
        # Generate URL for the audio file
        audio_url = f'/generated_songs/{output_filename}'
        
        response_data = {'audio_url': audio_url}
        print("Sending response:", response_data)
        return jsonify(response_data)
    
    except subprocess.CalledProcessError as e:
        print(f"Error in subprocess: {e}")
        print(f"Subprocess stdout: {e.stdout}")
        print(f"Subprocess stderr: {e.stderr}")
        return jsonify({'error': 'Failed to generate song: ' + str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        print(traceback.format_exc())  # Print the full traceback
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
                "content": f"Write song lyrics (no more than 200 words) with the theme: {theme}. The lyrics should be creative and engaging.",

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
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True, port=5000)