# Copiloto Jurídico

Copiloto Jurídico is a legal technology application designed to help legal professionals organize cases, documents, timelines, intake workflows, reports, search, and AI assisted work in a single environment.

The project explores how AI can support real legal workflows while preserving human oversight, traceability, configurable behavior, and operational visibility.

## Why this project exists

Legal work often combines fragmented case information, documents, deadlines, client intake, drafting, research, and repetitive administrative tasks.

Copiloto Jurídico brings these workflows together in one application and adds an AI administration layer that can be monitored and configured instead of treating the model as an opaque black box.

## Main features

### Legal workflow

* Case management
* Case detail workspace
* Document management
* Case timelines
* Client intake
* Search
* Reports
* Partner management
* User profile and settings
* Writing style configuration
* External storage configuration
* User manual and onboarding resources

### Access and administration

* Authentication
* Protected application routes
* Access status validation
* License validation
* Super administrator area
* Role aware application behavior
* Administrative controls for platform management

### AI administration and observability

Copiloto Jurídico includes a dedicated administrative layer for AI operations:

* AI service status
* Prompt management
* Model configuration
* AI execution logs
* AI settings
* Usage and operational monitoring
* AI metrics dashboard
* AI radar for visibility into AI related activity

The goal is to make AI behavior inspectable and configurable, with clear human control over how it is used inside legal workflows.

## Technology stack

The application is built primarily with:

* React
* TypeScript
* Vite
* Supabase
* TanStack Query
* React Router
* Tailwind CSS
* shadcn/ui
* Vitest

The repository also includes Supabase migrations and backend functions used by the application.

## Project structure

```text
src/
  components/        Reusable interface components
  contexts/          Application contexts
  hooks/             Application hooks and access control
  integrations/      External and backend integrations
  lib/               Shared application utilities
  pages/             Application pages and workflows
  test/              Automated tests

supabase/
  functions/         Backend functions
  migrations/        Database migrations
  config.toml        Supabase project configuration
```

Important application areas include:

```text
/cases
/documents
/timeline
/reports
/search
/intake
/writing-style

/admin
/admin/ai/status
/admin/prompts
/admin/ai/logs
/admin/ai/settings
/admin/radar
```

## Running locally

Requirements:

* Node.js
* npm
* A Supabase project or compatible Supabase environment

Clone the repository:

```bash
git clone https://github.com/leandrofs77/copilotojuridico.git
cd copilotojuridico
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The project requires the environment configuration used by the Supabase integration and any enabled external services.

Do not commit production credentials, API keys, service role keys, encryption keys, OAuth secrets, or other server credentials to the repository.


## Environment and production secrets

The browser application only requires public frontend configuration.

Server side secrets must be configured in Supabase Edge Functions or the equivalent server environment and must never be exposed through `VITE_` variables.

Important server side values include:

```text
SUPABASE_SERVICE_ROLE_KEY
INTERNAL_WORKER_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
LOVABLE_API_KEY
AI_PROVIDER_KEY_ENCRYPTION_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
OAUTH_TOKEN_ENCRYPTION_KEY
OAUTH_STATE_SECRET
OAUTH_ALLOWED_REDIRECT_URIS
CORS_ALLOWED_ORIGINS
```

Use `.env.example` as the configuration reference. Never commit real secrets to the repository.

## Development

Useful commands:

```bash
npm run dev
npm run build
npm run lint
npm run test
```

Available scripts may evolve as the project develops. Check `package.json` for the current configuration.


## Security and privacy

Copiloto Jurídico handles potentially sensitive legal information, so security controls are treated as part of the application architecture rather than as an optional layer.

Current protections include:

* Row Level Security across user owned data
* Tenant isolation between cases, documents, events, reports, and related records
* Private document storage with user scoped paths
* Ownership validation inside Edge Functions that use the Supabase service role
* Signed Stripe webhook verification
* Explicit protection for internal workers
* Encrypted Google and Microsoft OAuth tokens using AES GCM
* Encrypted user supplied AI provider keys
* Signed OAuth state validation and redirect URI allowlists
* Restricted browser CORS origins
* Reduced personally identifiable information in operational logs
* Explicit opt in before external AI processing
* Server side enforcement of the external AI consent preference
* Security hardened SECURITY DEFINER database functions

User supplied AI provider keys are never returned to the browser after storage. The interface receives only metadata and a masked key hint.

Google Drive, OneDrive, and SharePoint access and refresh tokens are encrypted before being persisted.

External AI processing is disabled by default. Users must explicitly enable it in the application privacy settings before case data, document excerpts, reports, events, or writing samples can be sent to an external AI provider.

See [SECURITY.md](SECURITY.md) for deployment requirements and additional security details.

## AI design principles

Copiloto Jurídico is being developed around a few important principles:

1. Human oversight. AI should assist legal professionals, not silently replace professional judgment.
2. Traceability. AI activity should be observable whenever practical.
3. Configurability. Prompts, models, and operational behavior should be manageable instead of being buried in application code.
4. Clear boundaries. AI generated content must be treated as assisted output and reviewed before professional use.
5. Maintainability. AI features should remain understandable to developers maintaining the system.
6. Privacy and security. Legal information can be sensitive, so access control and responsible data handling are core architectural concerns.

## Current development focus

Current work includes improving:

* AI observability and administration
* Prompt and model management
* Legal workflow integration
* Automated testing
* Access control
* Documentation
* Security hardening and tenant isolation
* Privacy controls for external AI processing
* Maintainability
* Deployment and operational reliability

## Responsible use

Copiloto Jurídico is a software project and does not replace qualified legal professionals.

AI generated content may contain errors, omissions, or inaccurate interpretations. Users are responsible for reviewing and validating generated content before relying on it in professional or legal contexts.

The application includes dedicated legal and AI related notices as part of the product.

## Contributing

Contributions, technical discussions, bug reports, and suggestions are welcome as the project evolves.

If you want to contribute, you can open an issue describing the problem, proposed improvement, or use case before submitting larger changes.

## Maintainer

Maintained by [Leandro de Freitas Silva](https://github.com/leandrofs77).

My work spans software development, application operations, infrastructure, databases, integrations, observability, automation, and applied AI.

## Repository

https://github.com/leandrofs77/copilotojuridico
