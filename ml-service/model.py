"""
model.py - NLP preprocessing and model definitions for the complaint
analysis system.
"""

import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib
import os
from autocorrect import Speller

spell = Speller(lang='en')

# Download required NLTK data on first run
for package in ['stopwords', 'punkt', 'wordnet']:
    try:
        nltk.data.find(f'corpora/{package}')
    except LookupError:
        nltk.download(package, quiet=True)

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

CATEGORY_MODEL_PATH = os.path.join(MODELS_DIR, 'category_model.joblib')
PRIORITY_MODEL_PATH = os.path.join(MODELS_DIR, 'priority_model.joblib')

stemmer = PorterStemmer()
try:
    stop_words = set(stopwords.words('english'))
except Exception:
    stop_words = set()


def clean_text(text: str) -> str:
    """Lowercase, spell-correct, remove punctuation, remove stop words, apply stemming."""
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\d+', '', text)
    tokens = text.split()
    # Spell correction: fix typos before stemming
    tokens = [spell(w) if len(w) > 2 else w for w in tokens]
    tokens = [stemmer.stem(w) for w in tokens if w not in stop_words and len(w) > 2]
    return ' '.join(tokens)


def build_category_pipeline():
    return Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, min_df=1)),
        ('clf', LogisticRegression(max_iter=1000, random_state=42)),
    ])


def build_priority_pipeline():
    return Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, min_df=1)),
        ('clf', MultinomialNB()),
    ])


def save_model(model, path: str):
    joblib.dump(model, path)
    print(f'Model saved -> {path}')


def load_model(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f'Model file not found: {path}')
    return joblib.load(path)


def priority_to_score(priority: str) -> int:
    return {'High': 3, 'Medium': 2, 'Low': 1}.get(priority, 1)


def detect_sentiment(text: str) -> str:
    """Simple rule-based sentiment detection."""
    neg_words = [
        'not working', 'broken', 'issue', 'problem', 'bad', 'terrible',
        'horrible', 'worst', 'harassment', 'dirty', 'useless', 'disgusting',
        'abuse', 'attack', 'threat', 'violence', 'unfair', 'wrong',
    ]
    pos_words = ['good', 'great', 'excellent', 'thanks', 'appreciate', 'helpful']
    lower = text.lower()
    neg = sum(1 for w in neg_words if w in lower)
    pos = sum(1 for w in pos_words if w in lower)
    if neg > pos:
        return 'Negative'
    if pos > neg:
        return 'Positive'
    return 'Neutral'


def extract_keywords(text: str, model, top_n: int = 5) -> list:
    """
    Extract the most important keywords from a complaint.
    Returns readable words from the original text (not stemmed).
    """
    import numpy as np
    import re as _re

    # Get TF-IDF vectorizer and scores
    tfidf = model.named_steps['tfidf']
    cleaned = clean_text(text)
    tfidf_vector = tfidf.transform([cleaned])
    feature_names = tfidf.get_feature_names_out()
    scores = tfidf_vector.toarray()[0]

    # Get top stemmed keywords by TF-IDF score
    top_indices = np.argsort(scores)[::-1]
    stemmed_keywords = []
    for idx in top_indices:
        if scores[idx] > 0 and len(stemmed_keywords) < top_n * 2:
            word = feature_names[idx]
            # Skip bigrams, keep only single words for cleaner output
            if ' ' not in word:
                stemmed_keywords.append(word)

    # Spell-correct original words, then map stemmed keywords back
    raw_words = _re.sub(r'[^\w\s]', '', text.lower()).split()
    corrected_words = [spell(w) if len(w) > 2 else w for w in raw_words]
    keywords = []
    used = set()
    for stem in stemmed_keywords:
        for corrected in corrected_words:
            if corrected not in used and corrected not in stop_words and len(corrected) > 2:
                if stemmer.stem(corrected) == stem:
                    keywords.append(corrected)
                    used.add(corrected)
                    break
        if len(keywords) >= top_n:
            break

    return keywords

