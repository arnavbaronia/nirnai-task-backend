# Backend

A NestJS backend service for automating extraction, translation, and storage of Tamil real estate transaction PDFs into a PostgreSQL database.

---

## 📌 Features

- 🔍 PDF text extraction using `pdf-parse`
- 🌐 Tamil-to-English translation via LibreTranslate API
- 📄 Transaction data parsing
- 🔐 JWT-based authentication using Passport.js
- 📡 REST API endpoints to upload and retrieve transactions

---

## ⚙️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + Drizzle ORM
- **PDF Processing**: pdf-parse
- **Translation**: LibreTranslate API
- **Authentication**: JWT, Passport
- **Optional**: Redis for caching

---

## 📦 Installation, Setup and Running the Server

```bash
git clone https://github.com/nirnai-task-backend.git
cd nirnai-backend

npm install

createdb tamil_real_estate
psql -U postgres -d tamil_real_estate -f schema.sql

CONFIGURE THE ENV FILE

DATABASE_URL=postgres://user:pass@localhost:5432/tamil_real_estate
JWT_SECRET=your-secret-key
TRANSLATE_API_URL=https://libretranslate.de

npm run start:dev
npm run build
npm run start
