# NLP Based Smart Complaint Analysis System

> A full-stack web application for college complaint management using Machine Learning-powered NLP to categorize and prioritize student complaints automatically.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express.js + JWT Auth |
| Database | MongoDB + Mongoose |
| NLP/ML | Python + Flask + scikit-learn + NLTK |

---

## Project Structure

```
Minor_2/
├── frontend/          # React.js application
├── backend/           # Node.js + Express API
└── ml-service/        # Python Flask NLP service
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.9+

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm install
node seed.js        # Creates demo users & sample complaints
npm run dev         # Starts on http://localhost:5000
```

### 2. ML Service Setup

```bash
cd ml-service
pip install -r requirements.txt
python train.py     # Train models (creates models/ directory)
python app.py       # Starts on http://localhost:5001
```

> The ML service auto-trains if models don't exist. If unavailable, the backend falls back to rule-based NLP.

### 3. Frontend Setup

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

## Features

### Student
- Register / Login
- Submit complaint with title + description
- NLP auto-assigns **category** and **priority**
- Option to submit anonymously
- View all complaints with status
- Filter by status (Pending / In Progress / Solved)

### Teacher / Admin
- View all complaints **sorted by priority** (High → Medium → Low)
- Filter by category, priority, status, or search
- View NLP analysis details (confidence scores, cleaned text)
- Mark as **In Progress** or **Solved** with notes
- **Analytics dashboard** with:
  - Monthly bar chart
  - Category distribution pie chart
  - Solved vs Pending status chart

### NLP Features
- **Text cleaning**: stop word removal, stemming, lowercasing
- **TF-IDF vectorization** with bigrams
- **Category classifier**: Logistic Regression
- **Priority classifier**: Multinomial Naive Bayes
- **Sentiment detection**: Negative / Neutral / Positive
- **Fallback**: Rule-based keyword detection when ML service is offline

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

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/summary` | Dashboard counts |
| GET | `/api/analytics/monthly` | Monthly bar chart data |
| GET | `/api/analytics/categories` | Category distribution |
| GET | `/api/analytics/status` | Status distribution |

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/complaint_system
JWT_SECRET=your_secret_key
ML_SERVICE_URL=http://localhost:5001
EMAIL_USER=your_email@gmail.com   # Optional: for high-priority alerts
EMAIL_PASS=your_app_password       # Optional
CLIENT_URL=http://localhost:3000
```
