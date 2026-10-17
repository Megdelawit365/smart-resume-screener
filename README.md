# Smart Resume Screener & Talent Pipeline API

A backend API that helps recruiters screen resumes automatically using AI.

Candidates can register, upload a resume and apply for jobs. The system parses the resume, asks an AI to score how well the candidate matches the job and stores the result. Recruiters can review applications, see the AI score, and shortlist, reject or hire candidates.

## Features

- Users sign up and log in (email/password or Google)
- Recruiters post jobs
- Applicants upload a PDF or DOCX resume and apply to a job
- The resume is parsed and sent to Gemini AI
- The AI returns extracted skills, an alignment score and skill gaps
- Confirmation and status update emails are sent automatically
- Recruiters shortlist, reject or hire candidates
- Admins can manage users, jobs and applications

## Project Structure

```bash
smart-resume-screener/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   ├── mail.ts
│   │   └── multer.ts
│   │
│   ├── controllers/
│   │   ├── admin.controller.ts
│   │   ├── application.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── job.controller.ts
│   │   ├── oauth.controller.ts
│   │   └── profile.controller.ts
│   │
│   ├── docs/
│   │   └── openapi.json
│   │
│   ├── lib/
│   │   ├── ai.ts
│   │   ├── oauth.ts
│   │   ├── prisma.ts
│   │   └── storage.ts
│   │
│   ├── middlewares/
│   │   ├── authenticate.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── permission.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── validateFile.ts
│   │
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── application.routes.ts
│   │   ├── auth.routes.ts
│   │   └── job.routes.ts
│   │
│   ├── schemas/
│   │   ├── admin.schema.ts
│   │   ├── aiTask.schema.ts
│   │   ├── application.schema.ts
│   │   ├── auth.schema.ts
│   │   ├── file.schema.ts
│   │   ├── job.schema.ts
│   │   └── profile.schema.ts
│   │
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── ai.service.ts
│   │   ├── application.service.ts
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── job.service.ts
│   │   ├── oauth.service.ts
│   │   ├── profile.service.ts
│   │   └── storage.service.ts
│   │
│   ├── templates/
│   │   └── email.template.ts
│   │
│   ├── types/
│   │   └── express.d.ts
│   │
│   ├── utils/
│   │   ├── access-token.ts
│   │   ├── async-handler.ts
│   │   ├── extract-resume-text.ts
│   │   ├── oauth.ts
│   │   ├── password.ts
│   │   └── refresh-token.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── files/
│   │   ├── notes.txt
│   │   └── resume.pdf
│   ├── helpers/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── factories.ts
│   │   └── seed.ts
│   ├── applications.ai.test.ts
│   ├── applications.apply.test.ts
│   ├── applications.read.test.ts
│   ├── applications.status.test.ts
│   ├── auth.login.test.ts
│   ├── auth.logout.test.ts
│   ├── auth.oauth.test.ts
│   ├── auth.refresh.test.ts
│   ├── auth.register.test.ts
│   └── job.tests.ts
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── prisma7.config.ts
├── README.md
├── tsconfig.json
└── vitest.config.ts
```

## Setup instructions

### 1. Clone repository and install dependencies

```bash
git clone https://github.com/Megdelawit365/smart-resume-screener
cd smart-resume-screener
npm install
```

### 2. Create the .env file

Copy .env.example and fill in the values

```bash
cp .env.example .env
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Seed roles and permissions

```bash
npx prisma db seed
```

### 5. Set up external services

#### Supabase Storage

- Create a project at supabase.com
- Create a bucket named resume-screener-assets
- Copy the project URL and service role key into .env
  
#### Gemini Api key

- Go to aistudio.google.com, create an API key and put it in .env as GEMINI_API_KEY

#### Mailtrap

- Go to mailtrap.io and copy the SMTP credentials into .env

### 6. Start the server

```bash
npx tsx src/server.ts
```

## API Documentation

After starting the server open the following link to see an interactive Swagger page listing every endpoint (replace 5000 with the port in .env)

```bash
http://localhost:5000/api/docs
```

## Testing

Run all tests:

```bash
npm test
```

## Tech Stack

- Node.js + TypeScript
- Express
- Prisma + PostgreSQL
- Zod
- JWT for authentication
- Google OAuth
- Multer for file uploads
- Supabase for resume files
- Google gemini for AI evaluation
- Nodemailer + Resend for emails
- Vitest + Supertest for tests
- Swagger UI for API documentation
