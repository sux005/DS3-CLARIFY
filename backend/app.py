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
REPO_ROOT = os.path.join(os.path.dirname(__file__), "..")

# Recommender model — finds similar songs from the 3,561-song dataset
RECOMMENDER_PATH = os.path.join(REPO_ROOT, "audio", "model_outputs", "audio_recommender_index.joblib")
recommender = joblib.load(RECOMMENDER_PATH)

# Hit score model — NOT ready yet ("audio_hit_models": null in metadata)
# TODO: Saksham — uncomment when trained and saved
# hit_model = joblib.load(os.path.join(REPO_ROOT, "audio", "model_outputs", "hit_model.joblib"))


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

    # Build the 40-feature vector the recommender expects
    # (year, tempo, mfcc_1..13, chroma_mean_1..12, chroma_std_1..12, spectral_centroid)
    feature_keys = (
        ["year", "tempo"]
        + [f"mfcc_{i}" for i in range(1, 14)]
        + [f"chroma_mean_{i}" for i in range(1, 13)]
        + [f"chroma_std_{i}" for i in range(1, 13)]
        + ["spectral_centroid"]
    )
    feature_vector = np.array([[audio_features.get(k, 0) for k in feature_keys]])

    # Find similar songs using the recommender
    try:
        distances, indices = recommender.kneighbors(feature_vector, n_neighbors=3)
        # recommender stores song metadata — pull titles + artists
        recommendations = []
        for idx in indices[0]:
            rec = recommender._fit_X_metadata[idx] if hasattr(recommender, "_fit_X_metadata") else {}
            recommendations.append({
                "title":  rec.get("SONG_TITLE", f"Similar Song {idx}"),
                "artist": rec.get("ARTIST_NAME", "Unknown"),
                "reason": "Similar audio profile",
            })
    except Exception:
        recommendations = []

    # Hit score — placeholder until Saksham's hit model is trained
    # TODO: hit_score = int(hit_model.predict(feature_vector)[0])
    hit_score      = 0
    nostalgia_score = 0

    return jsonify({
        "hitScore":        hit_score,
        "nostalgiaScore":  nostalgia_score,
        "genre":           "Unknown",  # TODO: add genre classifier
        "mood":            lyrics_features.get("mood", "Unknown"),
        "tempo":           audio_features.get("tempo", 0),
        "key":             str(audio_features.get("spotify_key", "Unknown")),
        "recommendations": recommendations,
    })


# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
