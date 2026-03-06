"""
predict.py – Load trained models and predict category + priority for a complaint.
"""

from model import (
    clean_text,
    load_model,
    detect_sentiment,
    priority_to_score,
    CATEGORY_MODEL_PATH,
    PRIORITY_MODEL_PATH,
)

_cat_model = None
_pri_model = None


def _load_models():
    global _cat_model, _pri_model
    if _cat_model is None:
        _cat_model = load_model(CATEGORY_MODEL_PATH)
    if _pri_model is None:
        _pri_model = load_model(PRIORITY_MODEL_PATH)


def predict(text: str) -> dict:
    """
    Predict category, priority, and sentiment for a complaint text.

    Returns:
        {
            "category": str,
            "priority": str,
            "priorityScore": int,
            "sentiment": str,
            "cleaned_text": str,
        }
    """
    _load_models()
    cleaned = clean_text(text)

    category = _cat_model.predict([cleaned])[0]
    priority = _pri_model.predict([cleaned])[0]

    # Get probability scores
    cat_probs = _cat_model.predict_proba([cleaned])[0]
    cat_confidence = float(max(cat_probs))

    pri_probs = _pri_model.predict_proba([cleaned])[0]
    pri_confidence = float(max(pri_probs))

    sentiment = detect_sentiment(text)
    priority_score = priority_to_score(priority)

    return {
        'category': category,
        'priority': priority,
        'priorityScore': priority_score,
        'sentiment': sentiment,
        'category_confidence': round(cat_confidence, 3),
        'priority_confidence': round(pri_confidence, 3),
        'cleaned_text': cleaned,
    }


if __name__ == '__main__':
    # Quick test
    samples = [
        'WiFi is not working in hostel since 3 days',
        'There is ragging and harassment happening in the college hostel',
        'Library books are not updated and old edition',
        'Professor does not attend classes regularly',
        'The hostel room has cockroaches and dirty bathrooms',
    ]
    for s in samples:
        result = predict(s)
        print(f'\nText     : {s}')
        print(f'Category : {result["category"]} ({result["category_confidence"]})')
        print(f'Priority : {result["priority"]} / Score {result["priorityScore"]} ({result["priority_confidence"]})')
        print(f'Sentiment: {result["sentiment"]}')
