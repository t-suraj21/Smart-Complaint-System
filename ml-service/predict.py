"""
predict.py - Load trained models and predict category + priority for a complaint.
Extracts keywords to help administrators quickly understand the issue.
"""

from model import (
    clean_text,
    load_model,
    priority_to_score,
    extract_keywords,
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
    Predict category, extract keywords, and determine priority for a complaint.

    Returns:
        {
            "category": str,          # Classification (Hostel, Mess, etc.)
            "keywords": list[str],    # Top keywords for admin quick view
            "priority": str,          # High/Medium/Low (for sorting)
            "priorityScore": int,     # 3/2/1 (for sorting)
        }
    """
    _load_models()
    cleaned = clean_text(text)

    # Predict category and priority
    category = _cat_model.predict([cleaned])[0]
    priority = _pri_model.predict([cleaned])[0]

    # Extract keywords using TF-IDF scores from the category model
    keywords = extract_keywords(text, _cat_model, top_n=5)

    # Confidence scores
    cat_probs = _cat_model.predict_proba([cleaned])[0]
    cat_confidence = float(max(cat_probs))

    priority_score = priority_to_score(priority)

    return {
        'category': category,
        'keywords': keywords,
        'priority': priority,
        'priorityScore': priority_score,
        'category_confidence': round(cat_confidence, 3),
    }


if __name__ == '__main__':
    print('=' * 60)
    print('  College Complaint Analyzer - NLP Model')
    print('  Type a complaint and press Enter to analyze')
    print('  Type "quit" to exit')
    print('=' * 60)

    while True:
        print()
        text = input('Enter complaint: ').strip()
        if text.lower() in ('quit', 'exit', 'q'):
            print('Goodbye!')
            break
        if len(text) < 3:
            print('  Please enter a longer complaint.')
            continue

        result = predict(text)
        print(f'\n  Category : {result["category"]}')
        print(f'  Keywords : {", ".join(result["keywords"])}')
        print(f'  Priority : {result["priority"]}')

