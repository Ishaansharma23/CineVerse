<div align="center">

# 🎬 CineVerse

### *Production-Grade AI-Powered Movie Ticket Booking Platform*

[![CineVerse CI](https://github.com/ishaansharma23/cineVerse/actions/workflows/docker.yml/badge.svg)](https://github.com/ishaansharma23/cineVerse/actions/workflows/docker.yml)
[![Docker Backend](https://img.shields.io/docker/v/ishaansharma23/cineverse-backend?label=Docker%20Backend&color=blue&logo=docker)](https://hub.docker.com/r/ishaansharma23/cineverse-backend)
[![Docker Frontend](https://img.shields.io/docker/v/ishaansharma23/cineverse-frontend?label=Docker%20Frontend&color=cyan&logo=docker)](https://hub.docker.com/r/ishaansharma23/cineverse-frontend)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-v6%2B-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![LangChain](https://img.shields.io/badge/LangChain-v1.2-1C3C3C?logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-000000?logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/ec2/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

<br />

<img src="./frontend/public/banner.png" alt="CineVerse Platform Banner" width="100%" />

<br />

---

**CineVerse** is a modern, enterprise-ready movie ticket booking platform built with the **MERN** stack (MongoDB, Express, React 19, Node.js). Designed with production principles at its core, CineVerse features a **LangChain & LangGraph-orchestrated AI Movie Booking Agent**, distributed **Redis seat concurrency locks**, **RAG-based personalized recommendations**, **Razorpay payment automation**, real-time **Socket.IO** updates, and full **AWS EC2 production deployment** with an automated **GitHub Actions CI/CD pipeline**.

[Explore Features](#-features) • [System Architecture](#-system-architecture) • [AI Agent Architecture](#-ai-agent-architecture) • [Docker Setup](#-docker-setup) • [CI/CD & AWS Deployment](#-github-actions-cicd--aws-deployment)

</div>

---

## 📌 Table of Contents

- [🎬 CineVerse](#-cineverse)
    - [*Production-Grade AI-Powered Movie Ticket Booking Platform*](#production-grade-ai-powered-movie-ticket-booking-platform)
  - [📌 Table of Contents](#-table-of-contents)
  - [📖 Project Overview](#-project-overview)
  - [✨ Key Features](#-key-features)
  - [💻 Tech Stack](#-tech-stack)
  - [🏗️ System Architecture](#️-system-architecture)
  - [🤖 AI Agent Architecture](#-ai-agent-architecture)
  - [🔐 Authentication Flow](#-authentication-flow)
  - [🎟️ Seat Booking Flow](#️-seat-booking-flow)
  - [⚡ Redis Seat Locking Mechanism](#-redis-seat-locking-mechanism)
  - [🧠 Retrieval-Augmented Generation (RAG) Architecture](#-retrieval-augmented-generation-rag-architecture)
  - [📂 Folder Structure](#-folder-structure)
  - [🗄️ Database Collections](#️-database-collections)
  - [🚀 Installation Guide](#-installation-guide)
  - [🔑 Environment Variables](#-environment-variables)
  - [🐳 Docker Setup](#-docker-setup)
  - [🚢 Docker Compose Development](#-docker-compose-development)
  - [🔄 GitHub Actions CI/CD & AWS Deployment](#-github-actions-cicd--aws-deployment)
  - [🌐 API Modules](#-api-modules)
  - [🛡️ Security Architecture](#-security-architecture)
  - [🚀 Performance Optimizations](#-performance-optimizations)
  - [🔮 Future Enhancements](#-future-enhancements)
  - [📹 Demo](#-demo)
  - [👥 Contributors](#-contributors)
  - [📄 License](#-license)
  - [📬 Contact](#-contact)

---

## 📖 Project Overview

CineVerse reimagines movie ticketing by combining robust distributed backend services with an **autonomous AI Booking Agent**. Unlike static ticketing portals or simple conversational chatbots, CineVerse implements an agentic workflow that executes backend database tools, maintains session state, handles seat locking, and assists users across multi-step transactions.

The platform provides fine-grained governance through **Role-Based Access Control (RBAC)** across three distinct user roles:

```
                          ┌─────────────────────────┐
                          │   CineVerse Platform    │
                          └────────────┬────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
 ┌─────────────┐               ┌──────────────┐               ┌──────────────┐
 │    User     │               │ Theatre Owner│               │    Admin     │
 └──────┬──────┘               └──────┬───────┘               └──────┬───────┘
        │                             │                              │
        ├─ Search Movies              ├─ Add/Manage Theatres         ├─ Approve Theatres
        ├─ AI Booking Agent           ├─ Add Screens & Seats Layout  ├─ Approve Show Proposals
        ├─ Interactive Seat Map       ├─ Propose Show Schedules      ├─ Platform Analytics
        ├─ Razorpay Checkout          ├─ Dynamic Price Multipliers   ├─ Dynamic Price Config
        └─ Digital Ticket (PDF & QR)  └─ Revenue Dashboard           └─ User Management
```

- **User**: Search movies (TMDB synced), chat with the AI agent to discover and select shows, select seats interactively, pay securely via Razorpay, and download PDF tickets containing verified QR codes.
- **Theatre Owner**: Manage theatre properties, design custom screen layout grids (Standard, VIP, Executive seats), submit show scheduling proposals to Admins, and view theatre revenue analytics.
- **Admin**: Approve or reject theatre registration proposals and show schedules, manage platform-wide pricing configurations (base rates, weekend multipliers, peak hour taxes), and inspect full system activity.

---

## ✨ Key Features

- **🤖 AI Movie Booking Agent (Not a Chatbot)**: Multi-step autonomous agent built using **LangGraph** & **LangChain** that performs intent classification, entity extraction, backend tool calling, session state tracking, and direct seat selection redirection.
- **🔒 Race-Condition Free Seat Locking**: High-concurrency seat locking engine using **Redis** with atomic `SET NX EX` commands (5-minute TTL expiration) and non-blocking `SCAN` iteration to guarantee zero double-bookings.
- **🧠 Vector RAG & Preference Memory**: Hybrid memory store utilizing **Pinecone Vector Database** for semantic preference similarity search (`embedding-001`), paired with **MongoDB** fallback storage for structured preference persistence.
- **💳 Razorpay Payment Integration**: End-to-end payment lifecycle handling order creation, signature verification using HMAC-SHA256, automatic seat confirmation, and refund processing on cancellations.
- **📲 PDF Ticket & QR Code Generation**: Server-side generation of downloadable digital tickets formatted with `pdfkit` and embedded `qrcode` data for on-site scanning.
- **🔄 TMDB Automated Synchronization**: Server background cron job (`node-cron`) periodically fetching latest releases, trending films, cast details, and backdrop artwork from the **TMDB API**.
- **⚡ Real-Time Socket.IO Synchronization**: WebSocket channels broadcasting instant seat selection state changes and show updates to connected clients.
- **📧 Automated Abandoned Booking Reminders**: Background cron engine (`node-cron` & `nodemailer`) monitoring uncompleted seat reservations and dispatching dynamic, genre-aware, high-conversion email reminders with direct payment resume links.
- **☁️ AWS EC2 & Automated CI/CD Pipeline**: End-to-end continuous integration & continuous deployment via **GitHub Actions** (`.github/workflows/docker.yml` & `cd.yml`), building multi-stage Docker containers to Docker Hub and automatically SSH-deploying live containers to **AWS EC2** upon code push.

---

## 💻 Tech Stack

### Frontend

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **React 19** | UI Library | Component-driven declarative web interface |
| **Vite** | Build Tool | Lightning-fast module bundler & dev server |
| **Redux Toolkit** | State Management | Centralized global application state |
| **TailwindCSS v4** | Styling Framework | Utility-first responsive dark-mode styling system |
| **Framer Motion** | Animations | Complex UI page transitions and micro-interactions |
| **GSAP** | Animations | High-performance hero canvas animations |
| **Socket.IO Client** | WebSockets | Real-time seat occupation sync |
| **Lucide React** | Icons | Modern icon set for component UI |

### Backend

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **Node.js** | Runtime Environment | Asynchronous event-driven server runtime |
| **Express.js v5** | Web Framework | REST API route management & middleware execution |
| **MongoDB / Mongoose v9** | Database / ORM | Document storage for users, shows, theatres, & bookings |
| **Redis v6+** | Cache & Lock Manager | Memory store for 5-minute atomic seat locks & sessions |
| **Socket.IO** | WebSocket Server | Bi-directional event communication for live seat maps |
| **PDFKit & QRCode** | Asset Generation | Server-side ticket PDF creation with embedded QR vectors |
| **Nodemailer** | Mail Service | Automated booking confirmation email delivery |
| **Node-Cron** | Task Scheduler | Background TMDB movie sync & expired lock cleanup |

### AI & Vector Database

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **LangChain** | AI Framework | LLM tooling orchestration & chain management |
| **LangGraph** | Agentic Workflow | Directed Acyclic Graph (DAG) state nodes for agent |
| **Google Gemini 2.5** | LLM Engine | Intent classification, entity extraction & response generation |
| **Pinecone** | Vector Database | High-performance similarity search for user RAG embeddings |
| **Google GenAI Embeddings** | Vector Embeddings | `embedding-001` model for text vectorization |

### DevOps & Infrastructure

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **Docker** | Containerization | Isolated application runtime environments |
| **Docker Compose** | Orchestration | Multi-container environment configuration |
| **GitHub Actions** | CI Engine | Automated build and push workflow on git push |
| **Docker Hub** | Image Registry | Container repository (`ishaansharma23/cineverse-*`) |

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    %% Custom Theme Class Definitions
    classDef clientStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    classDef gatewayStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    classDef serviceStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    classDef aiStyle fill:#311042,stroke:#c084fc,stroke-width:2px,color:#fff
    classDef dbStyle fill:#451a03,stroke:#fbbf24,stroke-width:2px,color:#fff
    classDef extStyle fill:#27272a,stroke:#a1a1aa,stroke-width:2px,color:#fff

    subgraph CLIENT_TIER ["📱 CLIENT TIER (REACT SPA & WEBSOCKETS)"]
        UI["💻 React 19 SPA (Redux Toolkit + Tailwind v4)"]:::clientStyle
        WS_CLIENT["⚡ Socket.IO Web Event Client"]:::clientStyle
    end

    subgraph SECURITY_GATEWAY ["🛡️ API GATEWAY & SECURITY LAYER"]
        AUTH_MW["🔑 JWT Cookie Authentication Middleware"]:::gatewayStyle
        RBAC_MW["🔒 Role-Based Access Control Guard (RBAC)"]:::gatewayStyle
        RATE_LIMIT["⚡ Express Rate Limiter Middleware"]:::gatewayStyle
    end

    subgraph CORE_SERVICES ["⚙️ CORE BACKEND MICRO-SERVICES"]
        BOOKING_SVC["🎟️ Booking & Seat Management Controller"]:::serviceStyle
        AI_SVC["🤖 LangGraph AI Booking Agent Engine"]:::aiStyle
        PAYMENT_SVC["💳 Razorpay Payment & Webhook Service"]:::serviceStyle
        SYNC_SVC["🔄 TMDB Auto-Sync Cron Job"]:::serviceStyle
        TICKET_SVC["📄 PDFKit & QR Code Generator"]:::serviceStyle
    end

    subgraph INFRASTRUCTURE ["💾 PERSISTENCE & DISTRIBUTED CACHE"]
        MONGO[("🗄️ MongoDB Primary Storage<br/>(Users, Movies, Shows, Bookings)")]:::dbStyle
        REDIS[("⚡ Redis In-Memory Store<br/>(5-Min Atomic Seat Locks)")]:::dbStyle
        PINECONE[("🌲 Pinecone Vector DB<br/>(User RAG Preference Embeddings)")]:::dbStyle
        WS_SERVER["📡 Socket.IO Server Engine<br/>(Real-Time Room Broadcasting)"]:::serviceStyle
    end

    subgraph EXTERNAL_APIS ["🌐 EXTERNAL THIRD-PARTY SERVICES"]
        GEMINI["🧠 Google Gemini 2.5 LLM"]:::extStyle
        RAZORPAY["💳 Razorpay Payment Gateway API"]:::extStyle
        TMDB["🎬 TMDB API v3"]:::extStyle
    end

    %% Flow Connections
    UI -->|HTTP / REST API| AUTH_MW
    UI <-->|WebSocket Stream| WS_CLIENT
    WS_CLIENT <-->|Live Seat Status Sync| WS_SERVER

    AUTH_MW --> RBAC_MW --> RATE_LIMIT
    RATE_LIMIT --> BOOKING_SVC
    RATE_LIMIT --> AI_SVC
    RATE_LIMIT --> PAYMENT_SVC

    BOOKING_SVC <-->|Atomic SET NX EX Lock| REDIS
    BOOKING_SVC <-->|Read / Write Bookings| MONGO
    BOOKING_SVC -->|Generate Ticket| TICKET_SVC

    AI_SVC <-->|Intent & Tool Calling| GEMINI
    AI_SVC <-->|Vector Cosine Search| PINECONE
    AI_SVC <-->|Structured Preference Cache| MONGO

    PAYMENT_SVC <-->|Order & Signature Verification| RAZORPAY
    PAYMENT_SVC <-->|Update Payment Status| MONGO

    SYNC_SVC <-->|Automated Cron Fetch| TMDB
    SYNC_SVC -->|Upsert Movies| MONGO
```

---

## 🤖 AI Agent Architecture

CineVerse features an **AI Movie Booking Agent**, powered by **LangGraph** and **LangChain**. Rather than responding with static chat text, the agent maintains an explicit session state, executes deterministic backend tools to query MongoDB, and leads the user through a multi-step booking funnel.

```mermaid
flowchart TD
    classDef inputStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    classDef nodeStyle fill:#311042,stroke:#c084fc,stroke-width:2px,color:#fff
    classDef toolStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    classDef outStyle fill:#451a03,stroke:#fbbf24,stroke-width:2px,color:#fff

    IN["💬 User Input Query"]:::inputStyle --> NODE1["🧠 Node 1: Intent Classification & Entity Extraction"]:::nodeStyle

    NODE1 --> EVAL{"Entities Extracted?"}:::nodeStyle
    
    EVAL -->|Movie / Theatre / Date / Time| STATE["📝 Update Booking Session State<br/>(state.js)"]:::nodeStyle
    EVAL -->|General / Preference Query| RAG_NODE["🌲 Node 2: Pinecone Vector RAG Search"]:::nodeStyle

    STATE --> EVAL_MISSING["🔍 Node 3: Missing Parameter Evaluator"]:::nodeStyle
    RAG_NODE --> EVAL_MISSING

    EVAL_MISSING -->|Needs Theatre| TOOL1["🛠️ Tool: getMovieTheatresTool"]:::toolStyle
    EVAL_MISSING -->|Needs Date| TOOL2["🛠️ Tool: searchAvailableDatesTool"]:::toolStyle
    EVAL_MISSING -->|Needs Showtime| TOOL3["🛠️ Tool: searchShowTimesTool"]:::toolStyle
    EVAL_MISSING -->|Needs Recommendation| TOOL4["🛠️ Tool: retrievePreferences RAG"]:::toolStyle

    TOOL1 --> FORMAT["🎨 Node 4: UI Card Response Formatter"]:::nodeStyle
    TOOL2 --> FORMAT
    TOOL3 --> FORMAT
    TOOL4 --> FORMAT

    FORMAT --> RESPOND["💬 Node 5: Conversational Responder Node"]:::nodeStyle
    RESPOND --> OUT["✨ Structured JSON Payload + Natural Language Response"]:::outStyle
```

### Agent Capability Breakdown

1. **Intent Detection**: Classifies whether the user wants to book a ticket, get recommendations, check showtimes, or cancel an existing booking.
2. **Entity Extraction**: Uses structured LLM parsing to extract parameters such as `movieTitle`, `theatreName`, `showDate`, `showTime`, and `seatCount`.
3. **Multi-step Workflow Execution**: Validates missing parameters step-by-step (`SELECT_MOVIE` → `SELECT_THEATRE` → `SELECT_DATE` → `SELECT_SHOWTIME` → `SEAT_RESERVATION`).
4. **Backend Tool Calling (`backendTools.js`)**: Executes database queries to fetch exact scheduled shows rather than allowing the LLM to hallucinate movies or timings.
5. **Session Memory (`state.js`)**: Maintains persistent short-term conversation state across turns.
6. **RAG Vector Memory (`pinecone.js`)**: Vectorized semantic search for long-term user preferences (genres, favorite actors, preferred languages).

---

## 🔐 Authentication Flow

CineVerse uses a secure **JWT-in-HTTP-Only-Cookie** mechanism combined with strict **Role-Based Access Control (RBAC)** middleware.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User / Owner / Admin
    participant App as 💻 React 19 Frontend
    participant API as 🛡️ Express API (Auth + RBAC)
    participant DB as 🗄️ MongoDB Database

    Note over User,DB: 1️⃣ Authentication & JWT Cookie Setup
    User->>App: 1. Enter Credentials (Email & Password)
    App->>API: 2. POST /api/auth/login
    API->>DB: 3. Verify User Credentials (bcrypt)
    DB-->>API: User Verified
    API-->>App: 4. Set HTTP-Only Cookie (JWT Token) + Return User Object

    Note over User,DB: 2️⃣ Role-Based Access Control (RBAC)
    User->>App: 5. Access Protected Route (User / Owner / Admin)
    App->>API: 6. Request API Resource (Cookie Header Attached)
    API->>API: 7. Validate Cookie Token & Check Role Permissions
    
    alt ❌ Unauthorized / Expired
        API-->>App: 401 Unauthorized / 403 Forbidden
        App-->>User: Show Toast Error / Redirect to Login
    else ✅ Access Granted
        API->>DB: 8. Fetch Protected Records
        DB-->>API: Return Records Payload
        API-->>App: 9. 200 OK Response
        App-->>User: Render Dashboard Components
    end
```

---

## 🎟️ Seat Booking Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Movie Goer
    participant App as 💻 React 19 Frontend
    participant API as ⚙️ Express Backend
    participant Redis as ⚡ Redis Lock Engine
    participant Rzp as 💳 Razorpay Gateway
    participant DB as 🗄️ MongoDB & Ticket Service

    Note over User,DB: Phase 1: 5-Minute Temporary Seat Lock
    User->>App: 1. Select Seats & Click "Book Now"
    App->>API: 2. POST /api/bookings/lock-seats
    API->>Redis: 3. SET seat:showId:A1 (5-Min Atomic TTL Lock)
    
    alt ❌ Seat Locked by Another User
        Redis-->>API: Lock Failed (NX Null)
        API-->>App: 400 Bad Request ("Seat Unavailable")
    else ✅ Lock Acquired
        Redis-->>API: Lock Granted (OK)
        API-->>App: 200 OK (5-Min Timer Started & Live WebSocket Sync)
    end

    Note over User,DB: Phase 2: Payment & Instant Confirmation
    User->>App: 4. Complete Razorpay Payment
    App->>Rzp: Submit Payment Credentials
    Rzp-->>App: Return Payment Signature & ID
    App->>API: 5. POST /api/payments/verify { paymentDetails }
    
    API->>API: 6. Verify HMAC-SHA256 Signature
    API->>DB: 7. Save Booking (CONFIRMED) & Generate PDF Ticket
    API->>Redis: 8. Release Redis Temporary Lock (DEL)
    API-->>App: 9. 200 OK (Download PDF Ticket + QR Code)
```

---

## ⚡ Redis Seat Locking Mechanism

Double-booking is one of the toughest challenges in high-concurrency ticketing systems. CineVerse resolves this with a custom **Redis Distributed Lock Engine** (`seatLockService.js`).

### Technical Specification

- **Redis Lock Key Format**: `seat:{showId}:{seatNumber}` (e.g., `seat:66a1f8e2:A5`)
- **Atomic Acquisition**: Uses Redis `SET` command with `NX` (Only set if not exists) and `EX` (Expire time in seconds).
  ```javascript
  const result = await redisClient.set(key, JSON.stringify(seatLockData), {
    NX: true,
    EX: 300, // 5-minute TTL lock
  });
  ```
- **Ownership Verification**: Before releasing or checking a lock, the service parses the stored JSON object (`userId`, `lockedAt`). If the active user matches `userId`, re-entry is granted.
- **Non-blocking Key Iteration**: Instead of using blocking `KEYS *` commands (which stall Redis single-threaded loops in production), CineVerse uses non-blocking **cursor-based scanning** (`SCAN`):
  ```javascript
  const reply = await redisClient.scan(cursor, {
    MATCH: `seat:${showId}:*`,
    COUNT: 100
  });
  ```

---

## 🧠 Retrieval-Augmented Generation (RAG) Architecture

CineVerse utilizes a hybrid memory pipeline for personalized AI recommendations.

```mermaid
flowchart TD
    classDef inputStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    classDef processStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    classDef dbStyle fill:#451a03,stroke:#fbbf24,stroke-width:2px,color:#fff
    classDef outStyle fill:#311042,stroke:#c084fc,stroke-width:2px,color:#fff

    subgraph PREFERENCE_INGESTION ["📥 PREFERENCE INGESTION PIPELINE"]
        USER_PREF["💬 User Preference Input<br/>'I love sci-fi thrillers starring Nolan'"]:::inputStyle --> GEMINI_EMBED["🧠 Gemini embedding-001 Model"]:::processStyle
        GEMINI_EMBED --> DENSE_VEC["📐 768-Dimensional Dense Vector"]:::processStyle
    end

    subgraph STORAGE_TIER ["💾 DUAL PERSISTENCE STRATEGY"]
        DENSE_VEC -->|Primary Vector Upsert<br/>ID: userId-genre| PINECONE[("🌲 Pinecone Vector Database<br/>Indexed Metadata: userId, genre, language")]:::dbStyle
        USER_PREF -->|Fallback Mongo Cache| MONGO_PREF[("🗄️ MongoDB UserPreference<br/>Document Array Backup")]:::dbStyle
    end

    subgraph RAG_RETRIEVAL ["🔍 CONTEXT RETRIEVAL & PROMPT AUGMENTATION"]
        QUERY["💬 New Query: 'Suggest a good movie for tonight'"]:::inputStyle --> QUERY_VEC["🧠 Generate Query Vector"]:::processStyle
        QUERY_VEC --> CHECK_PINECONE{"Is Pinecone Available?"}:::processStyle
        
        CHECK_PINECONE -->|Yes| VECTOR_SEARCH["🌲 Vector Cosine Search<br/>topK: 3, filter: { userId }"]:::dbStyle
        CHECK_PINECONE -->|No / Exception| MONGO_SEARCH["🗄️ MongoDB Array Fetch"]:::dbStyle

        VECTOR_SEARCH --> RANK["📊 Sort Matches by createdAt Descending"]:::processStyle
        MONGO_SEARCH --> RANK

        RANK --> AUGMENT["📝 Augment System Prompt with Historical Context"]:::outStyle
        AUGMENT --> GEMINI_RESPONSE["🤖 Gemini LLM Generates Hyper-Personalized Movie Suggestion"]:::outStyle
    end
```

- **Pinecone Vector Upsert**: Preferences are stored with unique deterministic keys (`${userId}-${category}`) so updated preferences overwrite outdated vectors automatically.
- **Top-K Vector Query**: When a user requests recommendations, the current query is embedded and matched against Pinecone vectors with a strict `filter: { userId }` clause.


---

## 📂 Folder Structure

```
cineVerse/
├── .github/
│   └── workflows/
│       └── docker.yml               # GitHub Actions CI Workflow
├── backend/
│   ├── agent/                       # LangGraph AI Booking Agent Engine
│   │   ├── rag/
│   │   │   └── pinecone.js          # RAG Vector Store & Retrieval Service
│   │   ├── tools/
│   │   │   └── backendTools.js      # LangChain Tools for Database Queries
│   │   ├── bookingAgent.js          # Agent Parameter Evaluator
│   │   ├── graph.js                 # LangGraph Node Definition & State DAG
│   │   ├── prompts.js               # System Prompts & Intent Parsing Rules
│   │   └── state.js                 # Booking Session State Definition
│   ├── config/                      # Infrastructure Configs
│   │   ├── db.js                    # Mongoose Connection Setup
│   │   ├── razorpay.js              # Razorpay SDK Instance
│   │   ├── redis.js                 # Redis Client Setup
│   │   ├── socket.js                # Socket.IO Server Configuration
│   │   └── tmdb.js                  # TMDB Axios Base Instance
│   ├── controllers/                 # REST API Request Handlers
│   │   ├── aiController.js          # AI Agent Chat & Session Endpoints
│   │   ├── authController.js        # Authentication & Cookie Handlers
│   │   ├── bookingController.js     # Seat Reservation & History Handlers
│   │   ├── movieController.js       # TMDB & Database Movie Queries
│   │   ├── paymentController.js     # Razorpay Order & Webhook Handlers
│   │   ├── screenController.js      # Theatre Screen Layout Management
│   │   ├── showController.js        # Show Schedule Management
│   │   └── theatreController.js     # Theatre Owner Operations
│   ├── jobs/                        # Automated Cron Tasks
│   │   ├── bookingExpiry.job.js     # Stale Booking Cleanup Job
│   │   └── movieSync.job.js         # Daily TMDB API Sync Job
│   ├── middleware/                  # Request Processing Middleware
│   │   ├── authMiddleware.js        # JWT Cookie Validation & RBAC Guard
│   │   └── rateLimitMiddleware.js   # Express Rate Limiter Configuration
│   ├── models/                      # Mongoose Database Schemas
│   │   ├── User.js, Movie.js, Theatre.js, Screen.js, Show.js, bookings.js
│   │   ├── Payment.js, Proposal.js, Offer.js, PricingConfig.js, UserPreference.js
│   ├── routes/                      # Express Route Definitions
│   ├── services/                    # Business Logic Layer
│   │   ├── seatLockService.js       # Redis Atomic Locking Engine
│   │   ├── emailService.js          # Nodemailer Transport Service
│   │   ├── pdfService.js            # PDFKit Ticket Generator
│   │   └── qrService.js             # QR Code Vector Data Service
│   ├── app.js                       # Express App Initialization
│   ├── server.js                    # HTTP Server & Socket.IO Listener
│   └── Dockerfile                   # Backend Docker Build Container
├── frontend/
│   ├── public/                      # Static Assets & Icons
│   ├── src/
│   │   ├── assets/                  # CSS Styles & Images
│   │   ├── components/              # Modular UI Components
│   │   │   ├── ai/                  # AI Buddy Floating Chatbot Components
│   │   │   ├── dashboard/           # Owner & Admin Chart Dashboards
│   │   │   ├── layout/              # Navbar, Footer, Sidebar Controls
│   │   │   └── seat/                # Interactive Screen Seat Grids
│   │   ├── pages/                   # Page Components
│   │   ├── redux/                   # Redux Toolkit Slices & Store
│   │   ├── services/                # Axios API Services
│   │   └── App.jsx                  # React Router Master Routing Table
│   ├── dockerfile                   # Frontend Nginx/Vite Container
│   └── vite.config.js               # Vite Configuration Setup
├── docker-compose.yml               # Local Development Docker Compose Profile
├── docker-compose.ci.yml            # CI Profile for Automated Docker Hub Builds
└── package.json                     # Root Project Manifest
```

---

## 🗄️ Database Collections

| Collection | Key Fields | Purpose |
| :--- | :--- | :--- |
| **`User`** | `name`, `email`, `password`, `role` (`user` \| `owner` \| `admin`), `isApproved` | User account authentication & authorization |
| **`Theatre`** | `name`, `location`, `ownerId`, `screens`, `status`, `isApproved` | Registered theatre properties |
| **`Screen`** | `name`, `theatreId`, `seatLayout` (rows, cols, types), `totalSeats` | Screen geometry and layout configuration |
| **`Movie`** | `tmdbId`, `title`, `overview`, `posterPath`, `backdropPath`, `genre`, `releaseDate` | Synced movie catalogue |
| **`Show`** | `movieId`, `theatreId`, `screenId`, `startTime`, `date`, `price`, `occupiedSeats` | Scheduled movie screenings |
| **`Booking`** | `userId`, `showId`, `seats`, `totalAmount`, `paymentStatus`, `qrCode`, `pdfUrl` | Confirmed & pending user ticket bookings |
| **`Proposal`** | `ownerId`, `theatreId`, `movieId`, `screenId`, `showTimes`, `status` | Owner show schedule proposals awaiting admin review |
| **`Payment`** | `bookingId`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `amount` | Payment audit log records |
| **`Offer`** | `code`, `discountPercentage`, `maxDiscount`, `minAmount`, `validTill`, `active` | Promotional discount vouchers |
| **`PricingConfig`** | `basePrice`, `peakMultiplier`, `weekendMultiplier`, `taxRate` | Global dynamic pricing configuration |
| **`UserPreference`** | `userId`, `preferences`, `favoriteGenres`, `favoriteLanguages` | Local fallback storage for AI user preference RAG |

---

## 🚀 Installation Guide

### Prerequisites

- **Node.js**: `v20.x` or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Redis**: Local server running on `redis://localhost:6379` or Upstash Redis URL
- **Git**: Installed on your operating system

### Step-by-Step Local Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ishaansharma23/cineVerse.git
   cd cineVerse
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run Services**:
   - Start Backend (Terminal 1):
     ```bash
     cd backend
     npm run dev
     ```
   - Start Frontend (Terminal 2):
     ```bash
     cd frontend
     npm run dev
     ```

5. **Access Application**:
   Open browser at `http://localhost:5173`.

---

## 🔑 Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories using the configuration formats below:

### Backend Environment Variables (`backend/.env`)

```env
PORT=5000
MONGO_URL=mongodb://localhost:27017/cineverse
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# TMDB API
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_API_KEY=your_tmdb_api_key
TMDB_ACCESS_TOKEN=your_tmdb_bearer_token
TMDB_LANGUAGE=en-US
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# Redis
REDIS_URL=redis://localhost:6379

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# AI Agent & Vector RAG
GEMINI_API_KEY=your_google_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=cineverse-preferences

# Mail Service
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CRON_TIMEZONE=Asia/Kolkata
```

### Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

---

## 🐳 Docker Setup

CineVerse provides multi-stage Dockerfiles for both services.

### Build Backend Docker Image

```bash
docker build -t ishaansharma23/cineverse-backend:latest ./backend
```

### Build Frontend Docker Image

```bash
docker build -t ishaansharma23/cineverse-frontend:latest ./frontend
```

---

## 🚢 Docker Compose Development

Run the entire platform (Backend + Frontend) with hot-reloading bind mounts via Docker Compose:

```bash
# Start all containers in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## 🔄 GitHub Actions CI/CD & AWS Deployment

CineVerse runs an automated, production-grade **GitHub Actions CI/CD Pipeline** (`.github/workflows/docker.yml` & `.github/workflows/cd.yml`) that builds, pushes, and auto-deploys updated services to **AWS EC2** on every push to `main`.

### 1️⃣ Continuous Integration (CI) Pipeline
- **Trigger**: `git push` to `main` branch.
- **Workflow File**: `.github/workflows/docker.yml`
- **Automated Steps**:
  1. Checks out repository code (`actions/checkout@v4`).
  2. Configures Docker Buildx builder (`docker/setup-buildx-action@v3`).
  3. Authenticates with Docker Hub (`docker/login-action@v3`).
  4. Builds multi-container production images (`docker compose -f docker-compose.ci.yml build`).
  5. Pushes tagged images to Docker Hub (`ishaansharma23/cineverse-backend:latest` & `ishaansharma23/cineverse-frontend:latest`).

### 2️⃣ Continuous Deployment (CD) Pipeline
- **Trigger**: Automatically invoked on successful completion of **CineVerse CI**.
- **Workflow File**: `.github/workflows/cd.yml`
- **Automated Steps**:
  1. Establishes a secure SSH session with the **AWS EC2 Server** (`appleboy/ssh-action@v1.2.0`).
  2. Pulls latest repository changes on EC2 (`git pull origin main`).
  3. Pulls fresh Docker Hub container images (`docker compose -f docker-compose.prod.yml pull`).
  4. Restarts production containers (`docker compose -f docker-compose.prod.yml up -d --remove-orphans`).
  5. Cleans up dangling image layers (`docker image prune -f`) to maintain disk health.

```mermaid
flowchart TD
    classDef devStyle fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    classDef runnerStyle fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    classDef dockerStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    classDef awsStyle fill:#431407,stroke:#f97316,stroke-width:2px,color:#fff

    DEV["👨‍💻 Developer"]:::devStyle -->|Git Push to main| GH["📦 GitHub Repository"]:::devStyle

    subgraph CI ["🚀 PHASE 1: CONTINUOUS INTEGRATION (CI)"]
        GH -->|Triggers docker.yml| CI_RUNNER["⚙️ GitHub Actions CI Runner"]:::runnerStyle
        CI_RUNNER --> BUILD["1️⃣ Build Docker Images<br/>docker-compose.ci.yml"]:::dockerStyle
        BUILD --> PUSH["2️⃣ Push Images to Docker Hub<br/>ishaansharma23/cineverse-*"]:::dockerStyle
    end

    subgraph CD ["☁️ PHASE 2: CONTINUOUS DEPLOYMENT (CD)"]
        PUSH -->|CI Success Event| CD_RUNNER["⚙️ GitHub Actions CD Runner"]:::runnerStyle
        CD_RUNNER --> SSH["3️⃣ SSH Connection to AWS EC2<br/>appleboy/ssh-action@v1.2.0"]:::awsStyle
        SSH --> PULL["4️⃣ Pull Latest Code & Docker Images<br/>docker-compose.prod.yml pull"]:::awsStyle
        PULL --> DEPLOY["5️⃣ Zero-Downtime Container Restart<br/>docker compose up -d"]:::awsStyle
    end

    DEPLOY --> LIVE["🌐 AWS EC2 Live Production Instance"]:::awsStyle
```

### GitHub Secrets Required

Configure the following repository secrets under **Settings > Secrets and variables > Actions**:

| Secret Key | Description |
| :--- | :--- |
| `DOCKER_USERNAME` | Docker Hub username (`ishaansharma23`) |
| `DOCKER_TOKEN` | Docker Hub Personal Access Token |
| `EC2_HOST` | Public IP or DNS domain of the AWS EC2 instance |
| `EC2_USER` | SSH username for the AWS instance (e.g. `ubuntu`) |
| `EC2_SSH_KEY` | Private SSH RSA key paired with the EC2 server |

---

## 🌐 API Modules

| Module | Base Path | Key Endpoints | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth` | `POST /register`, `POST /login`, `POST /logout`, `GET /me` | User registration & cookie JWT management |
| **Movies** | `/api/movies` | `GET /`, `GET /:id`, `POST /sync` | Movie catalogue & TMDB API synchronization |
| **Theatres** | `/api/theatres` | `GET /`, `POST /`, `PATCH /:id/status` | Theatre owner listing & admin approval |
| **Screens** | `/api/screens` | `GET /theatre/:id`, `POST /` | Custom screen layout grid configuration |
| **Shows** | `/api/shows` | `GET /movie/:id`, `POST /propose`, `GET /proposals` | Show scheduling & owner proposals |
| **Bookings** | `/api/bookings` | `POST /lock-seats`, `POST /confirm`, `GET /user` | Seat reservation & ticket retrieval |
| **Payments** | `/api/payments` | `POST /create-order`, `POST /verify` | Razorpay checkout & webhook processing |
| **AI Agent** | `/api/ai` | `POST /chat`, `DELETE /session` | LangGraph agent conversation workflow |
| **Offers** | `/api/offers` | `GET /`, `POST /apply` | Promotional discount code management |
| **Pricing** | `/api/pricing` | `GET /config`, `PUT /config` | Admin dynamic price multiplier setup |

---

## 🛡️ Security Architecture

1. **HTTP-Only JWT Cookies**: Prevents Cross-Site Scripting (XSS) token theft by storing auth tokens in browser HTTP-Only, SameSite cookies.
2. **Role-Based Access Control (RBAC)**: Express route guards verify token signatures and user roles (`user`, `owner`, `admin`) before granting access to sensitive controllers.
3. **Bcrypt Password Hashing**: Passwords stored using salted bcrypt hashing algorithms.
4. **DDoS & Brute-Force Mitigation**: Express Rate Limiting (`express-rate-limit`) limits request spikes on sensitive login and AI endpoints.
5. **HMAC-SHA256 Payment Verification**: Verifies Razorpay payment signatures server-side before releasing booked tickets.

---

## 🚀 Performance Optimizations

- **Non-blocking Redis SCAN**: Replaces CPU-heavy `KEYS` queries with cursor-based scanning to prevent Redis event-loop blockage during peak booking hours.
- **MongoDB Indexing**: Indexes added to frequently queried fields (`movieId`, `showId`, `userId`, `date`).
- **Targeted Socket.IO Rooms**: WebSockets broadcast seat lock state changes exclusively to users viewing the exact same `showId` room (`show_${showId}`).
- **Vite Asset Bundling**: Dynamic imports and code-splitting minimize initial JS bundle size for instant SPA load times.

---

## 🔮 Future Enhancements

- **☁️ AWS Multi-Region Infrastructure**: Expansion to AWS ECS Fargate and ElastiCache Redis clusters.
- **🔒 Nginx Reverse Proxy & SSL**: Nginx ingress controller with automated SSL certificate renewal via Let's Encrypt / Certbot.
- **📊 Observability & Monitoring**: Prometheus metric collection visualized through Grafana dashboards, with centralized logging via Grafana Loki.
- **⛵ Kubernetes Container Orchestration**: Scaling container deployment with AWS EKS and horizontal pod autoscaling.
- **💬 Multi-Channel Ticket Notifications**: Integration with WhatsApp API (Twilio) for instant ticket delivery.

---

## 📹 Demo

> 📺 **Watch Full Project Walkthrough**: [Link to Video Demo / YouTube](https://github.com/ishaansharma23/cineVerse)

---

## 👥 Contributors

<div align="center">

| Avatar | Contributor | Role | GitHub |
| :---: | :---: | :---: | :---: |
| <img src="https://github.com/ishaansharma23.png" width="80px;" style="border-radius:50%"/> | **Ishaan Sharma** | Creator & Lead Engineer | [@ishaansharma23](https://github.com/ishaansharma23) |

</div>

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

- **Developer**: Ishaan Sharma
- **GitHub**: [github.com/ishaansharma23](https://github.com/ishaansharma23)
- **Project Repository**: [CineVerse Repository](https://github.com/ishaansharma23/cineVerse)

<div align="center">
  <sub>Built with ❤️ by Ishaan Sharma</sub>
</div>
