# API Documentation

The Inkpolish API lets Agency accounts score, rewrite, and generate guideline-aligned content
programmatically — the same three tools available in the Inkpolish dashboard, connected directly
to your own systems.

## Base URL

```
https://inkpolish.com/api/v1
```

All requests must be made over HTTPS. Requests to plain HTTP will fail.

## Who this is for

The Inkpolish API is available to **Agency accounts only**. If you're an individual subscriber,
the Score Checker, Content Rewriter, and Prompt Generator are available directly in your dashboard
— the API isn't needed for solo use.

---

## Quick Start

1. **Create your API token** from your Inkpolish dashboard (see [Authentication](#authentication)
   below).
2. **Make your first request** — check your available credit balance:

   ```bash
   curl https://inkpolish.com/api/v1/balance \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Run a Score Check**:

   ```bash
   curl -X POST https://inkpolish.com/api/v1/check \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Your article text here"}'
   ```

That's it — you're connected.

---

## Authentication

Every request to the Inkpolish API requires a personal API token, sent as a Bearer token in the
`Authorization` header:

```
Authorization: Bearer YOUR_TOKEN
```

Requests without a valid token, or using a revoked token, receive a `401 Unauthorized` response.

### Creating a token

API tokens are created directly from your Inkpolish account — there's no separate developer portal
or application process.

1. Log in to your Inkpolish Agency account.
2. Click the **Account** icon in the bottom-left of your dashboard sidebar.
3. Scroll to the **API Access** section.
4. Click **Create Token**.
5. Give your token a clear, descriptive name — something that tells you what's using it later, e.g.
   `Zapier Integration` or `Internal Reporting Dashboard`.
6. Your token is shown **once**, immediately after creation. Copy it and store it securely right
   away — Inkpolish stores only a hashed version internally and cannot display the plaintext token
   again after this point, for the same reason your password isn't recoverable in plaintext either.

If you lose a token, don't worry — just create a new one and revoke the old one from the same
screen.

### Revoking a token

From the same **API Access** section, click **Revoke** next to any token you want to disable.
Revocation is immediate — anything actively using that token loses access right away. This can't
be undone; if you need access again, create a new token.

### One important note on scope

A token authenticates as *your account* — it isn't a separate, independent identity with its own
credit allowance. Every request made with any of your tokens draws from the same shared credit
balance as your dashboard usage. Creating multiple tokens (one per integration, for example) is
useful for keeping track of what's calling the API and for revoking access to one system without
affecting another, but it doesn't multiply or separate your available credit.

---

## Rate Limits

Rate limits are tiered by the actual cost of each endpoint, not a single flat number across the
whole API:

| Endpoint type | Limit |
|---|---|
| Score Check, Rewrite, Prompt Generation | 30 requests / minute |
| Balance, Transactions, and all history/detail lookups | 120 requests / minute |

If you exceed your limit, you'll receive a `429 Too Many Requests` response. Standard rate-limit
headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`) are included on every
response so you can build retry logic without guessing.

---

## Credits & Usage

Every API call that generates content consumes credit, at the exact same rate as using the tool
directly in your dashboard:

| Action | Credit cost |
|---|---|
| Score Check | 1 credit |
| Prompt Generation | 1 credit |
| Content Rewrite | 2 credits |

Read-only endpoints (`balance`, `transactions`, and the history/detail lookups) never consume
credit, regardless of how often you call them — only within their own rate limit above.

---

## Endpoints

### Actions

These three endpoints generate content and consume credit. All are `POST` requests.

| Method | Endpoint | Description | Credit cost |
|---|---|---|---|
| `POST` | `/check` | Score a piece of content against Google's Helpful Content guidelines | 1 |
| `POST` | `/rewrite` | Rewrite content to address flagged issues | 2 |
| `POST` | `/prompt` | Generate a guideline-aligned prompt for content that doesn't exist yet | 1 |

### Account

Read-only, no credit cost.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/balance` | Your current available credit balance |
| `GET` | `/transactions` | Your credit purchase and usage history |

### History

Read-only, no credit cost. Look up past results from the three Actions endpoints above.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/checks` | List your past Score Checks |
| `GET` | `/checks/{id}` | Retrieve a specific Score Check by ID |
| `GET` | `/rewrites` | List your past Rewrites |
| `GET` | `/rewrites/{id}` | Retrieve a specific Rewrite by ID |
| `GET` | `/prompts` | List your past generated Prompts |
| `GET` | `/prompts/{id}` | Retrieve a specific Prompt by ID |

---

## Request & Response Details

### `POST /check`

Scores raw text content. **Note: this endpoint accepts text content only — submitting a URL for
Inkpolish to fetch and score isn't currently supported via the API.**

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `content` | string | Yes | The text to score. Empty content (after trimming and stripping HTML tags) returns a `422`. |

**Success response** — `201 Created`

```json
{
  "data": {
    "id": 123,
    "input_type": "text",
    "content_snippet": "The first 200 characters of your content…",
    "score": 78,
    "created_at": "2026-08-15T10:00:00.000000Z",
    "source_url": null,
    "category_scores": { "...": "guideline category breakdown" },
    "fixes": ["..."]
  },
  "credits_remaining": {
    "promotional_credits": 10,
    "purchased_credits": 238,
    "total_credits": 248
  }
}
```

### `POST /rewrite`

Rewrites text content, optionally guided by specific issues to address.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `content` | string | Yes | The text to rewrite. Empty content returns a `422`. |
| `seed_fixes` | array | No | Specific issues to address in the rewrite, if you already know what to fix (e.g. from a prior `/check` call). Omit to let Inkpolish rewrite based on its own assessment. |

Like `/check`, this endpoint accepts text content only, not a URL.

**Success response** — `201 Created`

```json
{
  "data": {
    "id": 456,
    "rewritten_content": "…",
    "fixes_applied": ["..."],
    "guideline_alignment": "...",
    "created_at": "2026-08-15T10:00:00.000000Z"
  },
  "credits_remaining": {
    "promotional_credits": 10,
    "purchased_credits": 238,
    "total_credits": 248
  }
}
```

### `POST /prompt`

Generates a guideline-aligned prompt for content you haven't written yet.

**Request body**

| Field | Type | Required |
|---|---|---|
| `content_type` | string | Yes |
| `topic` | string | Yes |
| `target_audience` | string | Yes |
| `tone` | string | Yes |
| `desired_length` | string | Yes |
| `target_keywords` | string | No |
| `additional_notes` | string | No |

**Success response** — `201 Created`

```json
{
  "data": {
    "id": 789,
    "generated_prompt": "…",
    "created_at": "2026-08-15T10:00:00.000000Z"
  },
  "credits_remaining": {
    "promotional_credits": 10,
    "purchased_credits": 238,
    "total_credits": 248
  }
}
```

### `GET /balance`

**Success response** — `200 OK`

```json
{
  "data": {
    "promotional_credits": 10,
    "purchased_credits": 240,
    "total_credits": 250,
    "promotional_expires_at": "2026-08-22T10:00:00.000000Z"
  }
}
```

### `GET /transactions`

Returns Laravel's standard pagination format (`data`, `links`, `meta`). Accepts an optional
`?per_page=` parameter (default 25, capped at 100).

Each transaction record:

| Field | Type | Notes |
|---|---|---|
| `id` | integer | |
| `type` | string | One of: `grant_promotional`, `grant_purchased`, `consume`, `refund`, `adjustment`, `expire` |
| `source` | string | `promotional` or `purchased` |
| `amount` | integer | |
| `promotional_balance_after` | integer | Promotional balance immediately after this transaction |
| `purchased_balance_after` | integer | Purchased balance immediately after this transaction |
| `feature` | string | Which action this transaction relates to, where applicable |
| `feature_record_id` | integer | The related Check/Rewrite/Prompt ID, where applicable |
| `description` | string | Human-readable description, e.g. `"Content Check (API)"` |
| `created_by` | integer, nullable | Only set on a manually-created transaction (e.g. a Superadmin adjustment); `null` on any transaction generated automatically by your own usage |
| `created_at` | string | |

### `GET /checks`, `GET /rewrites`, `GET /prompts`

All three return Laravel's standard pagination format (`data`, `links`, `meta`). Accept an optional
`?per_page=` parameter (default 25, capped at 100).

List responses return a **summary** of each record — the full content (e.g. a Check's complete
`category_scores` and `fixes`, or a Rewrite's full `rewritten_content`) is only included when you
fetch that specific record by ID via the matching `show` endpoint (`GET /checks/{id}`,
`GET /rewrites/{id}`, `GET /prompts/{id}`).

### Errors

| Status | Meaning |
|---|---|
| `401` | Missing or invalid API token |
| `402` | Insufficient credit balance to complete the action — see below |
| `404` | Record not found, or belongs to a different account — Inkpolish never confirms whether a record exists if it isn't yours |
| `422` | Invalid or missing request data |
| `429` | Rate limit exceeded (see [Rate Limits](#rate-limits)) |
| `502` | A genuine, temporary failure generating your result — safe to retry |

Action endpoints (`/check`, `/rewrite`, `/prompt`) check your credit balance *before* running —
you're never charged for a request that couldn't complete. If your balance is too low, you'll get:

```json
{
  "error": "insufficient_credit",
  "message": "You don't have enough credits to complete this action. Please purchase more credits to continue.",
  "credits_remaining": {
    "promotional_credits": 0,
    "purchased_credits": 2,
    "total_credits": 2
  }
}
```

---

## Support

Questions, feedback, or something not working as documented? Email
[hello@inkpolish.com](mailto:hello@inkpolish.com) — a real person reads every message.

For questions about your Inkpolish account, billing, or credit balance specifically, the fastest
answer is usually in your dashboard directly.