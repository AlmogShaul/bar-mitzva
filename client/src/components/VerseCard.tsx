import React, { useState, useRef } from 'react';
import { Pasuk } from '../data/psukim';
import './VerseCard.css';

interface VerseCardProps {
  pasuk?: Pasuk;
}

interface ComparisonResult {
  session_id: string;
  rabbi_text: string;
  user_text: string;
  phonetic_score: number;
  prosody_score: number;
  overall_score: number;
  plot_available: boolean;
}

export const VerseCard: React.FC<VerseCardProps> = ({ pasuk }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const API_BASE = process.env.NODE_ENV === 'production'
    ? '/api'  // Use relative path in production
    : 'http://localhost:5001/api';  // Use localhost in development

  if(!pasuk) return null;

  const handlePlay = async () => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Dynamically set the audio source based on pasuk.id
        audioRef.current.src = `/audio/${pasuk.id}.m4a`;
        audioRef.current.load(); // Force reload the audio

        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('שגיאה בהשמעת הקובץ / Audio playback failed');
      console.error('Audio playback error:', err);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('מיקרופון לא זמין / Microphone not available');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch(`${API_BASE}/upload-recording`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
      } else {
        setError('העלאת ההקלטה נכשלה / Upload failed');
      }
    } catch (err) {
      setError('העלאת ההקלטה נכשלה / Upload failed');
    }
  };

  const compareWithRabbi = async () => {
    if (!sessionId) {
      setError('אין הקלטה להשוואה / No recording to compare');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      const pasukId = pasuk?.id; // Assuming pasukId is derived from pasuk prop

      const response = await fetch(`${API_BASE}/compare-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, pasuk_id: pasukId }),
      });

      if (response.ok) {
        const result = await response.json();
        setComparisonResult(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'השוואה נכשלה / Comparison failed');
      }
    } catch (err) {
      setError('הניתוח נכשל / Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAudioError = (e: any) => {
    console.error('Audio error:', e);
    setError('קובץ השמע לא נמצא / Audio file not found');
    setIsPlaying(false);
    setIsLoading(false);
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const handleAudioCanPlay = () => {
    setError(null); // Clear any previous errors when audio is ready
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'מצוין! / Excellent!';
    if (score >= 60) return 'טוב, המשך לתרגל / Good, keep practicing';
    return 'צריך עוד תרגול / Needs more practice';
  };
  const hasAudio = !!pasuk.audioUrl; // Check if audioUrl exists for the pasuk
  const canRecord = true; // Enable recording for all psukim

  return (
    <div className="verse-card">
      <div className="verse-header">
        <span className="book-reference">
          {pasuk.book} {pasuk.chapter}:{pasuk.verse}
        </span>
      </div>

      <div className="verse-content">
        <div className="hebrew-text" dir="rtl">
          {pasuk.hebrew}
        </div>
        <div className="transliteration">
          {pasuk.transliteration}
        </div>
        <div className="translation">
          {pasuk.translation}
        </div>
      </div>

      {canRecord && (
        <div className="practice-section">

          <h3>תרגול קריאה / Reading Practice</h3>
          <div className="recording-controls">
            {/* Play button moved here */}
            {hasAudio && (
              <button
                className={`control-button play ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
                onClick={handlePlay}
                disabled={isLoading}
                title={isPlaying ? 'עצור השמעה' : 'השמע פסוק'}
                style={{ marginRight: '8px' }}
              >
                {isLoading ? (
                  <span className="spinner">⟳</span>
                ) : isPlaying ? (
                  '⏸️'
                ) : (
                  '▶️ Play origin'
                )}
              </button>
            )}
            <button
              className={`control-button record ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing || isPlaying}
              title={isRecording ? 'עצור הקלטה / Stop recording' : 'התחל הקלטה / Start recording'}
            >
              {isRecording ? '⏹️ עצור / Stop' : '🎤 הקלט / Record'}
            </button>

            {sessionId && (
              <button
                className="control-button compare"
                onClick={compareWithRabbi}
                disabled={isAnalyzing || isRecording}
                title="השווה עם הרב / Compare with Rabbi"
              >
                {isAnalyzing ? '🔄 מנתח... / Analyzing...' : '📊 השווה / Compare'}
              </button>
            )}
          </div>

          {comparisonResult && (
            <div className="comparison-results">
              <h4>תוצאות השוואה / Comparison Results</h4>

              <div className="scores">
                <div className="score-item">
                  <span className="score-label">ציון כולל / Overall Score:</span>
                  <span
                    className="score-value"
                    style={{ color: getScoreColor(comparisonResult.overall_score) }}
                  >
                    {comparisonResult.overall_score}%
                  </span>
                </div>

                <div className="score-breakdown">
                  <div className="score-detail">
                    <span>הגייה / Pronunciation: {comparisonResult.phonetic_score}%</span>
                  </div>
                  <div className="score-detail">
                    <span>מלודיה / Melody: {comparisonResult.prosody_score}%</span>
                  </div>
                </div>

                <div className="score-message" style={{ color: getScoreColor(comparisonResult.overall_score) }}>
                  {getScoreMessage(comparisonResult.overall_score)}
                </div>
              </div>

              <div className="transcription-comparison">
                <div className="transcription-item">
                  <h5>קריאת הרב / Rabbi's Reading:</h5>
                  <p dir="rtl">{comparisonResult.rabbi_text}</p>
                </div>
                <div className="transcription-item">
                  <h5>הקריאה שלך / Your Reading:</h5>
                  <p dir="rtl">{comparisonResult.user_text}</p>
                </div>
              </div>

              {comparisonResult.plot_available && (
                <div className="pitch-analysis">
                  <h5>ניתוח מלודיה / Pitch Analysis:</h5>
                  <img
                    src={`${API_BASE}/comparison-plot/${comparisonResult.session_id}`}
                    alt="Pitch comparison"
                    className="comparison-plot"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {hasAudio && (
        <audio
          ref={audioRef}
          onEnded={handleAudioEnd}
          onError={handleAudioError}
          onCanPlay={handleAudioCanPlay}
          crossOrigin="anonymous"
          preload="none"
        />
      )}
    </div>
  );
};
