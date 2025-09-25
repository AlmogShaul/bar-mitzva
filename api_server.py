#!/usr/bin/env python3
"""
Flask API server for Bar Mitzvah audio comparison
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import uuid
from datetime import datetime
import json
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

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

@app.route('/api/health', methods=['GET'])
def health_check():
    logging.debug("Health check endpoint called")
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Bar Mitzvah API is running"})

@app.route('/api/rabbi-audio', methods=['GET'])
def get_rabbi_audio():
    logging.debug("Rabbi audio endpoint called")
    """Serve the rabbi's reference audio file"""
    try:
        return send_file('old/b1.mp3', as_attachment=False, mimetype='audio/mpeg')
    except FileNotFoundError:
        logging.error("Rabbi audio file not found")
        return jsonify({"error": "Rabbi audio file not found"}), 404

@app.route('/api/upload-recording', methods=['POST'])
def upload_recording():
    logging.debug("Upload recording endpoint called")
    """Receive and process user's recording"""
    try:
        if 'audio' not in request.files:
            logging.warning("No audio file provided in request")
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files['audio']
        if audio_file.filename == '':
            logging.warning("No file selected for upload")
            return jsonify({"error": "No file selected"}), 400

        # Generate unique filename
        session_id = str(uuid.uuid4())
        filename = f"user_recording_{session_id}.wav"
        filepath = os.path.join(temp_dir, filename)

        # Save the uploaded file
        audio_file.save(filepath)
        logging.info(f"Recording uploaded successfully: {filename}")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": "Recording uploaded successfully"
        })

    except Exception as e:
        logging.error(f"Upload failed: {str(e)}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500

@app.route('/api/compare-audio', methods=['POST'])
def compare_audio():
    logging.debug("Compare audio endpoint called")
    """Compare user's recording with rabbi's recording"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        logging.debug(f"Session ID: {session_id}")

        if not session_id:
            logging.warning("Session ID not provided in request")
            return jsonify({"error": "Session ID required"}), 400

        # File paths
        user_file = os.path.join(temp_dir, f"user_recording_{session_id}.wav")
        if not os.path.exists(user_file):
            logging.error("User recording not found")
            return jsonify({"error": "User recording not found"}), 404

        # Dynamically select the rabbi's audio file based on the pasuk ID
        pasuk_id = data.get('pasuk_id')
        logging.debug(f"Pasuk ID: {pasuk_id}")
        if not pasuk_id:
            logging.warning("Pasuk ID not provided in request")
            return jsonify({"error": "Pasuk ID required"}), 400

        rabbi_file = f"../bar-mitzva-1/audio/{pasuk_id}.m4a"
        if not os.path.exists(rabbi_file):
            logging.error("Rabbi recording not found")
            return jsonify({"error": "Rabbi recording not found"}), 404

        # Import prosody functions
        from prosody import extract_pitch_contour, compare_pitch, plot_pitch
        from rapidfuzz import fuzz

        # Initialize models when needed
        stt_model = get_stt()
        phonetics_model = get_phonetics()

        logging.debug("Transcribing rabbi's audio")
        rabbi_text = stt_model.transcribe(rabbi_file, language="he")
        logging.debug(f"Rabbi transcription: {rabbi_text}")

        logging.debug("Transcribing user's audio")
        user_text = stt_model.transcribe(user_file, language="he")
        logging.debug(f"User transcription: {user_text}")

        # Phonetic comparison
        try:
            rabbi_phones = phonetics_model.text_to_phones(rabbi_text)
            user_phones = phonetics_model.text_to_phones(user_text)
            phonetic_score = fuzz.ratio(rabbi_phones, user_phones)
            logging.debug(f"Phonetic score: {phonetic_score}")
        except Exception as e:
            logging.warning(f"Phonetic analysis warning: {e}")
            # Fallback to simple text comparison
            phonetic_score = fuzz.ratio(rabbi_text, user_text)

        logging.debug("Extracting pitch contours")
        rabbi_pitch = extract_pitch_contour(rabbi_file)
        user_pitch = extract_pitch_contour(user_file)
        prosody_score = compare_pitch(rabbi_pitch, user_pitch)
        logging.debug(f"Prosody score: {prosody_score}")

        # Calculate overall score (weighted average)
        overall_score = (phonetic_score * 0.6) + (prosody_score * 0.4)
        logging.info(f"Overall score: {overall_score}")

        # Generate comparison plot
        plot_filename = f"comparison_{session_id}.png"
        plot_path = os.path.join(temp_dir, plot_filename)
        plot_pitch(rabbi_pitch, user_pitch, save_path=plot_path)
        logging.debug(f"Comparison plot saved: {plot_path}")

        # Store results
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
        logging.info(f"Results stored for session: {session_id}")

        return jsonify(results)

    except Exception as e:
        logging.error(f"Comparison failed: {str(e)}")
        return jsonify({"error": f"Comparison failed: {str(e)}"}), 500

@app.route('/api/comparison-plot/<session_id>', methods=['GET'])
def get_comparison_plot(session_id):
    """Serve the comparison plot image"""
    try:
        plot_path = os.path.join(temp_dir, f"comparison_{session_id}.png")
        if os.path.exists(plot_path):
            return send_file(plot_path, mimetype='image/png')
        else:
            return jsonify({"error": "Plot not found"}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to serve plot: {str(e)}"}), 500

@app.route('/api/results/<session_id>', methods=['GET'])
def get_results(session_id):
    """Get stored results for a session"""
    if session_id in results_store:
        return jsonify(results_store[session_id])
    else:
        return jsonify({"error": "Results not found"}), 404

@app.route('/api/pasuk-info', methods=['GET'])
def get_pasuk_info():
    """Get information about the current pasuk (Genesis 1:1)"""
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


@app.route('/api/ok', methods=['GET'])
def get_OK():
    return jsonify("OK")


@app.route('/api/audio/<int:chapter>_<int:pasuk>', methods=['GET'])
def get_audio_file(chapter, pasuk):
    """Serve the audio file for the given chapter and pasuk."""
    logging.debug(f"Audio file request for chapter {chapter}, pasuk {pasuk}")
    print(f"Audio file request for chapter {chapter}, pasuk {pasuk}", flush=True)

    # Ensure the audio folder path is correct
    audio_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'audio'))
    logging.debug(f"Resolved audio folder path: {audio_folder}")
    print(f"Resolved audio folder path: {audio_folder}", flush=True)

    filename = f"{chapter}_{pasuk}.m4a"
    filepath = os.path.join(audio_folder, filename)

    logging.debug(f"Looking for audio file at: {filepath}")
    print(f"Looking for audio file at: {filepath}", flush=True)

    if os.path.exists(filepath):
        logging.info(f"Serving audio file: {filepath}")
        print(f"Serving audio file: {filepath}", flush=True)
        return send_file(filepath, as_attachment=False, mimetype='audio/mpeg')
    else:
        logging.warning(f"Audio file not found: {filepath}")
        print(f"Audio file not found: {filepath}", flush=True)
        return jsonify({"error": "Audio file not found"}), 404

@app.route('/api/audio/group', methods=['POST'])
def get_group_audio():
    """Serve concatenated audio for a group of psukim."""
    data = request.get_json()
    psukim = data.get('psukim', [])  # List of {chapter, pasuk}

    audio_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), 'audio'))
    audio_files = []

    for pasuk in psukim:
        chapter = pasuk.get('chapter')
        pasuk_num = pasuk.get('pasuk')
        filename = f"{chapter}_{pasuk_num}.m4a"
        filepath = os.path.join(audio_folder, filename)
        if os.path.exists(filepath):
            audio_files.append(filepath)
        else:
            return jsonify({"error": f"Audio file not found for chapter {chapter}, pasuk {pasuk_num}"}), 404

    # Concatenate audio files (placeholder logic, actual implementation may vary)
    concatenated_audio_path = os.path.join(audio_folder, 'group_audio.m4a')
    with open(concatenated_audio_path, 'wb') as outfile:
        for audio_file in audio_files:
            with open(audio_file, 'rb') as infile:
                outfile.write(infile.read())

    return send_file(concatenated_audio_path, as_attachment=False, mimetype='audio/mpeg')


if __name__ == '__main__':
    print(f"Temporary files will be stored in: {temp_dir}")
    print("Starting Bar Mitzvah API server...")
    print("Note: AI models will be loaded on first use to speed up startup")
    app.run(debug=True, host='0.0.0.0', port=5001)

