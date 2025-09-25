"""
speech_to_text.py
מודול לטרנסקריפציה באמצעות Whisper (קוד פתוח).
"""

import whisper

class SpeechToText:
    def __init__(self, model_name: str = "v2-d4-ivrit"):
        self.model = whisper.load_model(model_name)

    def transcribe(self, audio_file: str, language: str = "he") -> str:
        result = self.model.transcribe(audio_file, language=language)
        return result["text"].strip()
