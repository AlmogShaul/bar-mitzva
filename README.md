# פרויקט בר מצווה - השוואת קריאה

הפרויקט מיועד להשוות בין קריאת הרב לבין קריאת הילד מבחינת:
- טקסט (טרנסקריפציה עם Whisper)
- פונמות (Epitran או fallback פשוט)
- מלודיה / טעמים (Pitch Contour עם librosa)


## 📂 קבצים בפרויקט
- `speech_to_text.py` - טרנסקריפציה עם Whisper
- `phonetics.py` - המרה לפונמות
- `prosody.py` - ניתוח מלודיה והשוואת Pitch + גרף
- `compare_audio.py` - סקריפט ראשי
- `requirements.txt` - רשימת ספריות להתקנה



## 🚀 הוראות הפעלה

1. התקנת חבילות:
```bash
pip install -r requirements.txt
```

2. הרצה:
```bash
python compare_audio.py ref.wav child.wav --model small --lang he
```

- `ref.wav` = קריאת הרב
- `child.wav` = קריאת הילד

3. הפלט יכלול:
- טקסט הרב והילד (טרנסקריפציה)
- ציון דמיון פונמות
- ציון דמיון מלודיה
- ציון סופי משוקלל
- קובץ תמונה `pitch_comparison.png` שמציג השוואת גרפים

## ⚖️ הערות
- ברירת המחדל של המודל היא `small`, אפשר לשנות ל- `base`, `medium`, או `large` לפי ביצועי המחשב.
- אם Epitran לא מותקן/נתמך, יש fallback פשוט להשוואת טקסט בלי ניקוד.
- לעברית מקראית מדויקת יותר אפשר לשלב בעתיד G2P מותאם (למשל Phonikud).

בהצלחה 🚀
# bar-mitzva
