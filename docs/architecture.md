# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Add shared API URL/fetch behavior in `src/api/client.ts`, route data through React components, and render loading, success, empty, and accessible error states for all four capabilities.
- Logic tier decision: Keep Express route handlers thin and place database reads, writes, validation, aggregation, and workout selection in explicit service functions under `src/services`.
- Data tier decision: Define Mongoose-required fields and defaults in shared User, Team, Activity, and Workout models. Seed stable demo fixtures with upserts and reconcile a seeded demo user's team membership without removing unrelated data.
- Activity tracking approach: Validate ObjectIds and verify both referenced records exist before creating an activity. Compute `points` from `minutes`, store the submitted IDs and activity fields, and return a deliberate 4xx for malformed or missing references.
- Team management approach: Validate the team name and mascot through Mongoose, default `members` to an empty array, and preserve submitted member IDs when creating or listing teams.
- Leaderboard approach: Aggregate activity `points` by team, join or combine with team names, sort descending, and assign ranks from 1 in the resulting order.
- Workout suggestions approach: Find the user by email and select workouts whose focus matches recent activity or the user's `fitnessGoal`, using seeded workout history as a fallback. Return a reason tied to the user's activity or goal and a 404 for unknown users.

## Test plan

Implement and verify from the data tier outward. Use the smallest focused test after each change, then run builds as the final integration check.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Baseline: 1 seed test passed; 4 model tests failed because User, Team, Activity, and Workout required fields and validation are incomplete.
  - Meaning: Add Mongoose validation/defaults first. The remaining seed test passing does not cover all required model contracts.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Baseline: all 4 API contract tests failed. Activity/team operations return incomplete `501` behavior, the leaderboard is empty, and workout suggestions do not match the requested user.
  - Meaning: Implement one API capability at a time—activities and teams before aggregation/recommendations—and use 4xx responses for malformed IDs and unknown references/users.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Baseline: all 15 presentation contract tests failed because routes still render the placeholder implementation instead of API-backed loading, success, empty, and error states.
  - Meaning: Implement the shared API client, then each route view and its accessible states; do not hide or weaken route-specific assertions.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Meaning: A pass confirms Express and TypeScript compile; a failure points to route, service, model, or type integration.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Meaning: A pass confirms React/TypeScript and Vite integration; a failure points to route, component, API-client, or asset compilation issues.

Implementation order:

1. Complete Mongoose models and seed behavior, then run the data-tier test until it passes.
2. Implement shared API route logic and activity/team behavior, then run the API test.
3. Implement leaderboard aggregation and workout recommendations, then rerun the API test.
4. Implement the shared frontend API client and route states, then run the frontend test.
5. Run both builds and address any remaining integration failures.
