# PDF to CBT Exam System

A production-ready web application for uploading PDF question papers and converting them into interactive CBT exams.

## Tech stack

- Frontend: React.js, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- PDF Parsing: pdf-parse
- AI Extraction: rule-based extraction with fallback sample data

## Project structure

- `/client` - React frontend
- `/server` - Node/Express backend

## Setup

### 1. Install MongoDB

Run MongoDB locally or configure a cloud connection.

### 2. Backend install

```
cd e:\CBT\server
npm install
```

### 3. Frontend install

```
cd e:\CBT\client
npm install
```

### 4. Run backend

```
cd e:\CBT\server
npm run dev
```

### 5. Run frontend

```
cd e:\CBT\client
npm start
```

## API Endpoints

- `POST /api/upload-pdf` - upload PDF and create a test
- `GET /api/test/:id` - get test data by ID
- `POST /api/submit-test` - submit exam answers and calculate results

## Notes

- The file upload endpoint accepts only `.pdf` files.
- The AI extraction function is implemented in `server/utils/aiExtractor.js`.
- If PDF text extraction fails, the system falls back to sample question data.
- Use `REACT_APP_API_URL` in `client/.env` to point to the backend if needed.
