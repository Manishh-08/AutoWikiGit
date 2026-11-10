# 🧠 AutoWiki Git — Intelligent Codebase Knowledge & RAG Platform

> **Transform any GitHub repository into an interactive, grounded AI knowledge base in seconds.**  
> Asynchronous event-driven repo indexing, semantic code chunking, Pinecone vector search, and LLM reasoning with exact source file citations.

---

## ✨ Features

- **⚡ Event-Driven Codebase Ingestion**: Index large public or private repositories asynchronously using **Inngest** background queues, eliminating HTTP timeouts and gateway limits.
- **🔍 Precision Semantic Search**: High-dimensional vector search powered by **Pinecone** with namespace isolation per repository and top-$K$ similarity matching.
- **🎯 Zero-Hallucination Grounding**: Strict prompt engineering constrains LLM generation to indexed repository files, paired with verified source file paths.
- **✂️ Intelligent Code Chunking & Filtering**: Uses LangChain's `RecursiveCharacterTextSplitter` (1,000-char chunks, 150-char overlap) with intelligent heuristics to skip binaries, dependencies (`node_modules`), lockfiles, and minified bundles.
- **🔒 SHA-256 Deduplication & Batching**: Generates deterministic SHA-256 content hashes to eliminate duplicate vectors and writes in batches of 100 to optimize vector database throughput.
- **🔑 Flexible GitHub Authentication**: Sign in with GitHub OAuth via **Better-Auth** or provide fine-grained Personal Access Tokens (PAT) for private repo access.
- **💻 Interactive Developer Workspace**: Modern developer UI with syntax-highlighted code blocks (via **Shiki**), interactive citation drawer, and real-time job status polling.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Backend Framework** | [Express 5](https://expressjs.com/), [Node.js](https://nodejs.org/) (ES Modules) |
| **Languages** | [TypeScript](https://www.typescriptlang.org/), [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| **AI & RAG Framework** | [LangChain](https://www.langchain.com/), OpenAI / OpenRouter (`gpt-4o-mini`, `text-embedding-3-small`) |
| **Vector Database** | [Pinecone](https://www.pinecone.io/) (Namespace-per-repo isolation) |
| **Job Queue & Orchestration** | [Inngest](https://www.inngest.com/) (Durable execution & background workflows) |
| **Primary Database** | [PostgreSQL](https://www.postgresql.org/) (`pg` connection pool) |
| **Authentication** | [Better-Auth](https://better-auth.com/) (GitHub OAuth & Session Management) |
| **GitHub Integration** | [@octokit/rest](https://github.com/octokit/rest.js) (Recursive Git tree traversal) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), `@base-ui/react`, Radix UI, Lucide Icons |
| **Syntax Highlighting** | [Shiki](https://shiki.style/), React Markdown, Remark GFM |
| **Client State** | [TanStack React Query](https://tanstack.com/query), [Zustand](https://zustand.docs.pmnd.rs/) |

---

## 🏗️ Architecture Flow

```mermaid
flowchart LR
    A[GitHub Repo URL] --> B[POST /api/index]
    B --> C[Inngest Job Queue]
    C --> D[Octokit / GitHub Tree API]
    D -->|Filtered Code Files| E[LangChain Text Splitter]
    E -->|Chunks + Metadata| F[OpenAI Embeddings]
    F -->|Batched SHA-256 Vectors| G[(Pinecone Vector DB)]
    H[Developer Question] --> I[POST /api/chat]
    I --> J[Pinecone Top-K Search]
    G -->|Context Chunks| J
    J --> K[LLM / OpenRouter]
    K --> L[Grounded Answer + Citations]
    L --> M[Next.js Interactive UI]
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20+ recommended
- **PostgreSQL Database** (e.g., Neon, Supabase, or local PostgreSQL)
- **Pinecone Account**: An active Pinecone serverless index (e.g., dimension `1536` for `text-embedding-3-small`)
- **OpenRouter or OpenAI API Key**: For embeddings and chat generation
- **GitHub OAuth App**: For Better-Auth user authentication (or Personal Access Tokens)

---

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/auto-wiki-git.git
cd auto-wiki-git

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

### 3. Environment Variables

#### Backend (`server/.env`)
Create a `.env` file inside the `server/` directory:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/autowiki

# Better Auth & GitHub OAuth
BETTER_AUTH_SECRET=your_better_auth_secret_here
BETTER_AUTH_URL=http://localhost:3001
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# AI & Vector Store
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=auto-wiki-git

# Inngest
INNGEST_DEV=1
```

#### Frontend (`client/.env.local`)
Create a `.env.local` file inside the `client/` directory:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

---

### 4. Database Setup

The server automatically initializes the required `chat_jobs` table in PostgreSQL on application startup. Ensure your PostgreSQL connection string in `DATABASE_URL` is active and reachable.

---

### 5. Start the Development Servers

Run the following services in separate terminal windows:

#### Step 1: Start Backend
```bash
cd server
npm run dev
```
*Backend server runs on [http://localhost:3001](http://localhost:3001)*

#### Step 2: Start Inngest Dev Server (Background Jobs)
```bash
npx inngest-cli@latest dev -u http://localhost:3001/api/inngest
```
*Inngest dashboard opens at [http://localhost:8288](http://localhost:8288)*

#### Step 3: Start Frontend
```bash
cd client
npm run dev
```
*Frontend runs on [http://localhost:3000](http://localhost:3000)*

---

## ⚡ How It Works

| Step | Action | Description |
| :---: | :--- | :--- |
| **1** | **Repository Ingestion** | Input a repository URL (e.g. `owner/repo`). Inngest triggers a background worker to recursively fetch all source files via GitHub's Git Trees API. |
| **2** | **Code Preprocessing** | Assets, binaries, vendor folders, and lockfiles are purged. Source code is chunked with 150-character boundary overlaps. |
| **3** | **Deduplication & Embedding** | Chunks receive SHA-256 deterministic IDs, are converted to vector embeddings, and upserted in batches of 100 into a repo-specific Pinecone namespace. |
| **4** | **Query & Inference** | Asking a question initiates a similarity search in Pinecone ($k=5$). Retrieved chunks are passed into the LLM prompt, returning a grounded answer with file links. |

---

## 📦 Available Scripts

### Backend (`/server`)
- `npm run dev` — Starts the Express API server with `nodemon`.
- `npm start` — Runs the production Node server.

### Frontend (`/client`)
- `npm run dev` — Starts the Next.js development server with Turbopack.
- `npm run build` — Creates an optimized production build.
- `npm run start` — Runs the compiled production Next.js server.
- `npm run lint` — Runs ESLint checks across TypeScript and React components.

---

## 🌐 Deployment

### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the `client/` directory as the Root Directory in [Vercel](https://vercel.com).
3. Set the environment variable `NEXT_PUBLIC_SERVER_URL` to your production backend URL.

### Backend (Render / Railway / VPS)
1. Deploy the `server/` directory on [Railway](https://railway.app/) or [Render](https://render.com/).
2. Configure all environment variables from `server/.env`.
3. Set your Inngest production webhook URL to `https://your-backend.com/api/inngest`.
