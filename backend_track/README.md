# TaxStreem Backend Track — Transaction Reconciliation Microservice

A lightweight Node.js/TypeScript microservice that reconciles transactions between an internal system and an external payment processor.

---

## Approach

The core of this service is a single `POST /reconcile` endpoint that accepts two lists of transactions (internal and external) and compares them using a priority-based matching strategy.

Matching happens in this order:

1. **Exact match** — same reference AND same amount. These are clean, confirmed matches.
2. **Tolerance match** — same reference but amount differs within a configurable threshold (default ±500 NGN). These flag potential discrepancies worth reviewing.
3. **Unmatched** — anything left over on either side is surfaced as unmatched.

The logic is built around a single loop over internal transactions. For each one, we find a corresponding external transaction by reference. If found, we check the amount difference. A `Set` tracks which external transactions have already been matched to prevent double-matching.

The tolerance threshold is read from the `TOLERANCE_AMOUNT` environment variable, making it configurable without touching code.

For performance, internal transactions are processed in parallel using `Promise.all`, with an external reference map built upfront for O(1) lookups instead of O(n) scanning.

---

## Assumptions

- Matching is done strictly by `reference` field. Two transactions with the same reference are considered a pair.
- Each reference is assumed to be unique per list. If duplicates exist, the first match wins.
- Currency is not used in matching logic — the spec did not require cross-currency reconciliation.
- Amount values are integers (e.g. kobo or minor units), not floats.
- An empty request body (empty arrays) is valid and returns zeroed summary.

---

## Trade-offs

- **No database** — transactions are reconciled in-memory per request. This is intentional per the spec.
- **No authentication** — out of scope for this assessment.
- **Single reference match** — the matcher picks the first external transaction matching a reference. A production system might need more sophisticated deduplication.
- **Synchronous matching** — the current implementation is synchronous. For very large payloads, parallel processing would improve performance.

---

## What I'd Improve With More Time

- Add a Golang implementation of the same service
- Add more edge case tests (duplicate references, negative amounts, missing fields)
- Add request ID tracing to logs for better observability
- Add a health check endpoint (`GET /health`)

---

## How to Run

### Requirements
- Node.js v20+
- npm

### Setup
```bash
# Clone the repo
git clone https://github.com/fohalabi/internship_test.git
cd internship_test/backend_track

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start the dev server
npm run dev
```

### Run with Docker
```bash
# Build the image
docker build -t taxstream-reconcile .

# Run the container
docker run -p 3000:3000 taxstream-reconcile

# Or using docker-compose
docker-compose up
```

### Test the endpoint
```bash
curl -X POST http://localhost:3000/reconcile \
  -H "Content-Type: application/json" \
  -d '{
    "internal": [
      { "id": "TXN-001", "amount": 10000, "currency": "NGN", "reference": "PAY-A" },
      { "id": "TXN-002", "amount": 20000, "currency": "NGN", "reference": "PAY-B" },
      { "id": "TXN-003", "amount": 5000,  "currency": "NGN", "reference": "PAY-C" }
    ],
    "external": [
      { "id": "EXT-A", "amount": 10000, "currency": "NGN", "reference": "PAY-A" },
      { "id": "EXT-B", "amount": 20500, "currency": "NGN", "reference": "PAY-B" },
      { "id": "EXT-D", "amount": 7500,  "currency": "NGN", "reference": "PAY-D" }
    ]
  }'
```

### Run tests
```bash
npm test
```

---

## Project Structure
```
backend_track/
├── src/
│   ├── routes/
│   │   └── reconcile.ts       # Route handler and input validation
│   ├── services/
│   │   └── reconciliationService.ts  # Formats and returns response
│   ├── utils/
│   │   └── matcher.ts         # Core matching logic
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── index.ts               # Entry point
├── tests/
│   └── matcher.test.ts        # Unit tests
├── .env.example
├── jest.config.js
├── tsconfig.json
└── package.json
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `TOLERANCE_AMOUNT` | `500` | Max amount difference (in NGN) for a tolerance match |