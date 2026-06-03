"""
CLARIFY - Song Search and Audio Feature Retrieval Module
=========================================================
Searches local master dataset first.
If not found, retrieves from Spotify + extracts features via librosa.
Stores new songs in local cache for future lookups.
"""

import os
import re
import tempfile
import pandas as pd
import numpy as np
import librosa
import yt_dlp
import requests
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

MASTER_DATASET_PATH = os.path.join(os.path.dirname(__file__), "../data/audio/master_audio_features.csv")
CACHE_PATH = os.path.join(os.path.dirname(__file__), "../data/audio/audio_cache.csv")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")


# ─────────────────────────────────────────────
# SPOTIFY AUTH
# ─────────────────────────────────────────────

def get_spotify_token():
    """Get Spotify access token using client credentials flow."""
    url = "https://accounts.spotify.com/api/token"
    response = requests.post(url, data={
        "grant_type": "client_credentials",
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    })
    if response.status_code != 200:
        raise Exception(f"Spotify auth failed: {response.text}")
    return response.json()["access_token"]


# ─────────────────────────────────────────────
# SPOTIFY SEARCH
# ─────────────────────────────────────────────

def search_spotify(song_title, artist=None, token=None):
    """
    Search Spotify for a song.
    Returns track metadata dict or None if not found.
    """
    if token is None:
        token = get_spotify_token()

    query = song_title
    if artist:
        query += f" artist:{artist}"

    url = "https://api.spotify.com/v1/search"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"q": query, "type": "track", "limit": 1}

    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 429:
            raise Exception("Spotify rate limit hit. Try again later.")
        if response.status_code != 200:
            raise Exception(f"Spotify search failed: {response.text}")

        tracks = response.json().get("tracks", {}).get("items", [])
        if not tracks:
            return None

        track = tracks[0]
        return {
            "spotify_id": track["id"],
            "SONG_TITLE": track["name"],
            "ARTIST_NAME": track["artists"][0]["name"],
            "year": track["album"]["release_date"][:4],
        }
    except Exception as e:
        print(f"  Spotify search error: {e}")
        return None


# ─────────────────────────────────────────────
# SPOTIFY TRACK ANALYSIS
# ─────────────────────────────────────────────

def get_spotify_track_features(spotify_id, token=None):
    """
    Get Spotify audio features for a track.
    Returns dict of Spotify features or empty dict if unavailable.
    """
    if token is None:
        token = get_spotify_token()

    url = f"https://api.spotify.com/v1/audio-features/{spotify_id}"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 429:
            raise Exception("Spotify rate limit hit.")
        if response.status_code != 200:
            return {}

        data = response.json()
        return {
            "spotify_tempo": data.get("tempo"),
            "spotify_key": data.get("key"),
            "spotify_mode": data.get("mode"),
            "spotify_energy": data.get("energy"),
            "spotify_danceability": data.get("danceability"),
            "spotify_valence": data.get("valence"),
            "spotify_acousticness": data.get("acousticness"),
            "spotify_instrumentalness": data.get("instrumentalness"),
            "spotify_liveness": data.get("liveness"),
            "spotify_speechiness": data.get("speechiness"),
            "spotify_loudness": data.get("loudness"),
            "spotify_duration_ms": data.get("duration_ms"),
        }
    except Exception as e:
        print(f"  Spotify track features error: {e}")
        return {}


# ─────────────────────────────────────────────
# AUDIO DOWNLOAD
# ─────────────────────────────────────────────

def download_audio(song_title, artist):
    """
    Download audio from YouTube using yt-dlp.
    Returns (y, sr) tuple for librosa or raises exception.
    """
    query = f"{song_title} {artist} official audio"
    with tempfile.TemporaryDirectory() as tmpdir:
        ydl_opts = {
            "format": "bestaudio/best",
            "quiet": True,
            "noplaylist": True,
            "outtmpl": os.path.join(tmpdir, "audio.%(ext)s"),
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
            }],
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"ytsearch1:{query}"])
        audio_file = os.path.join(tmpdir, "audio.mp3")
        y, sr = librosa.load(audio_file)
    return y, sr


# ─────────────────────────────────────────────
# LIBROSA FEATURE EXTRACTION
# ─────────────────────────────────────────────

def extract_librosa_features(y, sr):
    """Extract audio features from a loaded audio signal."""
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfccs_mean = np.mean(mfccs, axis=1)

    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)
    chroma_std = np.std(chroma, axis=1)

    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    spectral_centroid_mean = np.mean(spectral_centroid)

    features = {"tempo": float(tempo[0])}
    for i, v in enumerate(mfccs_mean):
        features[f"mfcc_{i+1}"] = round(float(v), 4)
    for i, v in enumerate(chroma_mean):
        features[f"chroma_mean_{i+1}"] = round(float(v), 4)
    for i, v in enumerate(chroma_std):
        features[f"chroma_std_{i+1}"] = round(float(v), 4)
    features["spectral_centroid"] = round(float(spectral_centroid_mean), 4)

    return features


# ─────────────────────────────────────────────
# LOCAL DATASET HELPERS
# ─────────────────────────────────────────────

def normalize_string(s):
    """Lowercase and strip punctuation for fuzzy matching."""
    return re.sub(r"[^a-z0-9 ]", "", str(s).lower().strip())


def search_local(song_title, artist=None, df=None):
    """
    Search local master dataset for a song.
    Supports title-only, artist-only, or title+artist search.
    Returns matching row as dict or None.
    """
    if df is None:
        if not os.path.exists(MASTER_DATASET_PATH):
            return None
        df = pd.read_csv(MASTER_DATASET_PATH)

    title_norm = normalize_string(song_title)
    df["_title_norm"] = df["SONG_TITLE"].apply(normalize_string)

    if artist:
        artist_norm = normalize_string(artist)
        df["_artist_norm"] = df["ARTIST_NAME"].apply(normalize_string)
        match = df[
            (df["_title_norm"] == title_norm) &
            (df["_artist_norm"] == artist_norm)
        ]
    else:
        match = df[df["_title_norm"] == title_norm]

    if match.empty:
        return None

    row = match.iloc[0].drop(labels=["_title_norm"] + (["_artist_norm"] if artist else []))
    return row.to_dict()


def save_to_cache(song_record):
    """Append a new song record to the local cache CSV."""
    record_df = pd.DataFrame([song_record])
    if os.path.exists(CACHE_PATH):
        existing = pd.read_csv(CACHE_PATH)
        updated = pd.concat([existing, record_df], ignore_index=True)
    else:
        updated = record_df
    updated.to_csv(CACHE_PATH, index=False)


# ─────────────────────────────────────────────
# MAIN SEARCH FUNCTION
# ─────────────────────────────────────────────

def get_song_features(song_title, artist=None):
    """
    Main entry point. Returns complete audio feature dict for a song.

    Flow:
    1. Search local master dataset
    2. Search local cache
    3. Search Spotify → download audio → extract features → cache → return

    Args:
        song_title (str): Title of the song
        artist (str, optional): Artist name

    Returns:
        dict: Complete song record with all audio features
        None: If song cannot be found or processed
    """
    print(f"\nSearching for: {song_title}" + (f" by {artist}" if artist else ""))

    # Step 1: Check master dataset
    print("  Checking local dataset...")
    result = search_local(song_title, artist)
    if result:
        print("  Found in local dataset.")
        return result

    # Step 2: Check cache
    if os.path.exists(CACHE_PATH):
        print("  Checking local cache...")
        cache_df = pd.read_csv(CACHE_PATH)
        result = search_local(song_title, artist, df=cache_df)
        if result:
            print("  Found in cache.")
            return result

    # Step 3: Retrieve from Spotify + librosa
    print("  Not found locally. Retrieving from Spotify...")
    try:
        token = get_spotify_token()

        # Search Spotify for metadata
        track_info = search_spotify(song_title, artist, token=token)
        if not track_info:
            print("  Song not found on Spotify.")
            return None

        # Get Spotify audio features
        spotify_features = get_spotify_track_features(track_info["spotify_id"], token=token)

        # Download audio and extract librosa features
        print("  Downloading audio...")
        y, sr = download_audio(track_info["SONG_TITLE"], track_info["ARTIST_NAME"])
        print("  Extracting audio features...")
        librosa_features = extract_librosa_features(y, sr)

        # Build complete song record
        master_df = pd.read_csv(MASTER_DATASET_PATH)
        next_id = int(master_df["SONG_ID"].max()) + 1

        song_record = {
            "SONG_ID": next_id,
            "SONG_TITLE": track_info["SONG_TITLE"],
            "ARTIST_NAME": track_info["ARTIST_NAME"],
            "year": track_info["year"],
            **librosa_features,
            **spotify_features,
        }

        # Save to cache
        save_to_cache(song_record)
        print("  Saved to cache.")

        return song_record

    except Exception as e:
        print(f"  Error retrieving song: {e}")
        return None


# ─────────────────────────────────────────────
# EXAMPLE USAGE
# ─────────────────────────────────────────────

if __name__ == "__main__":
    # Example 1: Song in local dataset
    result = get_song_features("Vogue", "Madonna")
    if result:
        print("\nResult:", {k: v for k, v in list(result.items())[:6]}, "...")

    # Example 2: Song title only
    result = get_song_features("Blinding Lights")
    if result:
        print("\nResult:", {k: v for k, v in list(result.items())[:6]}, "...")

    # Example 3: New song not in dataset
    result = get_song_features("Pasoori", "Ali Sethi")
    if result:
        print("\nResult:", {k: v for k, v in list(result.items())[:6]}, "...")
