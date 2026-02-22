# clipCart 🛒

A modern, feature-rich e-commerce mobile application built with React Native and Expo. clipCart combines shopping, live streaming, and social features to create an engaging shopping experience.

## 🌍 Market Context

**clipCart** is designed specifically for the African market, starting with **Cameroon**. The platform solves a critical pain point: sellers currently share product videos via WhatsApp to their contact lists, who then share to their stories - a fragmented and inefficient process.

### Problem Statement
- Sellers create product videos but struggle with distribution
- WhatsApp sharing is manual, time-consuming, and doesn't scale
- No centralized platform for video commerce in Cameroon
- Buyers miss products because they're buried in WhatsApp stories

### Solution
- **Centralized video commerce platform** - All product videos in one place
- **Live streaming events** - Sellers can host live product showcases
- **Social discovery** - Follow sellers, discover trending products
- **Message-to-buy model** - Buyers connect directly with sellers via in-app chat
- **No logistics burden** - Sellers handle their own delivery (marketplace model)

### Business Model: Social Commerce Marketplace

clipCart operates as a **social commerce marketplace** — a hybrid of TikTok-style product discovery and Facebook Marketplace's "message the seller" model.

**How it works:**
1. Sellers upload product videos/images and create listings
2. Buyers discover products through the feed (Discover, For You, Following)
3. When a buyer is interested, they message the seller directly via in-app chat
4. Buyer and seller negotiate, arrange payment (mobile money, cash on delivery), and delivery privately
5. After delivery, buyer confirms receipt and leaves a review

**Why no in-app payments (for now):**
- Lower barrier to entry for both sellers and buyers
- Avoids payment integration complexity at launch
- Works naturally with how people already transact in Cameroon (mobile money transfers, cash on delivery)
- Payments can be added later once the platform has traction

**Revenue model (future):**
- Featured/promoted listings
- Seller subscription tiers
- Optional in-app payments with commission (Phase 3)

### Target Market: Cameroon 🇨🇲
- **Primary Payment Methods**: Orange Money, Mobile Money
- **Languages**: English, French (bilingual support)
- **Currency**: Central African CFA Franc (XAF)
- **Launch City**: Douala (expanding nationwide after traction)
- **Launch Target**: Mid 2026

### Target Users

clipCart serves two distinct user types:

**Buyers (Primary User)**
- Young adults (18-35) in Douala, Cameroon
- Active smartphone users comfortable with social media (WhatsApp, TikTok, Facebook)
- Currently discover products through WhatsApp stories and word of mouth
- Prefer mobile money (Orange Money) or cash on delivery for transactions
- Value video content -- want to see products in action before purchasing
- Bilingual (English / French)

**Sellers (Supply Side)**
- Small to medium business owners and independent vendors in Douala
- Fashion, beauty, accessories, shoes, and home goods sellers
- Already create product videos but distribute them manually via WhatsApp
- Typically manage 10-100 product listings
- Need a centralized storefront to reach more customers beyond their contact list
- May have limited technical skills -- the platform must be simple to use

### Goals & Success Criteria

**MVP Launch Goals (Mid 2026 -- Douala)**

| Metric | Target | How We Measure |
|---|---|---|
| Active sellers | 50-100 | Sellers with at least 1 product listed |
| Active buyers | 1,000+ | Users who opened the app in the last 30 days |
| Product listings | 500+ | Total products with images/video |
| Conversations started | 100+ per week | Buyer-to-seller chats initiated |
| Deals completed | 20+ per week | Transactions confirmed by both parties |
| App rating | 4.0+ stars | Google Play Store rating |

**Definition of "Done" for MVP**
- A buyer can discover products, message a seller, negotiate, and confirm delivery
- A seller can create a listing with video, receive inquiries, and negotaite before a complete deal
- Real-time chat works reliably with the seller.
- The app runs smoothly on mid-range Android devices common in Cameroon
- Bilingual support (English / French) is functional

**Long-Term Success Indicators (12 months post-launch)**
- 500+ active sellers across Cameroon
- 10,000+ monthly active buyers
- Sellers report increased sales compared to WhatsApp-only distribution
- Organic growth through word of mouth and WhatsApp sharing feature
- Revenue from featured listings and seller subscriptions

### Scope

**In Scope (MVP Launch)**
- Mobile app (Android + iOS) via React Native / Expo
- Video and image-based product listings
- Product-linked buyer-seller chat 
- Social features: follow sellers, discover feed, personalized feed
- Seller profiles with completed deals and location.
- Search and category browsing
- Wishlist / saved items
- Push notifications
- Douala, Cameroon as the initial market

**Out of Scope (NOT included at launch)**
- No in-app payments -- buyers and sellers arrange payment privately (Orange Money, cash on delivery)
- No delivery or logistics system -- sellers handle their own delivery
- No web version -- mobile only at launch (web planned for future based on market demand)
- No admin dashboard -- moderation handled manually at launch
- No live streaming -- deferred to Phase 2
- No seller-buyer chat deal tracking phase 2
- No AI features -- deferred to Phase 3
- No multi-country support -- Cameroon only at launch
- No escrow or dispute resolution system -- trust is built via reviews and verified sellers

## ✨ Features

### 🏠 Home Feed
- **Discover Tab**: Explore trending products and content
- **For You Tab**: Personalized product recommendations
- **Following Tab**: See products from sellers you follow

### 🛍️ Shopping Experience
- **Product Categories**: Browse by category (Shoes, Women, Men, Kids, Accessories, Beauty, Home)
- **Search Functionality**: Quick search with real-time results
- **Saved Items / Wishlist**: Bookmark products you're interested in
- **Product Details**: View detailed product information with images and variants
- **Message Seller**: Primary call-to-action — chat directly with the seller about a product

### 📺 Live Features
- **Live Streaming**: Watch live product showcases and demonstrations
- **Interactive Shopping**: Shop directly from live streams

### 💬 Social & Communication
- **Product-Linked Chats**: Every conversation is tied to a specific product for trackability
- **Deal Status Tracking**: Lightweight transaction flow (Inquired → Negotiating → Agreed → Delivered → Completed)
- **Messages**: Chat with sellers and other users track deal status (future phase)
- **Notifications**: Stay updated with new products and promotions
- **User Profiles**: Manage your profile and preferences

### 🎯 Seller Features
- **Sell Tab**: List and manage your products
- **Product Management**: Create and edit product listings
- **Video Upload**: Upload product videos (replacing WhatsApp sharing)
- **Live Event Scheduling**: Schedule and host live product showcases
- **Analytics Dashboard**: Track views, engagement, and sales
- **Order Management**: Manage orders and customer communications
- **Earnings Dashboard**: Track revenue and payouts

### 🤝 Trust & Safety
- **Seller Ratings & Reviews**: Buyers rate sellers after confirmed delivery
- **Verified Sellers**: Sellers can verify their identity (phone/ID) for a trust badge after a number of sales on the platform 
- **Deal Confirmation Flow**: Both parties confirm when a transaction is completed*
- **Report / Block**: Users can flag bad actors for review
- **Response Time Badges**: "Usually responds within 1 hour" on seller profiles(future phase)
- **Seller Activity Indicators**: "Last active 2 hours ago" / "Joined 38 months ago"

### 💰 Transactions (Current Model)
- **No in-app payments at launch** — buyers and sellers arrange payment directly (mobile money, cash on delivery)
- **Chat-based transaction tracking** — every inquiry is logged with deal status (future phase)
- **Transaction history via chat** — conversations serve as the purchase record (future phase)
- **Future**: Optional in-app Orange Money / Mobile Money payments with commission (future phase)

### AI-Powered Features (fuure phase)
- **Smart Recommendations**: Personalized "For You" feed powered by ML
- **Semantic Search**: Natural language search with intent understanding
- **Visual Search**: Find products by uploading images
- **AI Chatbot**: 24/7 customer support assistant
- **Auto Product Descriptions**: Generate listings from product images
- **Review Insights**: AI-powered sentiment analysis and summarization
- **Live Stream AI**: Real-time product detection during streams
- **Smart Pricing**: Price drop alerts and market intelligence
- **Fraud Detection**: Account health monitoring and security

## Tech Stack

### Core Technologies
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.30) - Development platform and tooling
- **TypeScript** (5.9.2) - Type-safe JavaScript
- **Expo Router** (~6.0.21) - File-based routing system

### UI & Styling
- **NativeWind** (4.2.1) - Tailwind CSS for React Native
- **React Native Safe Area Context** - Handle device safe areas
- **Expo Vector Icons** - Icon library (Ionicons, MaterialCommunityIcons, AntDesign)

### State Management & Data
- **Zustand** (5.0.9) - Lightweight state management
- **AsyncStorage** - Local data persistence
- **React Hook Form** (7.69.0) - Form handling
- **Zod** (4.2.1) - Schema validation

### Additional Libraries
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch gesture handling
- **Expo Haptics** - Haptic feedback
- **Expo Image** - Optimized image component

## Full System Architecture

clipCart is built as three independent services that communicate over HTTP and WebSocket:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIPCART SYSTEM                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────┐                                 │
│  │      Mobile App (Frontend)      │                                 │
│  │  React Native / Expo            │                                 │
│  │  TypeScript                     │                                 │
│  │  Android + iOS                  │                                 │
│  └──────────┬──────────────────────┘                                 │
│             │                                                        │
│             │  REST API + WebSocket (Socket.IO)                      │
│             │                                                        │
│  ┌──────────▼──────────────────────┐                                 │
│  │      Main Backend               │                                 │
│  │  TypeScript / Node.js           │                                 │
│  │  Express.js + Socket.IO         │                                 │
│  │                                 │                                 │
│  │  Handles:                       │     ┌─────────────────────────┐ │
│  │  - Authentication (JWT + OTP)   │     │     AI Backend          │ │
│  │  - User & seller profiles       │     │  Python / FastAPI       │ │
│  │  - Product CRUD & search        │     │                         │ │
│  │                                 |     |  - Handles              | |
│  │  - Wishlist & notifications     │     │  - Recommendations      │ │
│  │  - File uploads (images/video)  │     │  - Semantic search      │ │
│  │  - Live event management        │     │  - Visual search        │ │
│  │  - Reviews & ratings            │     │  - AI chatbot           │ │
│  └──────────┬──────────────────────┘     │  - Fraud detection      │ │
│             │                            │  - Sentiment analysis   │ │
│             │                            └──────────┬──────────────┘ │
│             │                                       │                │
│  ┌──────────▼───────────────────────────────────────▼──────────────┐ │
│  │                     Data Layer                                  │ │
│  │                                                                 │ │
│  │  ┌─────────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐ │ │
│  │  │ PostgreSQL   │  │  Redis   │  │ MinIO / S3  │  │  Qdrant  │ │ │
│  │  │ (Database)   │  │ (Cache,  │  │ (Images,    │  │ (Vector  │ │ │
│  │  │              │  │  Socket, │  │  Videos,    │  │  Search, │ │ │
│  │  │              │  │  Queue)  │  │  Files)     │  │  AI)     │ │ │
│  │  └─────────────┘  └──────────┘  └─────────────┘  └──────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### How the Services Connect

| Component | Language | Framework | Purpose |
|---|---|---|---|
| Mobile App | TypeScript | React Native / Expo | User-facing app (Android + iOS) |
| Main Backend | TypeScript | Express.js + Socket.IO | Core API: auth, products, chat, uploads |
| AI Backend | Python | FastAPI | ML services: recommendations, search, vision |
| PostgreSQL | -- | -- | Primary database for all structured data |
| Redis | -- | -- | Caching, real-time messaging, rate limiting |
| MinIO / S3 | -- | -- | Object storage for product images and videos |
| Qdrant | -- | -- | Vector database for AI embeddings and search |

### Key Design Decisions

- **The Main Backend is the single gateway** -- the mobile app talks only to the Main Backend. AI requests are proxied through it so the frontend never calls the AI Backend directly.
- **Three independent codebases** -- each service has its own folder, dependencies, and deployment. They can be developed, tested, and scaled independently.
- **Shared TypeScript types** -- the frontend and Main Backend share type definitions (Product, User, Order, etc.) to prevent mismatches.
- **Real-time via Socket.IO** -- chat messages, typing indicators, read receipts, online status, and notifications are pushed in real-time over WebSocket, not polling.

## AI Capabilities & Tech Stack

clipCart includes comprehensive AI-powered features built entirely with open-source, self-hosted solutions (no paid API dependencies).

### AI Features Overview

1. **Personalized Product Recommendations** - "For You" tab with intelligent product suggestions
2. **Semantic Search** - Natural language search with intent understanding
3. **Visual Search** - Image-based product discovery
4. **AI Chatbot** - 24/7 customer support assistant
5. **Product Description Generation** - Auto-generate listings from images
6. **Review Sentiment Analysis** - Extract insights from customer reviews
7. **Live Stream AI** - Real-time product detection and tagging
8. **Fraud Detection** - Account health and transaction monitoring
9. **Price Intelligence** - Smart pricing alerts and comparisons
10. **Review Summarization** - AI-powered review insights

### 🛠️ Backend AI Services Stack

The AI services run as a separate Python-based microservices backend that communicates with the React Native frontend via REST APIs.

#### Core AI Framework
- **Python** (3.10+) - Primary backend language
- **FastAPI** - High-performance async API framework
- **Pydantic** - Data validation and settings management
- **Uvicorn** - ASGI server for FastAPI
- **Celery** - Distributed task queue for async AI processing
- **Redis** - Caching and message broker for Celery

#### Machine Learning & Deep Learning
- **PyTorch** (2.0+) - Deep learning framework
- **TensorFlow** (2.15+) - Alternative ML framework
- **Transformers** (Hugging Face) - Pre-trained model library
- **Sentence-Transformers** - Semantic embeddings
- **scikit-learn** - Traditional ML algorithms
- **NumPy** & **Pandas** - Data processing

#### Vector Database & Search
- **Qdrant** or **Milvus** - Vector database for embeddings
- **FAISS** (Facebook AI Similarity Search) - Efficient similarity search
- **Elasticsearch** - Full-text search with vector support (optional)

#### Database & Storage
- **PostgreSQL** - Primary relational database
- **PostgreSQL pgvector extension** - Vector similarity search in PostgreSQL
- **MinIO** or **S3-compatible storage** - Object storage for images/models

### Open-Source AI Models by Feature

#### 1. Product Recommendations
- **TensorFlow Recommenders** - Collaborative filtering framework
- **LightFM** - Hybrid recommendation system
- **Implicit** - Fast collaborative filtering
- **scikit-learn** - Matrix factorization algorithms
- **Embedding Models**: `all-MiniLM-L6-v2` (Sentence Transformers) for product embeddings

#### 2. Semantic Search & NLP
- **Sentence Transformers Models**:
  - `all-mpnet-base-v2` - High-quality embeddings (768-dim)
  - `all-MiniLM-L6-v2` - Fast embeddings (384-dim)
  - `multi-qa-mpnet-base-dot-v1` - Question-answering embeddings
- **spaCy** - NLP library for text processing
- **NLTK** - Natural language toolkit
- **BM25** (via `rank-bm25`) - Keyword-based search fallback

#### 3. Visual Search & Image Recognition
- **CLIP** (OpenAI) - Vision-language model via `transformers`
  - Models: `openai/clip-vit-base-patch32`, `openai/clip-vit-large-patch14`
- **ResNet** / **EfficientNet** - Image classification
- **YOLOv8** (Ultralytics) - Object detection for live streams
- **Image Similarity**: CLIP embeddings for visual product matching

#### 4. AI Chatbot & Language Models
- **Ollama** - Local LLM server (recommended)
  - Models: `llama3.2`, `mistral`, `phi-3`, `gemma2`
- **LangChain** - LLM application framework
- **Rasa** - Open-source conversational AI (alternative)
- **Llama.cpp** - C++ implementation for efficient inference
- **Text Generation WebUI** - User-friendly LLM interface

#### 5. Product Description Generation
- **BLIP-2** (Salesforce) - Image captioning model
- **LLaVA** (Large Language and Vision Assistant) - Vision-language model
- **GPT-2** / **GPT-Neo** - Text generation (via Hugging Face)
- **T5** - Text-to-text generation model

#### 6. Sentiment Analysis & Review Processing
- **VADER Sentiment** - Rule-based sentiment analysis
- **TextBlob** - Simple sentiment analysis
- **RoBERTa** (via Transformers) - Fine-tuned for sentiment
  - Models: `cardiffnlp/twitter-roberta-base-sentiment`
- **DistilBERT** - Lightweight BERT for classification

#### 7. Live Stream AI
- **YOLOv8** - Real-time object detection
- **MediaPipe** (Google) - On-device ML for video processing
- **OpenCV** - Computer vision library
- **FFmpeg** - Video processing

#### 8. Fraud Detection & Anomaly Detection
- **Isolation Forest** (scikit-learn) - Anomaly detection
- **Local Outlier Factor** - Density-based anomaly detection
- **XGBoost** / **LightGBM** - Gradient boosting for classification
- **Autoencoders** (PyTorch) - Unsupervised anomaly detection

#### 9. Text Translation
- **Opus-MT** - Multilingual translation models
- **M2M-100** (Facebook) - Many-to-many translation
- **MarianMT** - Neural machine translation

#### 10. Review Summarization
- **BART** (Facebook) - Text summarization model
- **Pegasus** - Abstractive summarization
- **T5** - Text-to-text summarization

### 🏗️ AI Backend Architecture

```
┌─────────────────┐
│  React Native    │
│     Frontend     │
└────────┬─────────┘
         │ REST API
         │
┌────────▼─────────────────────────────────────┐
│         FastAPI Gateway                      │
│  (Authentication, Rate Limiting, Routing)    │
└────────┬─────────────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    │         │          │          │          │
┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Rec Sys│ │Search│ │Vision │ │Chatbot│ │Fraud  │
│Service│ │Service│ │Service│ │Service│ │Service│
└───┬───┘ └───┬──┘ └───┬───┘ └───┬───┘ └───┬───┘
    │         │        │         │         │
┌───▼─────────▼────────▼─────────▼─────────▼───┐
│         Vector Database (Qdrant/Milvus)      │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│      PostgreSQL + pgvector                  │
│      (Product data + embeddings)             │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│      Redis (Caching + Celery Broker)         │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│      Object Storage (MinIO/S3)              │
│      (Images, model artifacts)               │
└──────────────────────────────────────────────┘
```

### 📦 AI Services Directory Structure

```
ai-backend/
├── app/
│   ├── api/              # FastAPI routes
│   ├── services/         # AI service implementations
│   │   ├── recommendations.py
│   │   ├── search.py
│   │   ├── vision.py
│   │   ├── chatbot.py
│   │   └── fraud_detection.py
│   ├── models/           # ML model loading/caching
│   ├── embeddings/       # Embedding generation
│   └── utils/            # Helper functions
├── models/               # Downloaded model files
├── requirements.txt      # Python dependencies
├── docker-compose.yml    # Service orchestration
└── Dockerfile           # Container configuration
```

### 🚀 AI Backend Setup

#### Prerequisites
- **Python** 3.10 or higher
- **Docker** & **Docker Compose** (recommended)
- **CUDA** (optional, for GPU acceleration)
- **8GB+ RAM** minimum (16GB+ recommended)
- **GPU** (optional but recommended for faster inference)

#### Key Python Dependencies

The AI backend requires these core packages (see `ai-backend/requirements.txt` for full list):

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.5.0
torch>=2.1.0
transformers>=4.35.0
sentence-transformers>=2.2.0
qdrant-client>=1.7.0
psycopg2-binary>=2.9.9
redis>=5.0.0
celery>=5.3.0
pillow>=10.1.0
opencv-python>=4.8.0
scikit-learn>=1.3.0
numpy>=1.24.0
pandas>=2.1.0
langchain>=0.1.0
ollama>=0.1.0
```

#### Installation

1. **Clone and setup AI backend**
   ```bash
   cd ai-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Download required models**
   ```bash
   python scripts/download_models.py
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run AI services**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### Environment Variables (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/clipcart
REDIS_URL=redis://localhost:6379

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_key

# Object Storage
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=your_key
MINIO_SECRET_KEY=your_secret

# Model Paths
MODELS_DIR=./models
EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
VISION_MODEL=openai/clip-vit-base-patch32

# LLM (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# API
API_KEY=your_secret_api_key
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

### 🔧 Model Deployment Options

#### Option 1: Local CPU Inference (Development)
- Run models directly on CPU
- Slower but no GPU required
- Good for development/testing

#### Option 2: Local GPU Inference (Recommended)
- Use NVIDIA GPU with CUDA
- Much faster inference
- Requires NVIDIA GPU with 8GB+ VRAM

#### Option 3: Model Serving (Production)
- **TorchServe** - PyTorch model serving
- **TensorFlow Serving** - TF model serving
- **Triton Inference Server** - Multi-framework serving
- **vLLM** - Fast LLM inference server

### Performance Considerations

- **Embedding Generation**: Cache embeddings for products (update on changes)
- **Model Quantization**: Use INT8/FP16 models for faster inference
- **Batch Processing**: Process multiple requests together
- **Model Caching**: Keep frequently used models in memory
- **Async Processing**: Use Celery for heavy tasks (description generation, etc.)
- **CDN Caching**: Cache recommendation results for popular queries

### Privacy & Security

- **All data processed locally** - No data sent to external APIs
- **On-premise deployment** - Full control over data
- **Model encryption** - Encrypt model files at rest
- **API authentication** - Secure API endpoints
- **Rate limiting** - Prevent abuse

### Key Libraries & Resources

- **Hugging Face Hub**: https://huggingface.co/models
- **Ollama**: https://ollama.ai/
- **Sentence Transformers**: https://www.sbert.net/
- **Qdrant**: https://qdrant.tech/
- **LangChain**: https://python.langchain.com/
- **FastAPI**: https://fastapi.tiangolo.com/

### Learning Resources

- Fine-tuning models on your product data
- Optimizing inference speed
- Scaling vector search
- Model versioning and updates

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Expo CLI** (installed globally or via npx)
- **iOS Simulator** (for macOS) or **Android Studio** (for Android development)
- **Expo Go** app (optional, for testing on physical devices)

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clipCart
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

### Running on Different Platforms

- **iOS Simulator**: `npm run ios` or press `i` in the Expo CLI
- **Android Emulator**: `npm run android` or press `a` in the Expo CLI
- **Web Browser**: `npm run web` or press `w` in the Expo CLI
- **Expo Go App**: Scan the QR code with the Expo Go app on your device

## 📁 Project Structure

```
clipCart/
├── app/                    # Main application directory (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home feed (Discover/For You/Following)
│   │   ├── categories.tsx # Category browsing
│   │   ├── live.tsx       # Live streaming
│   │   ├── sell.tsx       # Seller dashboard
│   │   ├── profile.tsx    # User profile
│   │   ├── productDetails.tsx  # Product detail page
│   │   └── userprofile.tsx     # Seller profile page
│   ├── cart.tsx           # Saved items / cart
│   ├── wishlist.tsx       # Wishlist
│   ├── messages.tsx       # Messages inbox
│   ├── usermessage.tsx    # Individual chat with seller
│   ├── notifications.tsx  # Notifications
│   └── _layout.tsx        # Root layout (wraps CartProvider)
├── components/            # Reusable components
│   ├── tabs/             # Tab-specific components (DiscoverTab, ForYouTab, FollowingTab)
│   ├── shared/           # Shared components (ProductCard, VideoSideIcons)
│   └── live/             # Live stream components
├── context/              # React Context providers
│   └── CartContext.tsx    # Cart/saved items state management
├── data/                 # Shared data constants
│   └── feedProducts.ts   # Product data for feed tabs
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── constants/            # App constants
├── hooks/                # Custom React hooks
├── assets/               # Images, fonts, and other assets
├── docs/                 # Documentation & flowcharts
├── app.json              # Expo configuration
└── ai-backend/           # AI services backend (Python/FastAPI)
    ├── app/              # FastAPI application
    │   ├── api/          # API routes
    │   ├── services/     # AI service implementations
    │   ├── models/       # ML model management
    │   └── utils/        # Helper functions
    ├── models/           # Downloaded AI models
    ├── requirements.txt  # Python dependencies
    └── docker-compose.yml # Service orchestration
```

## 🎨 Design System

### Colors
- **Primary**: `#FF2800` (Red accent)
- **Background**: `#FFFFFF` (White)
- **Text**: `#000000` (Black)
- **Secondary Text**: `rgba(0, 0, 0, 0.62)` (Gray)
- **Border**: `#E5E7EB` (Light gray)
- **Active State**: `#000000` (Black)

### Typography
- **Font Family**: Inter (primary)
- **Font Sizes**: 
  - Search Input: 16px
  - Filter Buttons: 14px
  - Content Text: 16px

### Icon Sizes
- **Search Bar Icons**: 22-24px
- **Header Action Buttons**: 28px
- **Tab Bar Icons**: 24px
- **Back Buttons**: 24px

## Launch Roadmap

### Timeline Overview

| Milestone | Target Date | Status |
|---|---|---|
| Frontend complete (UI/UX + all screens) | End of march 2026|Progress | 
| Main Backend development (API, database, chat) | May 2026 | Not Started |
| AI Backend development (recommendations, search) | May-June 2026 | Not Started |
| Internal testing & bug fixes | Early June 2026 | Not Started |
| Beta launch (10-20 testers in Douala) | Mid June 2026 | Not Started |
| Seller onboarding (recruit 50-100 sellers) | June 2026 | Not Started |
| **MVP Launch (Douala, Cameroon)** | **July 2026** | Not Started |
| Phase 2 features (live streaming, seller tools) | Q4 2026 | Planned |
| Phase 3 features (payments, AI, growth) | Q1-Q2 2027 | Planned |

### Phase 1: MVP Core Features -- Target: July 2026

#### User Authentication & Profiles
- [ ] google email verification (Cameroon format)
- [ ] User profiles (buyers)
- [ ] Seller account creation
- [ ] Profile picture upload
- [ ] Bilingual support (English/French)

#### Video Commerce
- [ ] Video upload for products (replace WhatsApp sharing)
- [ ] Video playback with controls
- [ ] Product video gallery
- [ ] Video compression for data optimization
- [ ] Video thumbnails generation

#### Product Management
- [ ] Create product listings with video
- [ ] Product categories (Shoes, Women, Men, Kids, Accessories, Beauty, Home)
- [ ] Product details page
- [ ] Edit/delete products
- [ ] Product search and filters

#### Social Features
- [ ] Follow/unfollow sellers
- [ ] Feed with followed sellers' products
- [ ] Discover trending products
- [ ] Share to WhatsApp (bridge feature)
- [ ] Seller profiles with product collections

#### Communication & Deal Tracking (Core of the Model)
- [ ] Product-linked chats (product card attached to conversation when messaging seller)
- [ ] In-app messaging (buyer-seller) with text and image support
- [ ] Deal status tracking in chat (Inquired → Negotiating → Agreed → Delivered → Completed)
- [ ] Buyer confirms delivery → prompts review
- [ ] Chat history serves as transaction record

#### Trust & Safety
- [ ] Seller ratings & reviews (tied to confirmed deals)
- [ ] Report / block functionality
- [ ] Seller profiles with follower count and join date
- [ ] Response time indicators on seller profiles

### Phase 2: Enhanced Features (Post-Launch) -- Target: Q4 2026

#### Live Streaming
- [ ] Live stream hosting
- [ ] Live chat during streams
- [ ] Shop from live stream
- [ ] Schedule live events
- [ ] Record live streams

#### Advanced Social & Trust
- [ ] Saved items / wishlist
- [ ] Save videos for later
- [ ] Notifications for new products from followed sellers
- [ ] Verified seller program (phone/ID verification for trust badge)
- [ ] Seller activity indicators ("Last active 2h ago")

#### Seller Tools
- [ ] Analytics dashboard (views, inquiries, completed deals)
- [ ] Inquiry management interface
- [ ] Earnings tracking (self-reported)
- [ ] Inventory management

### Phase 3: Growth Features (Scale) -- Target: Q1-Q2 2027

#### Monetization
- [ ] Optional in-app payments (Orange Money / Mobile Money)
- [ ] Commission on in-app transactions
- [ ] Featured / promoted listings
- [ ] Seller subscription tiers

#### AI Features
- [ ] Personalized recommendations
- [ ] Semantic search
- [ ] Visual search
- [ ] Review sentiment analysis

#### Advanced Features
- [ ] Price alerts
- [ ] Group buying
- [ ] Escrow system for high-value items
- [ ] Dispute resolution system

### 📋 Pre-Launch Checklist

#### Technical
- [ ] Backend API development
- [ ] Database setup (PostgreSQL)
- [ ] Video storage (CDN/cloud storage)
- [ ] Real-time chat infrastructure (WebSocket or Firebase)
- [ ] Push notifications setup
- [ ] Analytics integration
- [ ] Error tracking (Sentry)

#### Business
- [ ] Seller onboarding program (recruit 20-50 initial sellers)
- [ ] Terms of Service & Privacy Policy
- [ ] User support system
- [ ] Marketing materials
- [ ] Community guidelines for trust & safety

#### Testing
- [ ] Beta testing with 10-20 users
- [ ] Chat flow testing (product-linked, deal status)
- [ ] Video upload/playback testing
- [ ] Cross-device testing
- [ ] Performance optimization (data usage)

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint to check code quality

## 🔧 Configuration

### Expo Configuration
The app is configured in `app.json` with:
- **Name**: clipCart
- **Version**: 1.0.0
- **Orientation**: Portrait
- **New Architecture**: Enabled
- **Typed Routes**: Enabled
- **React Compiler**: Enabled

### Environment Setup
Create a `.env` file in the root directory for environment variables (if needed):
```
API_URL=your_api_url
API_KEY=your_api_key
```

## 🧪 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Add accessibility labels for screen readers

### Component Structure
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement proper loading and error states
- Follow the existing file-based routing structure

## 📦 Building for Production

### Android
```bash
eas build --platform android
```

### iOS
```bash
eas build --platform ios
```

*Note: Requires Expo Application Services (EAS) account setup*

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is private and proprietary.

## Team & Roles

clipCart is built by a team of 4, each owning a distinct area of the product.

### Role 1: Technical Lead Developer & UI/UX Designer -- TAMASANG MUNGWE EMMANUEL CALEB

**Responsibilities:**
- UI/UX design (wireframes, prototyping, design system)
- Frontend development (React Native / Expo)
- Backend development (TypeScript / Node.js)
- Product architecture and technical decisions

**Ownership areas:** Frontend codebase, design system, user experience, backend API
**Decision authority:** Final say on technical stack, UI/UX decisions, and feature prioritization

---

### Role 2: Marketing Lead -- BARAK NSOH 

**Responsibilities:**
- Go-to-market strategy for Cameroon launch
- Seller onboarding and recruitment (initial 20-50 sellers)
- Social media presence and brand identity
- User acquisition and growth strategy
- Community management and user feedback
- Investor communications and pitch materials

**Ownership areas:** Brand, user growth, seller partnerships, market research
**Decision authority:** Marketing strategy, branding, partnership deals

---

### Role 3: DevOps Engineer & Backend Developer -- TAMBE JOHNATHAN

**Responsibilities:**
- Cloud infrastructure setup and management
- CI/CD pipeline (build, test, deploy)
- Docker containerization and orchestration
- Database administration (PostgreSQL, Redis)
- Backend API development (shared with Lead Developer)
- Server monitoring, scaling, and security
- App store deployment (EAS Build, Google Play, App Store)

**Ownership areas:** Infrastructure, deployment pipeline, server uptime, backend services
**Decision authority:** Infrastructure choices, deployment strategy, security protocols

---

### Role 4: Data Scientist & AI Engineer -- TAMAJONG BLESS 

**Responsibilities:**
- AI/ML backend development (Python / FastAPI)
- Recommendation engine (personalized "For You" feed)
- Search optimization (semantic search, visual search)
- Fraud detection and anomaly monitoring
- Data analytics and user behavior insights
- Model training, evaluation, and deployment
- KPI dashboards and reporting

**Ownership areas:** AI backend, ML models, data pipeline, analytics
**Decision authority:** AI model selection, data strategy, analytics tooling

### Collaboration Matrix

| Area | Team Members Involved |
|---|---|
| Backend API | Lead Developer + DevOps Engineer |
| Database Design | Lead Developer + DevOps Engineer + Data Scientist |
| Product Decisions | Lead Developer + Marketing Lead |
| Launch Strategy | All four members |
| AI Integration | Lead Developer (frontend) + Data Scientist (backend) |

### Communication & Workflow

- **Version control**: Git with feature branches
- **Code review**: Required before merging to main
- **Documentation**: Maintained in project README and `docs/` folder

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev)
- Icons from [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- Styling with [NativeWind](https://www.nativewind.dev/)

##  Support

For support, email your-email@example.com or open an issue in the repository.

---

**Made with using React Native and Expo**
