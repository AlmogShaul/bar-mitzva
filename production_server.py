#!/usr/bin/env python3
"""
Production Flask server for Bar Mitzvah app - Local Docker version
Serves both React frontend and API endpoints
"""

import os
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
import tempfile
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Store for temporary files and results
temp_dir = tempfile.mkdtemp()
results_store = {}

# Initialize models lazily to speed up startup
stt = None
phonetics = None

def get_stt():
    global stt
    if stt is None:
        from speech_to_text import SpeechToText
        print("Loading Whisper model...")
        stt = SpeechToText()
        print("Whisper model loaded!")
    return stt

def get_phonetics():
    global phonetics
    if phonetics is None:
        from phonetics import Phonetics
        print("Loading phonetics analyzer...")
        phonetics = Phonetics()
        print("Phonetics analyzer loaded!")
    return phonetics

# Serve React app at root
@app.route('/')
def serve_react_app():
    return send_from_directory('static', 'index.html')

# Serve React static files (JS, CSS, images) - Fixed routing
@app.route('/static/<path:filename>')
def serve_react_static(filename):
    # The React build creates files in static/static/, so we need to serve from there
    return send_from_directory('static/static', filename)

# Serve React public files (manifest, favicon, etc.)
@app.route('/<path:filename>')
def serve_react_public(filename):
    # Skip API routes
    if filename.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404

    try:
        # Try to serve from static directory first
        return send_from_directory('static', filename)
    except:
        # If not found and not an API route, serve React app for client-side routing
        return send_from_directory('static', 'index.html')

# Health check for Cloud Run
@app.route('/health')
@app.route('/api/health')
def health_check():
    return jsonify({"status": "healthy", "message": "Bar Mitzvah API is running"})

@app.route('/api/rabbi-audio', methods=['GET'])
def get_rabbi_audio():
    pasuk_id = request.args.get('pasuk_id')
    if not pasuk_id:
        return jsonify({"error": "Pasuk ID is required"}), 400

    try:
        rabbi_file = os.path.join('audio', f'{pasuk_id}.m4a')
        if not os.path.exists(rabbi_file):
            return jsonify({"error": "Rabbi audio file not found"}), 404

    except FileNotFoundError:
        return jsonify({"error": "Rabbi audio file not found"}), 404

@app.route('/api/upload-recording', methods=['POST'])
def upload_recording():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        session_id = str(uuid.uuid4())
        filename = f"user_recording_{session_id}.wav"
        filepath = os.path.join(temp_dir, filename)

        audio_file.save(filepath)

        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": "Recording uploaded successfully"
        })

    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/api/compare-audio', methods=['POST'])
def compare_audio():
    try:
        data = request.get_json()
        session_id = data.get('session_id')

        pasuk_id = data.get('pasuk_id')
        if not session_id:
            return jsonify({"error": "Session ID required"}), 400

        user_file = os.path.join(temp_dir, f"user_recording_{session_id}.wav")
        if not pasuk_id:
            return jsonify({"error": "Pasuk ID required"}), 400

        rabbi_file = 'old/b1.mp3'
        rabbi_file = os.path.join('audio', f'{pasuk_id}.m4a')
        if not os.path.exists(user_file):
            return jsonify({"error": "User recording not found"}), 404

        if not os.path.exists(rabbi_file):
            return jsonify({"error": "Rabbi recording not found"}), 404

        from prosody import extract_pitch_contour, compare_pitch, plot_pitch
        from rapidfuzz import fuzz

        stt_model = get_stt()
        phonetics_model = get_phonetics()

        print("Transcribing rabbi's audio...")
        rabbi_text = stt_model.transcribe(rabbi_file, language="he")

        print("Transcribing user's audio...")
        user_text = stt_model.transcribe(user_file, language="he")

        try:
            rabbi_phones = phonetics_model.text_to_phones(rabbi_text)
            user_phones = phonetics_model.text_to_phones(user_text)
            phonetic_score = fuzz.ratio(rabbi_phones, user_phones)
        except Exception as e:
            print(f"Phonetic analysis warning: {e}")
            phonetic_score = fuzz.ratio(rabbi_text, user_text)

        print("Extracting pitch contours...")
        rabbi_pitch = extract_pitch_contour(rabbi_file)
        user_pitch = extract_pitch_contour(user_file)
        prosody_score = compare_pitch(rabbi_pitch, user_pitch)

        overall_score = (phonetic_score * 0.6) + (prosody_score * 0.4)

        plot_filename = f"comparison_{session_id}.png"
        plot_path = os.path.join(temp_dir, plot_filename)
        plot_pitch(rabbi_pitch, user_pitch, save_path=plot_path)

        results = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "rabbi_text": rabbi_text,
            "user_text": user_text,
            "phonetic_score": round(phonetic_score, 2),
            "prosody_score": round(prosody_score, 2),
            "overall_score": round(overall_score, 2),
            "plot_available": True
        }

        results_store[session_id] = results
        return jsonify(results)

    except Exception as e:
        return jsonify({"error": f"Comparison failed: {str(e)}"}), 500

@app.route('/api/comparison-plot/<session_id>')
def get_comparison_plot(session_id):
    try:
        plot_path = os.path.join(temp_dir, f"comparison_{session_id}.png")
        if os.path.exists(plot_path):
            return send_file(plot_path, mimetype='image/png')
        else:
            return jsonify({"error": "Plot not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to serve plot: {str(e)}"}), 500



@app.route('/api/audio/<int:chapter>_<int:pasuk>', methods=['GET'])
def get_audio_file(chapter, pasuk):
    """Serve the audio file for the given chapter and pasuk."""
    print(f"Audio file request for chapter {chapter}, pasuk {pasuk}", flush=True)

    # Ensure the audio folder path is correct
    audio_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'audio'))
    print(f"Resolved audio folder path: {audio_folder}", flush=True)

    filename = f"{chapter}_{pasuk}.m4a"
    filepath = os.path.join(audio_folder, filename)

    print(f"Looking for audio file at: {filepath}", flush=True)

    if os.path.exists(filepath):
        print(f"Serving audio file: {filepath}", flush=True)
        return send_file(filepath, as_attachment=False, mimetype='audio/mpeg')
    else:
        print(f"Audio file not found: {filepath}", flush=True)
        return jsonify({"error": "Audio file not found"}), 404




@app.route('/api/pasuk-info')
def get_pasuk_info():
    pasuk_info = {
        "id": 1,
        "book": "בראשית",
        "chapter": 1,
        "verse": 1,
        "hebrew": "בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ",
        "transliteration": "B'reishit bara Elohim et hashamayim v'et ha'aretz",
        "translation": "In the beginning God created the heavens and the earth",
        "reference": "Genesis 1:1"
    }
    return jsonify(pasuk_info)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting Bar Mitzvah production server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
