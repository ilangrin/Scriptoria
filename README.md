# Scriptoria — Old French Document Translator

A production-ready web application for translating old French documents (handwritten or printed) into Hebrew, English, or clean modern French using GPT-4o vision AI.

---

## Features

- **Upload** JPG, PNG, or PDF files (up to 10 pages, 50MB max)
- **AI Transcription** — preserves original French text with historical accuracy
- **Smart Uncertainty Detection** — surfaces unclear terms for user review, never silently guesses
- **Multi-language Translation** — Hebrew, English, or modern French (accurate or fluent style)
- **User-Assisted Correction** — review unclear terms and reprocess with corrections
- **Export** — download as PDF or Word (DOCX)
- **Documents Dashboard** — manage and track all translations
- **Version History** — stores original + corrected translation versions
- **Debug Panel** — inspect AI request/response logs (API keys redacted)

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **PostgreSQL** + **Prisma ORM**
- **OpenAI GPT-4o** (vision + JSON structured output)
- **pdf-lib** (PDF export)
- **docx** (Word export)

---

## Quick Start

### 1. Clone and install

```bash
cd scriptoria
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/scriptoria"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
UPLOAD_DIR="./uploads"
```

### 3. Set up the database

```bash
# Create the database first, then:
npm run db:push       # Apply schema to database
npm run db:generate   # Generate Prisma client
```

### 4. Create uploads directory

```bash
mkdir -p uploads/originals uploads/pages uploads/exports
```

### 5. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
scriptoria/
├── app/
│   ├── api/
│   │   ├── upload/          # File upload endpoint
│   │   ├── documents/       # Document CRUD
│   │   ├── jobs/            # Job management
│   │   │   └── [jobId]/
│   │   │       ├── process/     # Start AI processing
│   │   │       ├── corrections/ # Submit user corrections
│   │   │       └── export/      # Export PDF/DOCX
│   │   ├── files/           # Serve uploaded files
│   │   └── debug/           # Debug logs endpoint
│   ├── upload/              # Upload page
│   ├── documents/           # Documents dashboard
│   ├── jobs/[jobId]/        # Job status + results
│   │   └── review/          # User correction review
│   └── debug/               # Debug panel
├── components/              # React UI components
├── lib/
│   ├── ai/openai.ts         # OpenAI integration
│   ├── storage/local.ts     # File storage (abstracted)
│   ├── pdf/processor.ts     # PDF page extraction
│   └── export/              # PDF + DOCX generators
├── prisma/
│   └── schema.prisma        # Database schema
└── types/index.ts           # Shared TypeScript types
```

---

## Job Flow

```
uploaded → pending_confirmation → processing → [waiting_user_input] → reprocessing → completed
                                              ↘ completed (if no uncertain terms)
```

---

## AI Response Format

Every page processed returns structured JSON:

```json
{
  "transcription": "original French text",
  "translation": "translated text",
  "confidence": "high | medium | low",
  "uncertain_terms": [
    {
      "id": "term_1",
      "snippet": "unclear word",
      "context": "full sentence containing it",
      "reason": "why unclear",
      "suggested_guess": "optional AI guess",
      "question": "question for the user"
    }
  ]
}
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-4o`) |
| `UPLOAD_DIR` | No | Local upload path (default: `./uploads`) |
| `MAX_FILE_SIZE_MB` | No | Max file size in MB (default: `50`) |
| `MAX_PAGES` | No | Max pages per job (default: `10`) |
| `NEXT_PUBLIC_APP_URL` | No | App URL for production |

---

## Production Notes

- For S3/Supabase storage: implement `lib/storage/s3.ts` following the same interface as `lib/storage/local.ts`
- For authentication: add NextAuth.js and associate documents with `userId`
- Processing happens synchronously in the API route — for large jobs, consider a background queue (e.g., BullMQ, inngest)
- The debug panel should be protected by authentication in production
