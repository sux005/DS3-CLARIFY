"""
CLARIFY Backend API
===================
Endpoints:
  GET  /health               → confirms the server is up
  GET  /search               → song_search.py → get_song_features()
  POST /analyze/audio        → librosa feature extraction on uploaded file
  POST /analyze/lyrics       → sentiment/NLP on lyrics text
  POST /predict              → dashboard_payload lookup → concepts + recommendations
"""

import os
import sys
import json
import joblib
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# Allow imports from sibling folders (audio/, lyrics/)
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from audio.song_search import get_song_features, extract_librosa_features
from lyrics.lyrics_pipeline import (
    sentiment_features,
    word_count,
    vocabulary_diversity,
    repetition_score,
)

app = Flask(__name__)
CORS(app)

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..")

# ─────────────────────────────────────────────
# Load dashboard_payload.json at startup
# Pre-computed concepts + recommendations for 2,405 songs
# ─────────────────────────────────────────────
DASHBOARD_PATH = os.path.join(REPO_ROOT, "data", "lyrics", "dashboard_payload.json")
dashboard_by_audio_id = {}

try:
    with open(DASHBOARD_PATH) as f:
        dashboard_data = json.load(f)
    for record in dashboard_data.get("records", []):
        audio_id = record.get("audio_id")
        if audio_id is not None:
            dashboard_by_audio_id[int(audio_id)] = record
    print(f"✓ Loaded dashboard payload: {len(dashboard_by_audio_id)} songs")
except Exception as e:
    print(f"✗ Could not load dashboard payload: {e}")


# ─────────────────────────────────────────────
# GET /health
# ─────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "songs_indexed": len(dashboard_by_audio_id)})


# ─────────────────────────────────────────────
# GET /search?title=X&artist=Y
# ─────────────────────────────────────────────
@app.route("/search")
def search():
    title  = request.args.get("title", "").strip()
    artist = request.args.get("artist", "").strip()

    if not title:
        return jsonify({"error": "title is required"}), 400

    result = get_song_features(title, artist or None)

    if result is None:
        return jsonify({"error": "Song not found"}), 404

    return jsonify(result)


# ─────────────────────────────────────────────
# POST /analyze/audio  (multipart file upload)
# ─────────────────────────────────────────────
@app.route("/analyze/audio", methods=["POST"])
def analyze_audio():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    import tempfile, librosa
    audio_file = request.files["file"]
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        y, sr = librosa.load(tmp_path)
        features = extract_librosa_features(y, sr)
    finally:
        os.unlink(tmp_path)

    return jsonify(features)


# ─────────────────────────────────────────────
# POST /analyze/lyrics  { "lyrics": "..." }
# ─────────────────────────────────────────────
@app.route("/analyze/lyrics", methods=["POST"])
def analyze_lyrics():
    data   = request.get_json()
    lyrics = data.get("lyrics", "").strip() if data else ""

    if not lyrics:
        return jsonify({"error": "lyrics text is required"}), 400

    sentiment = sentiment_features(lyrics)
    return jsonify({
        "sentiment":       sentiment["Sentiment_Score"],
        "mood":            "Positive" if sentiment["Sentiment_Score"] > 0.05
                           else "Negative" if sentiment["Sentiment_Score"] < -0.05
                           else "Neutral",
        "wordCount":       word_count(lyrics),
        "uniqueWordRatio": vocabulary_diversity(lyrics),
        "repetitionScore": repetition_score(lyrics),
        "topThemes":       [],
    })


# ─────────────────────────────────────────────
# POST /predict
# { "audioFeatures": {...}, "lyricsFeatures": {...} }
# ─────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    data            = request.get_json() or {}
    audio_features  = data.get("audioFeatures", {})
    lyrics_features = data.get("lyricsFeatures") or {}

    # SONG_ID from searchSong maps directly to audio_id in the dashboard payload
    song_id = audio_features.get("SONG_ID")

    if song_id and int(song_id) in dashboard_by_audio_id:
        record          = dashboard_by_audio_id[int(song_id)]
        concepts        = record.get("model_outputs", {}).get("concepts", [])
        recommendations = record.get("recommendations", [])[:5]
        hit_score_raw   = (record.get("hit_score") or {}).get("score_100")
        hit_score       = int(hit_score_raw) if hit_score_raw is not None else 0
    else:
        # Song not in pre-computed dataset — return empty results
        concepts        = []
        recommendations = []
        hit_score       = 0

    # Enrich mood from lyrics if available
    mood = lyrics_features.get("mood", "Unknown")

    return jsonify({
        "hitScore":        hit_score,
        "concepts":        concepts,
        "recommendations": recommendations,
        "mood":            mood,
        "tempo":           audio_features.get("tempo", 0),
    })


# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
