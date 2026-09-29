# API Documentation

The Inkpolish API lets you score, rewrite, and generate guideline-aligned content
programmatically — the same three tools available in your Inkpolish dashboard, connected directly
to your own systems.

## Base URL

```
https://inkpolish.com/api/v1
```

All requests must be made over HTTPS. Requests to plain HTTP will fail.

## Who this is for

The Inkpolish API is available to these Inkpolish accounts:

| Account type | API access | Credits used by the API |
|---|---|---|
| **Individual** | While your subscription is active | Your monthly subscription credits — the same allowance as your dashboard |
| **Affiliate** | Always | Your affiliate credit balance — the same balance as your dashboard |

Your account type decides only **where the credits come from** and a few response fields (see
[Credits & Usage](#credits--usage)). Every endpoint, request, and rate limit works the same way
for everyone.

If your Individual subscription ends, your tokens stay in place. The three action endpoints
(`/check`, `/rewrite`, `/prompt`) return `403 subscription_required` until you subscribe again,
while the read-only endpoints (balance, transactions, history) keep working.

---

## Quick Start

1. **Create your API token** from your Inkpolish dashboard (see [Authentication](#authentication)
   below).
2. **Make your first request** — check your available credits:

   ```bash
   curl https://inkpolish.com/api/v1/balance \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json"
   ```

3. **Run a Score Check**:

   ```bash
   curl -X POST https://inkpolish.com/api/v1/check \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     -H "Content-Type: application/json" \
     -d '{"content": "Your article text here - at least 50 characters long."}'
   ```

That's it — you're connected.

---

## Authentication

Every request to the Inkpolish API requires a personal API token, sent as a Bearer token in the
`Authorization` header:

```
Authorization: Bearer YOUR_TOKEN
```

We also recommend sending `Accept: application/json` on every request. Every response — including
every error — is JSON.

Requests without a valid token, or using a revoked token, receive a `401 Unauthorized` response.

### Creating a token

API tokens are created directly from your Inkpolish account — there's no separate developer portal
or application process.

1. Log in to your Inkpolish account.
2. Click the **Account** icon in the bottom-left of your dashboard sidebar.
3. Scroll to the **API Access** section. (If you haven't completed your billing details yet, finish
   that step first — the section appears right after.)
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
credit allowance. Every request made with any of your tokens draws from the same credits as your
dashboard usage. Creating multiple tokens (one per integration, for example) is useful for keeping
track of what's calling the API and for revoking access to one system without affecting another,
but it doesn't multiply or separate your available credits.

---

## Rate Limits

| Scope | Limit |
|---|---|
| All API requests from your account, combined | 60 requests / minute |
| Score Check, Rewrite, Prompt Generation (within the limit above) | 30 requests / minute |

If you exceed a limit, you'll receive a `429 Too Many Requests` response. The standard
`X-RateLimit-Limit` and `X-RateLimit-Remaining` headers are included on every response, and a
`429` response also includes `Retry-After` (in seconds), so you can build retry logic without
guessing.

---

## Credits & Usage

Every API call that generates content uses credits, at the exact same rate as using the tool
directly in your dashboard — the same for every account type:

| Action | Credit cost |
|---|---|
| Score Check | 1 credit |
| Prompt Generation | 1 credit |
| Content Rewrite | 2 credits |

Read-only endpoints (`balance`, `transactions`, and the history/detail lookups) never use credits,
regardless of how often you call them — only within the rate limits above.

### Where your credits come from

Inkpolish has two credit models. Your account type decides which one you're on:

- **Subscription credits (Individual accounts).** Your subscription includes a fixed allowance for
  each billing cycle, shared between your dashboard and the API. It refreshes when your
  subscription renews. Unused credits don't carry over, and there are no separate top-ups.
- **Credit balance (Affiliate accounts).** An ongoing balance with no cycle, made up of the credits
  Inkpolish grants to your affiliate account. They never expire and are reported as
  `purchased_credits` (even though you don't pay for them). The balance also includes
  `promotional_credits` and `promotional_expires_at` fields, which are always `0` and `null` on an
  affiliate account.

Because the two models are different, the `credits_remaining` block (returned by every action
endpoint), `/balance`, and `/transactions` each have **one shape per credit model**. Both shapes
are documented below — check the fields to see which one you're receiving.

**Subscription credits (Individual) — `credits_remaining`**

```json
"credits_remaining": {
  "credits": 100,
  "credits_used": 41,
  "credits_remaining": 59,
  "cycle_end": "2026-10-29"
}
```

**Credit balance (Affiliate) — `credits_remaining`**

```json
"credits_remaining": {
  "promotional_credits": 0,
  "purchased_credits": 238,
  "total_credits": 238
}
```

---

## Endpoints

### Actions

These three endpoints generate content and use credits. All are `POST` requests.

| Method | Endpoint | Description | Credit cost |
|---|---|---|---|
| `POST` | `/check` | Score a piece of content against Google's Helpful Content guidelines | 1 |
| `POST` | `/rewrite` | Rewrite content to address flagged issues | 2 |
| `POST` | `/prompt` | Generate a guideline-aligned prompt for content that doesn't exist yet | 1 |

### Account

Read-only, no credit cost.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/balance` | Your current available credits |
| `GET` | `/transactions` | Your credit history (see the two shapes below) |

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

History covers everything you've run on your account — from the dashboard and from the API alike.

---

## Request & Response Details

In the examples below, `credits_remaining` is shown in the subscription-credits shape (Individual
accounts). Affiliate accounts receive the credit-balance shape instead (see
[Credits & Usage](#credits--usage)).

### `POST /check`

Scores raw text content. **Note: this endpoint accepts text content only — submitting a URL for
Inkpolish to fetch and score isn't currently supported via the API.**

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `content` | string | Yes | The text to score, 50–12,000 characters. Content that's empty after trimming and stripping HTML tags returns a `422`. |

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
    "credits": 100,
    "credits_used": 42,
    "credits_remaining": 58,
    "cycle_end": "2026-10-29"
  }
}
```

### `POST /rewrite`

Rewrites text content, optionally guided by specific issues to address.

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `content` | string | Yes | The text to rewrite, 50–12,000 characters. Content that's empty after trimming and stripping HTML tags returns a `422`. |
| `seed_fixes` | array of strings | No | Specific issues to address in the rewrite, if you already know what to fix (e.g. from a prior `/check` call). Up to 10 items, each up to 255 characters. Omit to let Inkpolish rewrite based on its own assessment. |

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
    "credits": 100,
    "credits_used": 44,
    "credits_remaining": 56,
    "cycle_end": "2026-10-29"
  }
}
```

### `POST /prompt`

Generates a guideline-aligned prompt for content you haven't written yet.

**Request body**

| Field | Type | Required | Accepted values |
|---|---|---|---|
| `content_type` | string | Yes | `blog_post`, `product_description`, `landing_page`, `social_post`, `email`, `other` |
| `topic` | string | Yes | Up to 255 characters |
| `target_audience` | string | Yes | Up to 255 characters |
| `tone` | string | Yes | `professional`, `conversational`, `friendly`, `authoritative`, `persuasive`, `playful`, `formal` |
| `desired_length` | string | Yes | `short` (~300–500 words), `medium` (~600–1,000 words), `long` (~1,200–2,000 words) |
| `target_keywords` | string | No | Up to 255 characters |
| `additional_notes` | string | No | Up to 2,000 characters |

**Success response** — `201 Created`

```json
{
  "data": {
    "id": 789,
    "generated_prompt": "…",
    "created_at": "2026-08-15T10:00:00.000000Z"
  },
  "credits_remaining": {
    "credits": 100,
    "credits_used": 45,
    "credits_remaining": 55,
    "cycle_end": "2026-10-29"
  }
}
```

### `GET /balance`

**Success response** — `200 OK`

Subscription credits (Individual accounts):

```json
{
  "data": {
    "credits": 100,
    "credits_used": 41,
    "credits_remaining": 59,
    "cycle_start": "2026-09-29",
    "cycle_end": "2026-10-29"
  }
}
```

If there's no active billing cycle, the counts are `0` and both dates are `null`.

Credit balance (Affiliate accounts):

```json
{
  "data": {
    "promotional_credits": 0,
    "purchased_credits": 64,
    "total_credits": 64,
    "promotional_expires_at": null
  }
}
```

### `GET /transactions`

Paginated (see [Pagination](#pagination)). Accepts an optional `?per_page=` parameter (default 25,
capped at 100). Newest first.

**Subscription credits (Individual accounts)** — a usage history of every Score Check, Rewrite,
and Prompt you've run, from the dashboard or the API. Each record:

| Field | Type | Notes |
|---|---|---|
| `feature` | string | `check`, `rewrite`, or `prompt` |
| `credits_used` | integer | Credits this action used (1, 2, or 1) |
| `record_id` | integer | The related Check, Rewrite, or Prompt ID — fetch it via the matching History endpoint |
| `created_at` | string | |

Your one free Score Check (the one available before subscribing) never used a credit, so it isn't
listed here.

**Credit balance (Affiliate accounts)** — a full credit ledger: every grant to your account and
every action that used credits. Each record:

| Field | Type | Notes |
|---|---|---|
| `id` | integer | |
| `user_id` | integer | Your account ID |
| `type` | string | `grant_purchased` for credits granted to your account, `consume` for credits used by an action; `refund`, `adjustment`, `grant_promotional`, and `expire` are rare and only appear on a correction made by the Inkpolish team |
| `source` | string | Always `purchased` on an affiliate account (`promotional` is reserved) |
| `amount` | integer | |
| `promotional_balance_after` | integer | Promotional balance immediately after this transaction |
| `purchased_balance_after` | integer | Purchased balance immediately after this transaction |
| `feature` | string, nullable | `check`, `rewrite`, or `prompt` on usage transactions; `null` otherwise |
| `feature_record_id` | integer, nullable | The related Check, Rewrite, or Prompt ID, where applicable |
| `description` | string | Human-readable description, e.g. `"Content Check (API)"` |
| `created_by` | integer, nullable | Set on a transaction created by the Inkpolish team (e.g. credits granted to your account); `null` on anything generated automatically by your own usage |
| `created_at` | string | |
| `updated_at` | string | |

### `GET /checks`, `GET /rewrites`, `GET /prompts`

All three are paginated (see [Pagination](#pagination)), newest first, and accept an optional
`?per_page=` parameter (default 25, capped at 100).

List responses return a **summary** of each record. The full content is only included when you
fetch that specific record by ID via the matching detail endpoint (`GET /checks/{id}`,
`GET /rewrites/{id}`, `GET /prompts/{id}`), which returns it inside `data`.

| Endpoint | List (summary) fields | Detail adds |
|---|---|---|
| Checks | `id`, `input_type`, `content_snippet`, `score`, `created_at` | `source_url`, `category_scores`, `fixes` |
| Rewrites | `id`, `input_type`, `source_url`, `input_snippet`, `check_id`, `created_at` | `input_content`, `rewritten_content`, `fixes_applied`, `guideline_alignment` |
| Prompts | `id`, `content_type`, `topic`, `tone`, `desired_length`, `created_at` | `target_audience`, `target_keywords`, `additional_notes`, `generated_prompt` |

Records created from your dashboard can have `input_type` `url` with a `source_url`. Records
created through the API are always `text`.

### Pagination

Every list endpoint (`/transactions`, `/checks`, `/rewrites`, `/prompts`) uses the same
pagination format. The records are in `data`, alongside these fields:

| Field | Notes |
|---|---|
| `current_page`, `last_page` | Page numbers |
| `per_page`, `total` | Page size and total record count |
| `from`, `to` | Position of the first and last record on this page (`null` when empty) |
| `next_page_url`, `prev_page_url` | Ready-to-use URLs, or `null` at either end |
| `first_page_url`, `last_page_url`, `path` | Reference URLs |
| `links` | Page links, for building pagination UI |

Request a page with `?page=2` (and optionally `?per_page=`).

---

## Errors

Every error response is JSON with an `error` code and a human-readable `message`:

```json
{
  "error": "insufficient_credit",
  "message": "You don't have enough credits to complete this action. Your credits refresh on 2026-10-29."
}
```

| Status | `error` | Meaning |
|---|---|---|
| `401` | `unauthenticated` | Missing, invalid, or revoked API token |
| `402` | `insufficient_credit` | Not enough credits to complete the action — see below |
| `403` | `subscription_required` | Individual account without an active subscription, on an action endpoint — subscribe to run actions via the API |
| `403` | `forbidden` | This account doesn't have API access |
| `404` | `not_found` | Record not found, or it belongs to a different account — the response is identical either way, and you can only read your own records |
| `422` | `validation_failed` or `invalid_content` | Invalid or missing request data |
| `429` | `too_many_requests` | Rate limit exceeded (see [Rate Limits](#rate-limits)) |
| `502` | `scoring_failed`, `rewrite_failed`, or `generation_failed` | A genuine, temporary failure generating your result — safe to retry, and you aren't charged |

A `validation_failed` response also lists the problem per field in `errors`:

```json
{
  "error": "validation_failed",
  "message": "The content field must be at least 50 characters.",
  "errors": {
    "content": ["The content field must be at least 50 characters."]
  }
}
```

### Insufficient credits

Action endpoints (`/check`, `/rewrite`, `/prompt`) check your credits *before* running, against
that action's full cost — you're never charged for a request that couldn't complete. If you don't
have enough (for example, 1 credit left and a 2-credit rewrite), you'll get a `402` with your
current credits attached, in your credit model's shape.

The `message` tells you what to do next, depending on your account:

| Account | `message` ends with |
|---|---|
| Individual | "Your credits refresh on {date}." — the end of your current billing cycle |
| Affiliate | "Please contact support." |

Example (Individual):

```json
{
  "error": "insufficient_credit",
  "message": "You don't have enough credits to complete this action. Your credits refresh on 2026-10-29.",
  "credits_remaining": {
    "credits": 100,
    "credits_used": 99,
    "credits_remaining": 1,
    "cycle_end": "2026-10-29"
  }
}
```

---

## Support

Questions, feedback, or something not working as documented? Email
[hello@inkpolish.com](mailto:hello@inkpolish.com) — a real person reads every message.

For questions about your Inkpolish account, billing, or credits specifically, the fastest answer is
usually in your dashboard directly.
