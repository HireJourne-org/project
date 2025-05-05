# Interview Prep App

A React application to help you prepare for technical interviews by managing and tracking interview questions.

## Features

- Track interview questions and answers
- Categorize questions by topic
- Mark questions as Answered, Pending, or Needs Review
- Search and filter questions
- Dashboard with statistics and overview
- Airtable integration for data storage

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your Airtable credentials:
   ```
   VITE_AIRTABLE_API_KEY=your_airtable_api_key_here
   VITE_AIRTABLE_BASE_ID=your_airtable_base_id_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Airtable Setup

1. Create an Airtable account if you don't have one
2. Create a new base with a table named "Questions"
3. Add the following fields to your Questions table:
   - question (Single line text)
   - answer (Long text)
   - category (Single line text)
   - status (Single select: Answered, Needs Review, Pending)
   - difficulty (Single select: Easy, Medium, Hard)
   - notes (Long text)
   - lastReviewed (Date)
4. Get your API key from your Airtable account settings
5. Get your Base ID from the Airtable API documentation

## Technologies Used

- React
- React Router
- Tailwind CSS
- Airtable API
- Vite

## Storage

This project uses Supabase Storage for managing files such as resumes and generated reports. We maintain a strict folder structure and security policies to ensure proper access control.

Key features:
- User-scoped file storage
- Secure file access with Row Level Security
- PDF report generation and storage

For developers working with storage, please refer to the [Storage Guidelines](docs/storage-guidelines.md) document.