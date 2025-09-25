"""
prosody.py
מודול לניתוח פרוזודיה (pitch contour) מהקלטות קול.
"""

import librosa
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend to prevent threading issues
import matplotlib.pyplot as plt


def extract_pitch_contour(audio_file: str, sr: int = 16000) -> np.ndarray:
    y, sr = librosa.load(audio_file, sr=sr)
    f0 = librosa.yin(y, fmin=50, fmax=400, sr=sr)
    target_len = 200
    f0_interp = np.interp(
        np.linspace(0, len(f0), target_len),
        np.arange(len(f0)),
        f0
    )
    return f0_interp


def compare_pitch(pitch_ref: np.ndarray, pitch_child: np.ndarray) -> float:
    pitch_ref = (pitch_ref - np.mean(pitch_ref)) / np.std(pitch_ref)
    pitch_child = (pitch_child - np.mean(pitch_child)) / np.std(pitch_child)
    dot = np.dot(pitch_ref, pitch_child)
    norm = np.linalg.norm(pitch_ref) * np.linalg.norm(pitch_child)
    similarity = dot / norm
    return float(similarity * 100)


def plot_pitch(pitch_ref: np.ndarray, pitch_child: np.ndarray, save_path: str = "pitch_comparison.png"):
    plt.figure(figsize=(10, 4))
    plt.plot(pitch_ref, label="רב (Reference)", color="blue")
    plt.plot(pitch_child, label="ילד (Child)", color="orange")
    plt.title("השוואת מלודיה (Pitch Contour)")
    plt.xlabel("זמן (מדדים נורמליים)")
    plt.ylabel("גובה קול (Hz)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
