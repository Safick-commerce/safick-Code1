# Safick — AI backend (`ai-backend/`)

**Python / FastAPI** (or equivalent) service for **Phase 3** ML features: recommendations, semantic search, optional vision/embeddings. The **mobile app never calls this service directly** — only **`backend/`** does (auth, rate limits, PII boundaries stay in Node).

This folder is **intentionally empty** until Phase 1–2 APIs and product data are stable enough to embed and index.

## When to start

| Prerequisite | Why |
|--------------|-----|
| Stable `Product` (and ideally `User` interest) data in Postgres | Training / indexing inputs |
| Main backend search MVP live | You replace or augment with vectors without breaking clients |
| Clear SLA (latency, cost) | Cameroon networks need small models and caching |

## Target layout (create when you bootstrap the service)

```
ai-backend/
├── app/
│   ├── main.py                 # FastAPI app, lifespan, CORS (internal only)
│   ├── api/
│   │   ├── health.py
│   │   ├── recommendations.py    # POST → user id + context → product ids
│   │   ├── search.py             # POST query → ranked product ids + scores
│   │   ├── embeddings.py         # batch / reindex (internal or worker)
│   │   └── vision.py             # optional: image → similar products
│   ├── core/
│   │   ├── config.py           # env, model paths
│   │   └── security.py         # service-to-service token validation
│   ├── services/
│   │   ├── recommend.py
│   │   ├── semantic_search.py
│   │   ├── embed.py            # wrap sentence-transformers or API
│   │   └── rerank.py           # optional cross-encoder
│   └── schemas/                # Pydantic request/response (mirror backend types)
├── workers/                    # optional: Celery/RQ for reindex jobs
├── models/                     # local artifact cache (gitignored)
├── scripts/
│   └── reindex_products.py     # pull from Postgres via read replica or export
├── tests/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml          # optional: Qdrant/pgvector sidecar for dev
└── README.md                   # this file
```

## Phased work (what has to be done)

### Phase A — Foundation (before any “smart” feature ships)

| Task | Outcome |
|------|---------|
| FastAPI skeleton + `/health` | Deployable unit |
| Shared secret or mTLS between `backend` and `ai-backend` | No public exposure |
| Read-only access pattern | Main backend sends product snippets or IDs; AI returns IDs/scores only (avoid leaking full DB) |
| Observability | Structured logs, request IDs propagated from Node |

### Phase B — Search (highest ROI after keyword search)

| Task | Outcome |
|------|---------|
| Text embedding pipeline | Product title + description → vector store |
| `POST /search/semantic` | Query embedding + top-k retrieval |
| Optional hybrid | Merge with Postgres FTS scores from main backend |
| Reindex job | On product create/update/delete (event from backend or periodic sync) |

### Phase C — Recommendations

| Task | Outcome |
|------|---------|
| Feature store minimal | User interests, follows, wishlist signals from main backend (JSON payload per request is OK at small scale) |
| `POST /recommendations/for-you` | Returns ordered product IDs |
| Cold-start rules | Fallback to trending by city/category when user is new |
| Caching | Redis for popular queries / segments |

### Phase D — Vision (optional, later)

| Task | Outcome |
|------|---------|
| Image embedding (e.g. CLIP-class) | `POST /vision/similar` with image URL or bytes |
| Guardrails | Size limits, NSFW filter if required by policy |

### Phase E — Ops & quality

| Task | Outcome |
|------|---------|
| Model versioning | Pin embedding model version; migration plan when upgrading |
| Load tests | Latency under African mobile conditions |
| Cost tracking | GPU vs CPU inference decision |

## Data stores (typical)

| Component | Role |
|-----------|------|
| **Qdrant** / **pgvector** / **Milvus** | Vector similarity |
| **Redis** | Cache embeddings or recommendation results |
| Source of truth | Still **PostgreSQL** in `backend/`; AI is derived data |

## Contract with `backend/`

1. **Requests:** authenticated internal calls only (e.g. `Authorization: Bearer <service-token>`).
2. **Responses:** stable JSON shapes versioned (e.g. `v1`) so Node can map to existing `Product` DTOs.
3. **Failures:** main backend degrades gracefully (fallback to FTS or trending).

## Related docs

- Main API plan and domain rules: `../backend/README.md`
- Product vision: `../frontend/README.md`
