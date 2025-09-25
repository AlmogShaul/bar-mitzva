#!/usr/bin/env python3
"""
compare_audio.py
השוואת קריאת הרב מול הילד: פונמות + מלודיה.
"""

import argparse
import os
import sys

from speech_to_text import SpeechToText
from phonetics import Phonetics
from prosody import extract_pitch_contour, compare_pitch, plot_pitch

from rapidfuzz import fuzz


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="small", help="Whisper model (tiny, base, small, medium, large)")
    parser.add_argument("--lang", default="he", help="שפה (ברירת מחדל: עברית)")
    args = parser.parse_args()
    args.ref = 'b1.mp3'
    args.child = 'b2.mp3'
    if not os.path.isfile(args.ref) or not os.path.isfile(args.child):
        print("קבצי קול לא קיימים.")
        sys.exit(1)

    # --- שלב 1: טרנסקריפציה ---
    stt = SpeechToText(model_name=args.model)
    ref_text = stt.transcribe(args.ref, language=args.lang)
    child_text = stt.transcribe(args.child, language=args.lang)

    print("טקסט הרב:", ref_text)
    print("טקסט הילד:", child_text)

    # --- שלב 2: השוואה פונמות ---
    phon = Phonetics(lang_code="heb-Hebr")
    ref_ph = phon.to_phonemes(ref_text)
    child_ph = phon.to_phonemes(child_text)
    phon_score = fuzz.ratio(ref_ph, child_ph)

    # --- שלב 3: השוואת מלודיה (pitch contour) ---
    pitch_ref = extract_pitch_contour(args.ref)
    pitch_child = extract_pitch_contour(args.child)
    prosody_score = compare_pitch(pitch_ref, pitch_child)
    plot_pitch(pitch_ref, pitch_child, "pitch_comparison.png")

    # --- שלב 4: ציון משוקלל ---
    final_score = 0.6 * phon_score + 0.4 * prosody_score

    print("\n--- תוצאות ---")
    print("דמיון פונמות:", phon_score)
    print("דמיון מלודיה:", prosody_score)
    print("ציון כולל:", final_score)
    print("גרף השוואה נשמר ב- pitch_comparison.png")


if __name__ == "__main__":
    main()
