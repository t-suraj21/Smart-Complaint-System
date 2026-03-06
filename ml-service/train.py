"""
train.py – Train and save category and priority classification models.
Run: python train.py
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from model import (
    clean_text,
    build_category_pipeline,
    build_priority_pipeline,
    save_model,
    CATEGORY_MODEL_PATH,
    PRIORITY_MODEL_PATH,
)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'training_data.csv')


def train():
    print('📂 Loading training data...')
    df = pd.read_csv(DATA_PATH)
    print(f'   {len(df)} samples loaded')

    # Clean text
    df['cleaned'] = df['text'].apply(clean_text)

    # ── Category model ──────────────────────────────────────────────────────
    print('\n🔧 Training Category model...')
    X_cat = df['cleaned']
    y_cat = df['category']

    X_train, X_test, y_train, y_test = train_test_split(
        X_cat, y_cat, test_size=0.2, random_state=42, stratify=y_cat
    )

    cat_model = build_category_pipeline()
    cat_model.fit(X_train, y_train)
    y_pred = cat_model.predict(X_test)

    print(f'   Accuracy: {accuracy_score(y_test, y_pred):.2f}')
    print(classification_report(y_test, y_pred, zero_division=0))
    save_model(cat_model, CATEGORY_MODEL_PATH)

    # ── Priority model ──────────────────────────────────────────────────────
    print('\n🔧 Training Priority model...')
    X_pri = df['cleaned']
    y_pri = df['priority']

    X_train2, X_test2, y_train2, y_test2 = train_test_split(
        X_pri, y_pri, test_size=0.2, random_state=42, stratify=y_pri
    )

    pri_model = build_priority_pipeline()
    pri_model.fit(X_train2, y_train2)
    y_pred2 = pri_model.predict(X_test2)

    print(f'   Accuracy: {accuracy_score(y_test2, y_pred2):.2f}')
    print(classification_report(y_test2, y_pred2, zero_division=0))
    save_model(pri_model, PRIORITY_MODEL_PATH)

    print('\n✅ Training complete! Models saved.')


if __name__ == '__main__':
    train()
