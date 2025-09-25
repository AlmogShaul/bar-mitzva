"""
speech_to_text.py
מודול לטרנסקריפציה באמצעות Whisper (קוד פתוח).
"""

import whisper
import pickle

class SpeechToText:
    def __init__(self, model_name: str = "medium"):
        self.model_name = model_name
        self.model = self._load_or_initialize_model()

    def _load_or_initialize_model(self):
        model_cache_path = f"{self.model_name}_model.pkl"
        try:
            with open(model_cache_path, "rb") as f:
                print(f"Loading cached model: {self.model_name}")
                return pickle.load(f)
        except FileNotFoundError:
            print(f"{self.model_name} loading...")
            model = whisper.load_model(self.model_name)
            with open(model_cache_path, "wb") as f:
                pickle.dump(model, f)
            print(f"Model cached: {self.model_name}")
            return model

    def transcribe(self, audio_file: str, language: str = "he") -> str:
        result = self.model.transcribe(audio_file, language=language)
        return result["text"].strip()
