# Lyrics Processing Pipeline
**File:** `lyrics_pipeline.py`  
**Author:** Dilraj  
**Project:** CLARIFY  

---

## What It Does

Takes Max's output CSV (which contains raw song lyrics) and processes the `Plain_Lyrics` column into clean, structured features that can later be merged with the manually concept-rated dataset.

**Input:** `DataForOptimizingHitPotential.csv` (Max's pipeline output)  
**Output:** `Processed_lyrics_features.csv`

---

## Setup

Install dependencies:
```bash
pip install pandas vaderSentiment
```

---

## How to Run

```bash
python lyrics_pipeline.py --input DataForOptimizingHitPotential.csv --output Processed_lyrics_features.csv
```

Optional flags:
| Flag | Default | Description |
|------|---------|-------------|
| `--input` | `Lyrics_features.csv` | Path to input CSV |
| `--output` | `Processed_lyrics_features.csv` | Path to save output CSV |
| `--title-col` | `Song` | Column name containing song titles (used for Title_Repetition) |

---

## Input Requirements

The input CSV must contain at least these columns:

| Column | Type | Description |
|--------|------|-------------|
| `SONG_ID` | String | Spotify song ID |
| `Plain_Lyrics` | String | Raw lyrics text |
| `Song` | String | Song title (used for Title_Repetition) |

---

## What the Pipeline Does Step by Step

### 1. Load & Validate
Reads the input CSV and checks that `SONG_ID` and `Plain_Lyrics` columns exist. Raises an error if either is missing.

### 2. Drop Missing Lyrics
Removes any rows where `Plain_Lyrics` is empty or null.

### 3. Clean the Lyrics
Applies the following cleaning steps to produce a `Clean_Lyrics` column:
- Converts text to lowercase
- Removes bracketed section labels like `[Chorus]`, `[Verse 1]`, `[Intro]`
- Collapses multiple spaces into one
- Strips leading/trailing whitespace

### 4. Extract Structural Features
| Feature | Description |
|---------|-------------|
| `Word_Count` | Total number of words in the lyrics |
| `Unique_Word_Count` | Number of distinct words used |
| `Repetition_Score` | How repetitive the lyrics are (0 = no repetition, 1 = fully repetitive). Calculated as `1 - Vocabulary_Diversity` |
| `Average_Line_Length` | Average number of words per non-empty line |
| `Vocabulary_Diversity` | Ratio of unique words to total words (type-token ratio) |
| `Title_Repetition` | Number of times the song title appears in the lyrics |
| `Explicit_Word_Count` | Count of profane/explicit words detected |

### 5. Extract Sentiment & Emotional Features
Uses [VADER](https://github.com/cjhutto/vaderSentiment) (Valence Aware Dictionary and sEntiment Reasoner), a sentiment analysis tool well-suited for song lyrics and informal text.

| Feature | Range | Description |
|---------|-------|-------------|
| `Sentiment_Score` | -1.0 to +1.0 | Overall sentiment. Negative = sad/dark, Positive = happy/upbeat |
| `Positive_Score` | 0.0 to 1.0 | Proportion of text that is positive |
| `Negative_Score` | 0.0 to 1.0 | Proportion of text that is negative |
| `Emotional_Intensity` | 0.0 to 1.0 | Absolute strength of emotion regardless of direction |

---

## Output Columns

The output CSV `Processed_lyrics_features.csv` contains these columns:

| Column | Type | Description |
|--------|------|-------------|
| `SONG_ID` | String | Spotify song ID (key for merging with other datasets) |
| `Clean_Lyrics` | String | Cleaned lyrics text |
| `Word_Count` | Int | Total word count |
| `Unique_Word_Count` | Int | Unique word count |
| `Repetition_Score` | Float | Repetitiveness score (0-1) |
| `Average_Line_Length` | Float | Avg words per line |
| `Vocabulary_Diversity` | Float | Type-token ratio (0-1) |
| `Title_Repetition` | Int | Times song title appears in lyrics |
| `Explicit_Word_Count` | Int | Number of explicit words |
| `Sentiment_Score` | Float | VADER compound score (-1 to +1) |
| `Positive_Score` | Float | VADER positive proportion |
| `Negative_Score` | Float | VADER negative proportion |
| `Emotional_Intensity` | Float | Absolute sentiment strength |

---

## Merging With Other Datasets

Use `SONG_ID` as the key to merge this output with Max's audio features or the manually concept-rated dataset:

```python
import pandas as pd

lyrics = pd.read_csv('Processed_lyrics_features.csv')
audio  = pd.read_csv('audio_features.csv')

merged = pd.merge(lyrics, audio, on='SONG_ID', how='inner')
```

---

## Notes
- Songs with missing or empty lyrics are dropped before processing and will not appear in the output.
- `Title_Repetition` will be `None` if the `Song` column is not present in the input.
- The explicit word list is a fixed set of common profane words. It can be expanded by editing the `EXPLICIT_WORDS` set at the top of the script.
