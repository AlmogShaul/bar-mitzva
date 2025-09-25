"""
phonetics.py
מודול להמרת טקסט לייצוג פונטי (IPA או גרפמות).
"""

import re

# ננסה לייבא Epitran
EPITRAN_AVAILABLE = False
try:
    import epitran
    EPITRAN_AVAILABLE = True
except ImportError:
    EPITRAN_AVAILABLE = False


class Phonetics:
    def __init__(self, lang_code: str = "heb-Hebr"):
        self.lang_code = lang_code
        self.epi = None

        if EPITRAN_AVAILABLE:
            try:
                self.epi = epitran.Epitran(lang_code)
            except Exception as e:
                print("[אזהרה] לא ניתן לטעון Epitran:", e)
                self.epi = None

    def to_phonemes(self, text: str) -> str:
        if self.epi:
            try:
                ipa = self.epi.transliterate(text)
                return ipa.strip()
            except Exception as e:
                print("[שגיאה] Epitran נכשל, נשתמש בפולבק:", e)
                return self._fallback(text)
        else:
            return self._fallback(text)

    def text_to_phones(self, text: str) -> str:
        """Alias for to_phonemes to match API server expectations"""
        return self.to_phonemes(text)

    def _fallback(self, text: str) -> str:
        s = text.lower()
        s = re.sub(r"[^\w\s֐-׿]", "", s)
        return s.replace(" ", "")
