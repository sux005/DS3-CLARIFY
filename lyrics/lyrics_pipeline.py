"""
CLARIFY - Lyrics Processing Pipeline
--------------------------------------
Input:  Lyrics_features.csv  (columns: SONG_ID, Plain_Lyrics)
Output: Processed_lyrics_features.csv

Run:
    python lyrics_pipeline.py --input Lyrics_features.csv --output Processed_lyrics_features.csv

Dependencies:
    pip install pandas nltk vaderSentiment
    python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
"""

import re
import argparse
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# ──────────────────────────────────────────────
# CLEANING
# ──────────────────────────────────────────────

BRACKET_PATTERN = re.compile(r"\[.*?\]")
EXTRA_SPACE_PATTERN = re.compile(r" +")
EXPLICIT_WORDS = {
    "fuck", "shit", "bitch", "ass", "damn", "hell", "nigga", "nigger",
    "pussy", "cock", "dick", "cunt", "whore", "slut", "bastard"
}


def clean_lyrics(text: str) -> str:
    """Lowercase, strip bracketed labels, remove extra spaces."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = BRACKET_PATTERN.sub("", text)           # remove [chorus], [verse], etc.
    text = EXTRA_SPACE_PATTERN.sub(" ", text)       # collapse multiple spaces
    text = text.strip()
    return text


# ──────────────────────────────────────────────
# STRUCTURAL FEATURES
# ──────────────────────────────────────────────

def word_count(text: str) -> int:
    return len(text.split()) if text else 0


def unique_word_count(text: str) -> int:
    return len(set(text.split())) if text else 0


def vocabulary_diversity(text: str) -> float:
    """Unique words / total words (type-token ratio)."""
    words = text.split()
    if not words:
        return 0.0
    return round(len(set(words)) / len(words), 4)


def repetition_score(text: str) -> float:
    """1 - vocabulary_diversity; higher = more repetitive."""
    return round(1 - vocabulary_diversity(text), 4)


def average_line_length(text: str) -> float:
    """Average number of words per non-empty line."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return 0.0
    return round(sum(len(l.split()) for l in lines) / len(lines), 4)


def title_repetition(text: str, title: str) -> int:
    """Number of times the song title appears in the lyrics (case-insensitive)."""
    if not title or not text:
        return 0
    return text.lower().count(title.lower())


def explicit_word_count(text: str) -> int:
    """Count how many explicit/profane words appear in the lyrics."""
    words = re.findall(r"\b\w+\b", text.lower())
    return sum(1 for w in words if w in EXPLICIT_WORDS)


# ──────────────────────────────────────────────
# EMOTIONAL / SENTIMENT FEATURES
# ──────────────────────────────────────────────

analyzer = SentimentIntensityAnalyzer()


def sentiment_features(text: str) -> dict:
    """
    Returns VADER-based sentiment scores.
    compound: overall sentiment (-1 to +1)
    pos / neg / neu: proportion scores (0 to 1)
    emotional_intensity: abs(compound), how strongly emotional the text is
    """
    if not text:
        return {
            "Sentiment_Score": 0.0,
            "Positive_Score": 0.0,
            "Negative_Score": 0.0,
            "Emotional_Intensity": 0.0,
        }
    scores = analyzer.polarity_scores(text)
    return {
        "Sentiment_Score": round(scores["compound"], 4),
        "Positive_Score": round(scores["pos"], 4),
        "Negative_Score": round(scores["neg"], 4),
        "Emotional_Intensity": round(abs(scores["compound"]), 4),
    }


# ──────────────────────────────────────────────
# MAIN PIPELINE
# ──────────────────────────────────────────────

def process(input_path: str, output_path: str, title_col: str = "Song") -> pd.DataFrame:
    """
    Full lyrics processing pipeline.

    Parameters
    ----------
    input_path  : path to Lyrics_features.csv (or Max's full output CSV)
    output_path : path to save Processed_lyrics_features.csv
    title_col   : column name containing song titles (for Title_Repetition).
                  Defaults to 'Song' to match Max's TrainingDatasetPipelineFinal output.
    """
    df = pd.read_csv(input_path)

    # Validate required columns
    required = {"SONG_ID", "Plain_Lyrics"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Input CSV is missing required columns: {missing}")

    print(f"Loaded {len(df)} songs from '{input_path}'")

    # Drop rows with missing lyrics
    before = len(df)
    df = df.dropna(subset=["Plain_Lyrics"])
    df = df[df["Plain_Lyrics"].str.strip() != ""]
    print(f"Dropped {before - len(df)} songs with missing/empty lyrics")

    # Clean lyrics
    df["Clean_Lyrics"] = df["Plain_Lyrics"].apply(clean_lyrics)

    # Structural features
    df["Word_Count"]           = df["Clean_Lyrics"].apply(word_count)
    df["Unique_Word_Count"]    = df["Clean_Lyrics"].apply(unique_word_count)
    df["Repetition_Score"]     = df["Clean_Lyrics"].apply(repetition_score)
    df["Average_Line_Length"]  = df["Clean_Lyrics"].apply(average_line_length)
    df["Vocabulary_Diversity"] = df["Clean_Lyrics"].apply(vocabulary_diversity)
    df["Explicit_Word_Count"]  = df["Clean_Lyrics"].apply(explicit_word_count)

    # Title repetition (optional)
    if title_col and title_col in df.columns:
        df["Title_Repetition"] = df.apply(
            lambda row: title_repetition(row["Clean_Lyrics"], row[title_col]), axis=1
        )
    else:
        df["Title_Repetition"] = None

    # Emotional / sentiment features
    sentiment_df = df["Clean_Lyrics"].apply(lambda t: pd.Series(sentiment_features(t)))
    df = pd.concat([df, sentiment_df], axis=1)

    # Select and order final output columns
    output_cols = [
        "SONG_ID",
        "Clean_Lyrics",
        "Word_Count",
        "Unique_Word_Count",
        "Repetition_Score",
        "Average_Line_Length",
        "Vocabulary_Diversity",
        "Title_Repetition",
        "Explicit_Word_Count",
        "Sentiment_Score",
        "Positive_Score",
        "Negative_Score",
        "Emotional_Intensity",
    ]
    df_out = df[output_cols]

    df_out.to_csv(output_path, index=False)
    print(f"Saved processed features to '{output_path}' ({len(df_out)} songs)")

    return df_out


# ──────────────────────────────────────────────
# CLI ENTRY POINT
# ──────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CLARIFY Lyrics Processing Pipeline")
    parser.add_argument("--input",  default="Lyrics_features.csv",           help="Input CSV path")
    parser.add_argument("--output", default="Processed_lyrics_features.csv", help="Output CSV path")
    parser.add_argument("--title-col", default="Song", help="Column name with song titles (for Title_Repetition). Default: 'Song'")
    args = parser.parse_args()

    process(args.input, args.output, title_col=args.title_col)
