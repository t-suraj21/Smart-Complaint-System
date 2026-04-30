# Code Explanation - College Complaint Analyzer (NLP/ML Service)

This document explains every part of the ML service code in detail so you can confidently explain it to your examiner.

---

## Project Overview

This is an **NLP-based complaint classification system** that takes a student's complaint as input and automatically:
1. **Classifies** it into a category (Hostel, Mess, Academics, etc.)
2. **Extracts keywords** so the admin can quickly understand the problem
3. **Assigns priority** (High/Medium/Low) so urgent issues appear first

---

## File Structure

```
ml-service/
  model.py          -> Core NLP logic (text cleaning, model building, keyword extraction)
  train.py          -> Trains the ML models on the dataset
  predict.py        -> Uses trained models to predict category + keywords for new complaints
  app.py            -> Flask web server that exposes the model as an API
  requirements.txt  -> Python dependencies
  data/
    training_data.csv    -> 672 labeled complaints used for training
  models/
    category_model.joblib   -> Saved trained category classifier
    priority_model.joblib   -> Saved trained priority classifier
```

---

## File 1: model.py (Core NLP Engine)

This is the **brain** of the system. It handles all NLP preprocessing and model definitions.

### Imports (Lines 6-17)

```python
import re                                          # Regular expressions for text cleaning
import string                                      # Punctuation removal
import nltk                                        # Natural Language Toolkit
from nltk.corpus import stopwords                  # Common words to remove (the, is, and...)
from nltk.stem import PorterStemmer                # Reduces words to root form
from sklearn.feature_extraction.text import TfidfVectorizer  # Converts text to numbers
from sklearn.linear_model import LogisticRegression          # Category classifier
from sklearn.naive_bayes import MultinomialNB                # Priority classifier
from sklearn.pipeline import Pipeline              # Chains steps together
import joblib                                      # Save/load trained models
import os                                          # File path handling
from autocorrect import Speller                    # Spell correction for typos
```

**Why these libraries?**
- **NLTK** provides NLP tools (stopwords, stemmer) - industry standard for text preprocessing
- **scikit-learn** provides ML algorithms (TF-IDF, Logistic Regression, Naive Bayes)
- **autocorrect** fixes spelling mistakes before processing

### NLTK Data Download (Lines 21-26)

```python
for package in ['stopwords', 'punkt', 'wordnet']:
    try:
        nltk.data.find(f'corpora/{package}')
    except LookupError:
        nltk.download(package, quiet=True)
```

**What it does:** First time the code runs, it automatically downloads required NLTK datasets (English stopwords list, tokenizer data). After first download, it skips this step.

**Examiner question: "Why do you need to download data?"**
> NLTK stores language data (like the list of English stopwords) separately. This code checks if the data exists, and downloads it only if missing.

### Stopwords and Stemmer Setup (Lines 34-38)

```python
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))
```

**Stopwords** are common words like "the", "is", "and", "in" that don't carry meaning for classification. Removing them reduces noise.

**Porter Stemmer** reduces words to their root form:
- "working" -> "work"
- "broken" -> "broken"
- "bathrooms" -> "bathroom"
- "running" -> "run"

**Examiner question: "Why stemming and not lemmatization?"**
> Porter Stemmer is faster and simpler. For complaint classification, exact grammar doesn't matter - we just need the root meaning. Lemmatization requires POS tagging which adds complexity without significant accuracy improvement for this use case.

### clean_text() Function (Lines 41-50) - THE MOST IMPORTANT FUNCTION

```python
def clean_text(text: str) -> str:
    text = text.lower()                                          # Step 1
    text = text.translate(str.maketrans('', '', string.punctuation))  # Step 2
    text = re.sub(r'\d+', '', text)                              # Step 3
    tokens = text.split()                                        # Step 4
    tokens = [spell(w) if len(w) > 2 else w for w in tokens]    # Step 5
    tokens = [stemmer.stem(w) for w in tokens if w not in stop_words and len(w) > 2]  # Step 6
    return ' '.join(tokens)                                      # Step 7
```

**Step-by-step example:**

| Step | Operation | Input/Output |
|------|-----------|-------------|
| Input | Raw complaint | `"The Hostel BATHROOM is NOT working!! 3 days"` |
| Step 1 | Lowercase | `"the hostel bathroom is not working!! 3 days"` |
| Step 2 | Remove punctuation | `"the hostel bathroom is not working 3 days"` |
| Step 3 | Remove numbers | `"the hostel bathroom is not working  days"` |
| Step 4 | Split into tokens | `["the", "hostel", "bathroom", "is", "not", "working", "days"]` |
| Step 5 | Spell correction | No typos here, so no change |
| Step 6 | Remove stopwords + stem | `["hostel", "bathroom", "work", "day"]` |
| Step 7 | Join back | `"hostel bathroom work day"` |

**Examiner question: "Why do you remove numbers?"**
> Numbers like "3 days" or "2 months" don't help classify whether the complaint is about Hostel vs Mess. The word "days" alone is sufficient.

**Examiner question: "What does spell correction do?"**
> If a student types "bathrom" instead of "bathroom", the spell corrector fixes it to "bathroom" so the model can recognize it. Without this, misspelled words would be treated as unknown.

### build_category_pipeline() (Lines 53-57)

```python
def build_category_pipeline():
    return Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, min_df=1)),
        ('clf', LogisticRegression(max_iter=1000, random_state=42)),
    ])
```

**What is a Pipeline?**
A Pipeline chains two steps together:
1. **TF-IDF Vectorizer** - converts text to numbers
2. **Logistic Regression** - classifies the numbers into categories

**What is TF-IDF?** (Term Frequency - Inverse Document Frequency)
- **TF**: How often a word appears in THIS complaint
- **IDF**: How rare the word is across ALL complaints
- **TF-IDF Score** = TF x IDF

Example:
- Word "hostel" appears in many hostel complaints -> high TF in hostel texts, moderate IDF
- Word "cockroach" appears rarely -> when it does appear, it gets a HIGH TF-IDF score because it's distinctive

**Parameters explained:**
- `ngram_range=(1, 2)` - Uses single words AND word pairs. Example: "not working" as a pair is more meaningful than "not" and "working" separately
- `max_features=5000` - Keeps only top 5000 most important words/phrases
- `min_df=1` - Include words that appear in at least 1 document

**Why Logistic Regression?**
- Works well with text data and TF-IDF features
- Handles multiple categories (12 categories)
- Gives probability scores (confidence %)
- Fast to train and predict

**Examiner question: "Why not use Deep Learning or Neural Networks?"**
> For 672 training samples and 12 categories, Logistic Regression is optimal. Deep learning requires 10,000+ samples to outperform traditional ML. With small data, simpler models generalize better and avoid overfitting.

### build_priority_pipeline() (Lines 60-64)

```python
def build_priority_pipeline():
    return Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, min_df=1)),
        ('clf', MultinomialNB()),
    ])
```

Same TF-IDF step, but uses **Multinomial Naive Bayes** instead of Logistic Regression.

**Why Naive Bayes for priority?**
- Priority has only 3 classes (High/Medium/Low) vs 12 for categories
- Naive Bayes is faster and works well for simpler classification tasks
- It uses Bayes' theorem: P(High | words) = P(words | High) * P(High) / P(words)

### extract_keywords() Function (Lines 100-140)

```python
def extract_keywords(text: str, model, top_n: int = 5) -> list:
```

**Purpose:** Extract the most important words from a complaint so the admin can quickly understand the issue without reading the full text.

**How it works:**
1. Takes the complaint text and the trained model
2. Uses the TF-IDF vectorizer from the trained model to score each word
3. Sorts words by score (highest = most important)
4. Maps the stemmed words back to original readable words
5. Returns top 5 keywords

**Example:**
- Input: `"The hostel bathroom is very dirty and there are cockroaches everywhere"`
- TF-IDF scores: cockroaches(0.62), dirty(0.45), bathroom(0.38), hostel(0.31), everywhere(0.18)
- Output: `["cockroaches", "dirty", "bathroom", "hostel", "everywhere"]`

**Examiner question: "Why use TF-IDF scores for keywords instead of just picking random words?"**
> TF-IDF gives higher scores to words that are rare and distinctive. Common words like "the" or "very" get low scores. Complaint-specific words like "cockroaches" or "dirty" get high scores. This ensures we extract the most meaningful keywords.

---

## File 2: train.py (Model Training)

This file trains both models and saves them.

### Data Loading (Lines 22-28)

```python
df = pd.read_csv(DATA_PATH)                    # Load 672 complaints from CSV
df['cleaned'] = df['text'].apply(clean_text)    # Clean all texts using NLP pipeline
```

Loads the training data (672 labeled complaints) and preprocesses each one using `clean_text()`.

### Train-Test Split (Lines 35-37)

```python
X_train, X_test, y_train, y_test = train_test_split(
    X_cat, y_cat, test_size=0.2, random_state=42, stratify=y_cat
)
```

- Splits data into 80% training and 20% testing
- `stratify=y_cat` ensures each category has proportional representation in both sets
- `random_state=42` makes the split reproducible (same split every time)

**Examiner question: "Why 80/20 split?"**
> Industry standard. 80% gives the model enough data to learn patterns. 20% is held back to test on unseen data and measure real accuracy. If we tested on training data, accuracy would be artificially high (overfitting).

### Model Training and Evaluation (Lines 39-44)

```python
cat_model = build_category_pipeline()       # Create the model
cat_model.fit(X_train, y_train)             # Train on 80% of data
y_pred = cat_model.predict(X_test)          # Predict on 20% test data
print(accuracy_score(y_test, y_pred))       # Compare predictions vs actual labels
print(classification_report(y_test, y_pred))  # Detailed per-category metrics
```

**Classification report explained:**
- **Precision** = When the model predicts "Hostel", how often is it actually Hostel? (correctness)
- **Recall** = Out of all actual Hostel complaints, how many did the model catch? (completeness)
- **F1-Score** = Balance of precision and recall (harmonic mean)

### Saving Models (Line 45)

```python
save_model(cat_model, CATEGORY_MODEL_PATH)
```

Uses `joblib.dump()` to serialize the trained model to a `.joblib` file. This way, we train once and load the saved model for predictions without retraining.

---

## File 3: predict.py (Prediction Engine)

This file loads saved models and predicts on new complaints.

### Lazy Loading (Lines 15-24)

```python
_cat_model = None
_pri_model = None

def _load_models():
    global _cat_model, _pri_model
    if _cat_model is None:
        _cat_model = load_model(CATEGORY_MODEL_PATH)
```

**What is lazy loading?**
Models are loaded into memory only when the first prediction is requested, not when the file is imported. This saves memory and startup time.

### predict() Function (Lines 27-62)

```python
def predict(text: str) -> dict:
    _load_models()                                          # Load models if not loaded
    cleaned = clean_text(text)                              # NLP preprocessing
    category = _cat_model.predict([cleaned])[0]             # Predict category
    priority = _pri_model.predict([cleaned])[0]             # Predict priority
    keywords = extract_keywords(text, _cat_model, top_n=5)  # Extract top 5 keywords
```

**Flow:**
1. Load saved models (first time only)
2. Clean the input text (lowercase, spell-correct, remove stopwords, stem)
3. Predict category using the category model
4. Predict priority using the priority model
5. Extract top 5 keywords using TF-IDF scores
6. Return everything as a dictionary

### Interactive Mode (Lines 65-85)

```python
if __name__ == '__main__':
    while True:
        text = input('Enter complaint: ').strip()
        result = predict(text)
        print(f'Category : {result["category"]}')
        print(f'Keywords : {", ".join(result["keywords"])}')
        print(f'Priority : {result["priority"]}')
```

When you run `python predict.py`, it starts an interactive loop where you type complaints and see results.

---

## File 4: app.py (Flask API Server)

This file creates a REST API so the frontend can send complaints and receive predictions.

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check if service is running |
| `/predict` | POST | Send complaint text, get category + keywords + priority |
| `/train` | POST | Retrain models (admin only) |

### /predict Endpoint (Lines 44-64)

```python
@app.route('/predict', methods=['POST'])
def predict_route():
    data = request.get_json()           # Get JSON from request body
    text = str(data['text']).strip()     # Extract complaint text
    result = predict(text)              # Run NLP prediction
    return jsonify(result)              # Return JSON response
```

**How the frontend uses it:**
```
Frontend sends: POST /predict { "text": "Hostel bathroom is dirty" }
API returns:    { "category": "Hostel", "keywords": ["bathroom", "dirty"], "priority": "Medium" }
```

---

## Training Dataset

### Structure
The dataset has 3 columns:

| Column | Type | Example |
|--------|------|---------|
| text | string | "The hostel bathroom is very dirty" |
| category | string | "Hostel" |
| priority | string | "Medium" |

### Statistics
- **672 total entries** with **438 unique complaint texts**
- **12 categories**: Hostel, Academics, Mess, Medical, Sports, Infrastructure, Faculty Issue, Library Issue, Exam Issue, Ragging/Harassment, Other, No Issue
- **3 priority levels**: High (96), Medium (319), Low (257)

---

## NLP Pipeline Summary

```
Raw Complaint Text
      |
      v
  1. Lowercase
      |
      v
  2. Remove Punctuation (!,.)
      |
      v
  3. Remove Numbers (3, 2, 100)
      |
      v
  4. Spell Correction (bathrom -> bathroom)
      |
      v
  5. Remove Stopwords (the, is, and, in)
      |
      v
  6. Stemming (working -> work, dirty -> dirti)
      |
      v
  7. TF-IDF Vectorization (text -> numerical vector)
      |
      v
  8. Classification (Logistic Regression / Naive Bayes)
      |
      v
  Output: Category + Priority + Keywords
```

---

## Key Algorithms Used

### 1. TF-IDF (Term Frequency - Inverse Document Frequency)
- Converts text into numerical vectors
- Gives higher weight to rare, distinctive words
- Gives lower weight to common words

### 2. Logistic Regression (Category Classifier)
- Supervised learning algorithm for multi-class classification
- Uses softmax function to output probability for each category
- Picks the category with the highest probability
- Accuracy: **81%**

### 3. Multinomial Naive Bayes (Priority Classifier)
- Probabilistic classifier based on Bayes' theorem
- Assumes features (words) are independent (the "naive" assumption)
- Works well with text classification tasks
- Accuracy: **72%**

### 4. Porter Stemmer (Word Normalization)
- Rule-based algorithm that removes word suffixes
- Reduces vocabulary size, improving model generalization
- Example: "running", "runs", "ran" all become "run"

### 5. Spell Correction (Autocorrect)
- Fixes common typos using word frequency analysis
- Ensures misspelled words are correctly recognized by the model

---

## Common Examiner Questions and Answers

**Q: Why not use Deep Learning (LSTM, BERT, Transformers)?**
> Our dataset has only 672 samples. Deep learning requires 10,000+ samples to be effective. Traditional ML (Logistic Regression + TF-IDF) outperforms deep learning on small datasets because it doesn't overfit.

**Q: How does the model handle new/unseen words?**
> If a word was never seen during training, TF-IDF assigns it a zero score and the model ignores it. The model relies on other known words in the complaint to make a prediction.

**Q: Why two separate models (category and priority)?**
> Category and priority are independent decisions. A "Hostel" complaint could be High or Low priority. Separate models learn these two aspects independently, giving better accuracy than a single combined model.

**Q: What is the purpose of keyword extraction?**
> Administrators receive hundreds of complaints. Keywords provide a 2-3 word summary so they can quickly understand the issue without reading the full complaint. This improves response time.

**Q: How do you handle class imbalance?**
> We ensured each category has at least 35+ training samples through data augmentation. We also use stratified splitting during train-test split to maintain proportional representation.

**Q: What is the confidence score?**
> It's the probability output from Logistic Regression. If the model predicts "Hostel" with 0.85 confidence, it means the model is 85% sure this is a Hostel complaint. Lower confidence may indicate ambiguous complaints.
