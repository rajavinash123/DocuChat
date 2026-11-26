# DocuChat – AI-Powered PDF Assistant

An AI-powered document question-answering application that allows users to upload PDF documents and interact with their content using natural language. Built with Next.js, LangChain.js, Qdrant, and Google Gemini embeddings, DocuChat uses Retrieval-Augmented Generation (RAG) to provide context-aware answers based on uploaded documents.

## Overview

DocuChat aims to make document interaction easier by allowing users to ask questions about their PDF files instead of manually searching through lengthy documents.

The application processes PDF content, splits it into smaller chunks, generates vector embeddings, and stores them in Qdrant. When a user asks a question, the system retrieves relevant document chunks and uses an LLM to generate a contextual response.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application framework |
| JavaScript | Application development |
| Tailwind CSS | Responsive UI styling |
| LangChain.js | Document processing and RAG pipeline |
| Google Gemini Embeddings | Text-to-vector conversion |
| Qdrant | Vector database and similarity search |
| Groq API | LLM-powered document chat |
| PDF.js / PDF Parser | PDF text extraction |

## Key Features

- **PDF Upload:** Upload PDF documents for AI-powered interaction.
- **Document Processing:** Extract text content from uploaded PDF files.
- **Text Chunking:** Split large documents into smaller chunks using Recursive Character Text Splitter.
- **Vector Embeddings:** Convert document chunks into numerical vector representations.
- **Vector Storage:** Store and retrieve document embeddings using Qdrant.
- **Semantic Search:** Retrieve relevant document chunks based on the user's question.
- **AI-Powered Chat:** Generate contextual responses using the Groq API.
- **Conversation Persistence:** Restore the current conversation and uploaded document label after browser refresh using browser storage.

## How It Works – RAG Architecture

```text
        PDF Upload
            |
            v
     PDF Text Extraction
            |
            v
       Text Splitting
            |
            v
    Google Gemini Embeddings
            |
            v
      Qdrant Vector DB
            |
            |
      User Question
            |
            v
    Question Embedding
            |
            v
      Semantic Search
            |
            v
   Relevant Document Chunks
            |
            v
       Groq LLM API
            |
            v
      AI Generated Answer
```

## Project Structure

```text
chat-with-pdf/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   └── chat/
│   ├── page.js
│   ├── layout.js
│   └── globals.css
├── components/
├── lib/
│   ├── embeddings.js
│   ├── qdrant.js
│   ├── text-splitter.js
│   └── rag.js
├── public/
├── .env.local
├── .gitignore
└── README.md
```

*The structure above is illustrative; update it to match the actual repository.*

## Environment Variables

Create a `.env.local` file in the root directory:

```env
GOOGLE_API_KEY=your_google_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
GROQ_API_KEY=your_groq_api_key
```

Never expose API keys in frontend code or commit `.env.local` to GitHub.

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project directory

```bash
cd chat-with-pdf
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create `.env.local` and add your Google, Qdrant, and Groq credentials.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Future Enhancements

- Multi-PDF document conversations.
- Source citations with PDF page references.
- User authentication and document-level access control.
- Chat history management.
- Streaming AI responses.
- Advanced RAG with reranking and hybrid search.
- Document processing status and background jobs.
- RAG evaluation and response-quality monitoring.

## Learning Outcomes

Through this project, I am exploring and implementing:

- Retrieval-Augmented Generation (RAG).
- LLM and embedding integration.
- Vector databases and semantic search.
- Document ingestion and text chunking.
- Backend API development with Next.js.
- AI application architecture using LangChain.js.

## Project Status

🚧 Currently under development.

## Author

