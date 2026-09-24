# Security

## Required production secrets

The following values must be configured as server-side Supabase Edge Function secrets and must never be exposed in the frontend bundle:

* `SUPABASE_SERVICE_ROLE_KEY`
* `INTERNAL_WORKER_SECRET`
* `STRIPE_SECRET_KEY`
* `STRIPE_WEBHOOK_SECRET`
* `LOVABLE_API_KEY`
* `AI_PROVIDER_KEY_ENCRYPTION_KEY`
* `GOOGLE_CLIENT_SECRET`
* `MICROSOFT_CLIENT_SECRET`
* `OAUTH_TOKEN_ENCRYPTION_KEY`
* `OAUTH_STATE_SECRET`
* `CORS_ALLOWED_ORIGINS`

`OAUTH_ALLOWED_REDIRECT_URIS` must contain a comma-separated allowlist of exact OAuth callback URLs.

Example:

```text
https://your-domain.example/settings/storage,http://localhost:5173/settings/storage
```

## Secret generation

Use a cryptographically secure random value of at least 32 bytes for:

* `INTERNAL_WORKER_SECRET`
* `OAUTH_TOKEN_ENCRYPTION_KEY`
* `OAUTH_STATE_SECRET`
* `AI_PROVIDER_KEY_ENCRYPTION_KEY`

Do not reuse the same value for different secrets.

## Internal workers

`process-analysis-queue` and `cleanup-processed-files` require the request header:

```text
x-internal-worker-secret: <INTERNAL_WORKER_SECRET>
```

These functions should only be called by trusted scheduled jobs or internal infrastructure.

## Stripe webhooks

The Stripe webhook endpoint now rejects unsigned or incorrectly signed events.

Configure `STRIPE_WEBHOOK_SECRET` with the signing secret for the exact webhook endpoint.

## OAuth token storage

New Google and Microsoft access and refresh tokens are encrypted with AES-GCM before they are stored.

Existing legacy plaintext tokens remain readable for migration compatibility. They are re-encrypted when a token is refreshed or when the user reconnects the provider.

After all active connections have been refreshed or reconnected, legacy plaintext token support should be removed.

## Tenant isolation

Database hardening prevents records with a `case_id` and `user_id` from referencing a case that belongs to another user.

The `search_knowledge` SECURITY DEFINER function also validates the authenticated tenant before returning data.

## Recommended deployment checks

Before production rollout:

1. Apply all Supabase migrations.
2. Configure all required secrets.
3. Redeploy every modified Edge Function.
4. Reconnect Google Drive, OneDrive, and SharePoint connections so stored tokens are encrypted.
5. Run tenant-isolation tests with at least two independent test users.
6. Verify Stripe webhook delivery and signature validation.
7. Verify internal workers reject requests without the internal worker secret.
8. Review CORS allowlists and restrict them to production and approved development origins.

## AI provider keys

User-supplied OpenAI, Google, and Perplexity keys are managed through the `ai-provider-keys` Edge Function.

The browser never reads encrypted key material from the database. It receives only metadata and a masked hint.

Keys are encrypted with AES-GCM before storage using `AI_PROVIDER_KEY_ENCRYPTION_KEY`. Direct authenticated access to `ai_provider_keys` is blocked by RLS, and legacy plaintext rows are removed by the security migration.

Only server-side functions using the service role may read ciphertext, and functions that need a key must decrypt it in memory with the encryption secret.


## CORS

Browser access to Edge Functions uses an explicit origin allowlist configured through `CORS_ALLOWED_ORIGINS`.

Use exact origins separated by commas. Do not use a wildcard in production.

Example:

```text
CORS_ALLOWED_ORIGINS=https://your-domain.example,http://localhost:5173
```

Server-to-server calls without an Origin header continue to work and do not receive a browser CORS allow-origin header.

## External AI processing consent

External AI processing is opt-in.

The `user_privacy_settings` table records whether a user has explicitly enabled external AI processing. User-facing Edge Functions that send case data, document text, legal events, reports, writing samples, or related content to external AI providers reject the request when consent is disabled.

Background document processing also checks this setting before sending content to an external AI service.

The application exposes this preference under Settings, in the Privacy and AI processing section. Disabling the preference blocks future external AI processing at the server layer.

This technical control does not replace the need for an appropriate privacy notice, processor agreements, retention rules, lawful basis analysis, and other applicable privacy compliance work.
