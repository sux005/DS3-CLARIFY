"""
CLARIFY Backend API
===================
Endpoints:
  GET  /search               → song_search.py → get_song_features()
  POST /analyze/audio        → librosa feature extraction on uploaded file
  POST /analyze/lyrics       → sentiment/NLP on lyrics text
  POST /predict              → ML model → hit score + nostalgia score
"""

import os
import sys
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
CORS(app)  # allows the Netlify frontend to call this API

# ─────────────────────────────────────────────
# Load model(s) at startup (not per-request)
# ─────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# TODO: replace these filenames with your actual .pkl names
# hit_model      = joblib.load(os.path.join(MODEL_DIR, "hit_score_model.pkl"))
# nostalgia_model = joblib.load(os.path.join(MODEL_DIR, "nostalgia_model.pkl"))


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

    audio_file = request.files["file"]

    import tempfile, librosa
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        audio_file.save(tmp.name)
        y, sr = librosa.load(tmp.name)
    os.unlink(tmp.name)

    features = extract_librosa_features(y, sr)
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
    result = {
        "sentiment":       sentiment["Sentiment_Score"],
        "mood":            "Positive" if sentiment["Sentiment_Score"] > 0.05
                           else "Negative" if sentiment["Sentiment_Score"] < -0.05
                           else "Neutral",
        "wordCount":       word_count(lyrics),
        "uniqueWordRatio": vocabulary_diversity(lyrics),
        "repetitionScore": repetition_score(lyrics),
        "topThemes":       [],  # placeholder until theme model is wired in
    }
    return jsonify(result)


# ─────────────────────────────────────────────
# POST /predict  { "audioFeatures": {...}, "lyricsFeatures": {...} }
# ─────────────────────────────────────────────
@app.route("/predict", methods=["POST"])
def predict():
    data           = request.get_json()
    audio_features = data.get("audioFeatures", {})
    lyrics_features = data.get("lyricsFeatures") or {}

    # TODO: Saksham — build your feature vector from audio_features + lyrics_features
    # and run it through your model. Replace the block below with real inference.
    #
    # feature_vector = build_feature_vector(audio_features, lyrics_features)
    # hit_score      = int(hit_model.predict([feature_vector])[0])
    # nostalgia_score = int(nostalgia_model.predict([feature_vector])[0])

    hit_score      = 0   # placeholder
    nostalgia_score = 0  # placeholder

    return jsonify({
        "hitScore":       hit_score,
        "nostalgiaScore": nostalgia_score,
        "genre":          audio_features.get("genre", "Unknown"),
        "mood":           lyrics_features.get("mood", "Unknown"),
        "tempo":          audio_features.get("tempo", 0),
        "key":            audio_features.get("spotify_key", "Unknown"),
        "recommendations": [],
    })


# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
