# NLP Based Smart Complaint Analysis System

> A full-stack web application for college complaint management using Machine Learning-powered NLP to automatically **classify complaints**, **extract keywords**, and **prioritize issues** for administrators.

---

## What This Project Does

When a student submits a complaint like:

> *"WiFi is not working in hostel since 3 days and the bathroom is very dirty"*

The NLP model automatically processes it and returns:

| Output | Value | Purpose |
|--------|-------|---------|
| **Category** | `Hostel` | Routes complaint to the right department |
| **Keywords** | `wifi, dirty, bathroom` | Admin sees the core issue at a glance |
| **Priority** | `Medium` | Higher priority complaints appear first |

This helps both **students** (faster resolution) and **administrators** (quick understanding of issues without reading long complaints).

---

## Project Flow

```
Student writes complaint
        |
        v
Frontend (React.js) ──POST──> Backend (Node.js/Express)
                                    |
                                    v
                              ML Service (Flask/Python)
                                    |
                          ┌─────────┼──────────┐
                          v         v          v
                    Clean Text   TF-IDF     Predict
                    (remove      Vectorize  Category
                    stopwords,              + Priority
                    stemming)               + Keywords
                          |         |          |
                          └─────────┼──────────┘
                                    |
                                    v
                          Response sent back to Backend
                                    |
                                    v
                          Saved to MongoDB with:
                          - Category (Hostel, Mess, etc.)
                          - Keywords (highlighted problems)
                          - Priority (High/Medium/Low)
                                    |
                                    v
                          Admin Dashboard shows complaints
                          sorted by priority (High first)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express.js + JWT Auth |
| Database | MongoDB + Mongoose |
| NLP/ML | Python + Flask + scikit-learn + NLTK |

---

## Project Structure

```
Smart-Complaint-System/
├── frontend/              # React.js application
│   ├── src/               # Components, pages, API calls
│   └── package.json
│
├── backend/               # Node.js + Express API
│   ├── controllers/       # Route handlers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── middleware/         # Auth middleware
│   ├── seed.js            # Demo data seeder
│   └── server.js          # Entry point
│
└── ml-service/            # Python Flask NLP service
    ├── app.py             # Flask API server
    ├── model.py           # NLP model definitions + keyword extraction
    ├── train.py           # Model training script
    ├── predict.py         # Prediction logic
    ├── requirements.txt   # Python dependencies
    ├── data/
    │   └── training_data.csv   # 672 labeled complaints
    └── models/
        ├── category_model.joblib   # Trained category classifier
        └── priority_model.joblib   # Trained priority classifier
```

---

## How to Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.9+

### Step 1: ML Service (Start First)

```bash
cd ml-service
pip install -r requirements.txt
python train.py     # Train the NLP models (one-time)
python app.py       # Starts on http://localhost:5001
```

### Step 2: Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm install
node seed.js        # Creates demo users & sample complaints
npm run dev         # Starts on http://localhost:5000
```

### Step 3: Frontend

```bash
cd frontend
npm install
npm run dev         # Starts on http://localhost:3000
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@demo.com | 123456 |
| Teacher | teacher@demo.com | 123456 |
| Admin | admin@demo.com | 123456 |

---

## NLP Model Details

### How It Works

1. **Text Cleaning** — Lowercase, remove punctuation, remove stopwords, apply Porter stemming
2. **TF-IDF Vectorization** — Convert text to numerical features using Term Frequency-Inverse Document Frequency with bigrams
3. **Category Classification** — Logistic Regression classifies into 12 categories
4. **Priority Classification** — Multinomial Naive Bayes assigns High/Medium/Low
5. **Keyword Extraction** — TF-IDF scores identify the most important words and map them back to original readable text

### Categories (12)

| Category | Example Complaint |
|----------|-------------------|
| Hostel | WiFi not working, dirty bathroom |
| Academics | Attendance too strict, syllabus outdated |
| Mess | Food is oily, insects in food |
| Medical | Only paracetamol given, no doctor at night |
| Sports | Gym broken, no equipment |
| Infrastructure | Projector not working, no electricity |
| Faculty Issue | Professor absent, no email response |
| Library Issue | Old books, library closes early |
| Exam Issue | Timetable clash, results delayed |
| Ragging / Harassment | Bullying, threats from seniors |
| Other | Bus timing, parking, fees |
| No Issue | No complaints, everything is fine |

### Model Accuracy

| Model | Accuracy | Algorithm |
|-------|----------|-----------|
| Category Classifier | **80%** | Logistic Regression + TF-IDF |
| Priority Classifier | **72%** | Multinomial Naive Bayes + TF-IDF |

### Training Data
- **672 complaint entries** with text, category, and priority labels
- All entries in English
- Balanced across 12 categories

---

## API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Complaints
| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/complaints` | Student |
| GET | `/api/complaints/my` | Student |
| GET | `/api/complaints` | Teacher/Admin |
| GET | `/api/complaints/:id` | Any |
| PUT | `/api/complaints/:id/status` | Teacher/Admin |

### ML Service
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/predict` | Classify complaint → returns category, keywords, priority |
| GET | `/health` | Check if ML service is running |
| POST | `/train` | Retrain models (admin only) |

### ML Prediction Example

**Request:**
```json
POST /predict
{ "text": "The mess food is too oily and causes stomach problems every day" }
```

**Response:**
```json
{
    "category": "Mess",
    "keywords": ["stomach", "problems", "oily", "causes", "every"],
    "priority": "Medium",
    "priorityScore": 2,
    "sentiment": "Negative",
    "category_confidence": 0.54
}
```

---

## Features

### Student
- Register / Login
- Submit complaint with title + description
- NLP auto-assigns **category**, **priority**, and **keywords**
- Option to submit anonymously
- View all complaints with status
- Filter by status (Pending / In Progress / Solved)

### Teacher / Admin
- View all complaints **sorted by priority** (High → Medium → Low)
- See **keywords** for quick issue understanding
- Filter by category, priority, status, or search
- Mark as **In Progress** or **Solved** with notes
- **Analytics dashboard** with charts

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/complaint_system
JWT_SECRET=your_secret_key
ML_SERVICE_URL=http://localhost:5001
CLIENT_URL=http://localhost:3000
```
