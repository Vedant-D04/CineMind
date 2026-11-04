# CineMind 2.0 — hackathon development

Baseline: `aa0fb9e736e303b2eb1a3d9db504af6f94db27e8`. The pre-existing project includes the original camera analysis suite, landing page and Azure chat. Those are not new hackathon contributions.

## New work in this checkout

- `/dashboard`: an intention-first workspace carrying a scene brief into shot selection, editable framing, and frame review.
- Three static rehearsal exercises, explicitly labeled as examples rather than AI-generated results. Rehearsal review is a general checklist; no image is analyzed.
- `/api/copilot`: server-side Meta chat-completions adapter for three alternative shots and context-aware image review. Strict request and response validation, timeout handling, bounded image inputs and safe public errors.
- Camera capture and local preview, image upload and downscaling, thirds guide, local brief saving, and text note export with source labels.
- Existing tools retained at `/legacy`. Legacy chat now renders text safely and can build without Azure credentials.

## Run locally

Node 22.18+ (Node 25 was used during development):

```
npm ci
npm run dev
```

Open http://localhost:3000/dashboard. Use “Try a sample scene”, explore shot exercises, select a shot and upload a JPEG/PNG/WebP under 2 MB or start the camera. Open the self-review checklist and export notes.

## Enable live Meta calls

Copy `.env.example` to `.env.local`, add your own `META_API_KEY`, and restart the server. The key stays server-side. Choose Meta mode in the workspace. A configured key is not proof of valid credits or model permission; run a shot planning request to test access. Never commit `.env.local`.

Adapter reference: https://dev.meta.ai/docs/cookbook/quickstart-chat-completions and https://dev.meta.ai/docs/protocols/chat-completions. Default model: `muse-spark-1.3`; set `META_MODEL` if your account uses another supported model. Live calls have not been verified without credentials.

Camera video stays local; only a captured/uploaded still is sent when Meta review is explicitly requested. Frames and reviews stay in tab memory; only an explicitly saved brief is stored in browser local storage. Changing a brief invalidates its shot plan and review. Changing a shot or frame invalidates its review.

## Checks

```
node --test tests/*.test.mjs
npx tsc --noEmit
npm run build
```

## Remaining work

SAM 3.1 segmentation and Muse Image previews are not implemented. Frame review is a single image request, not continuous live inference. No emotion inference is performed in the new workspace. Validate Meta access, latency and output quality with actual credits before presenting a live model demo. This local development server has no user authentication or spend controls and should not be exposed publicly with a paid API key.

## Verification from this development pass

Production build and TypeScript checks pass, along with four validation tests. Browser checks covered sample scene entry, three exercise options, shot selection, uploaded-frame preview, rehearsal checklist and exported notes. Camera hardware and live Meta calls were not tested. Endpoint smoke checks covered configuration status, invalid input and missing credentials. Compatible dependency updates upgraded Next.js to 16.4.3 and removed the reported critical issues; npm still reports inherited ESLint/minimatch development advisories and an OpenAI/Zod advisory affecting the legacy SDK. Resolve these before deployment; no public deployment was made.

## Live checks — November 2, 2026

Meta access is now configured locally. A small connectivity request succeeded. One end-to-end planning request returned three validated shot alternatives (11.08 s), followed by one synthetic-frame review returning validated feedback (8.50 s). Build, TypeScript and four validation tests passed again. Real camera footage, repeatability and creative-quality acceptance still need testing; see TESTING.md. Earlier statements that live calls were untested describe the prior development pass.

## Live assistant iteration

The revised on-set experience adds opt-in periodic snapshot guidance, an in-viewfinder optional direction cue, camera selection, local brightness and composition guides, explicit request count and pause controls, and a compact still-review board. This supersedes the earlier still-only UI. It does not add continuous video inference, SAM segmentation, Muse Image, arbitrary IP-camera support, or uploaded-video review. Live scheduling still needs real-device acceptance; automated tests use mocked model responses.

## Complete shot checklist

The live report now covers six filmmaking categories on every snapshot and displays all identified concerns rather than selecting one direction cue. Each category carries visible evidence, an attention/clear/uncertain/not-applicable status, and optional adjustment. The server rejects incomplete coverage. Synthetic regression checks caught an unintentionally cropped head alongside lighting and other concerns, and respected deliberately excluded faces in an insert. Twelve automated tests pass. The single-cue descriptions above document the earlier iteration and are superseded.

## Visual notes and user-reference studies

New work adds optional model-localized image regions, numbered interactive callouts, explicit inspection of the exact analyzed live snapshot, and director/reference inputs. Short reference clips are sampled locally; note retrieval uses a small lexical scorer instead of embeddings. Source-labeled reference traits are chosen by the filmmaker before entering live guidance. See VISUAL_REFERENCE_GUIDE.md for behavior and limits. This is approximate spatial grounding on snapshots, not tracked segmentation.

### Film / Reels and Look Lab

Added explicit Film and Reels workflows to the brief and Meta prompts. Reels planning considers vertical shots, opening premise/demonstration/payoff, optional caption room and interface clearance. Film retains scene-based coverage and composition. All six craft checks remain active in both modes.

Look Lab generates three validated color directions from the stated mood, situation and available resources in one explicit text-only Meta call. Each includes swatches with roles, lighting, styling, optional grading and a tradeoff. Choosing a palette carries it through shot planning and live/still checks, displays it beside the monitor, and includes it in saved briefs and exported notes. Rehearsal has separate labeled fixed exercises. Scene/format/resource changes invalidate stale looks and shot plans. Palette selection does not change camera pixels or infer a performer's feelings.

Validation: 23 automated checks and a production build passed. Browser testing verified real Meta palette generation for a late-night study reel, a successful vertical shot plan following the selected look, the on-set palette display, and clearing stale state when switching to Film. Lower reasoning effort resolves a planning response that previously exhausted the fixed completion budget. No personal camera image was sent during this feature verification. Full-video pacing, audio, retention prediction and automatic grading are outside this implementation.

### Recorded footage workflow

Users can now upload their own footage for timestamped insights in both Film and Reels. This is separate from reference media and does not require a generated shot plan. Browser-local decoding accepts playable clips up to 60 seconds / 100 MB and extracts four bounded samples across the take. One explicit Meta request returns a summary and all six craft checks at each supplied timestamp, preserving every flagged concern and optional approximate callouts on the frozen sample. Thumbnail selection seeks the local player; export saves the complete text review. Request validation binds reports to supplied timestamps and rejects incomplete category coverage or invented timeline positions. Upload replacement, cancellation, mode changes and unmount clean up in-flight client work and object URLs.

Verification: 25 automated checks pass. A real synthetic 2-second WebM upload produced four complete Meta reports; browser checks confirmed 1.3-second seeking, selected problem callouts, text export and clearly labeled no-API rehearsal. No personal footage was used. The full recording/audio is not uploaded and no continuous-motion, audio or full-video pacing analysis is claimed.

### Three-model architecture completed

This section supersedes every earlier statement that SAM 3.1 or Muse Image is unimplemented. Muse Spark now accepts a short script excerpt in the scene field and retains its planning/review roles. Added server-only /api/visuals integrations for real sam-3.1 image segmentation and muse-image-1.0 shot previews. SAM results are decoded with Meta's official @meta-sam/parser, rendered as masks on the matching frozen frame, and measured for coverage, centroid and bounding margins. Muse Spark interprets those measurements with the same image and filmmaker's brief. Subject study is available on stills, inspected live snapshots and recorded-footage samples. Zero matches is preserved; interpretation failures retain masks.

Muse Image previews are explicitly requested per shot and labeled generated previs. The prompt follows the scene, shot, selected palette and only chosen reference traits; generation requests one image and disables search/shell tools. Previews are downloadable and do not replace the actual camera frame. Inputs, output size, streaming completion, timeouts, cancellation and stale context are bounded/validated.

Real synthetic API smoke tests returned one SAM match with successful Muse Spark composition interpretation (17.95 seconds combined) and one Muse Image preview (7.69 seconds). The illustrated SAM fixture produced only a partial subject mask, which Spark explicitly acknowledged; masks are not assumed correct. Twenty-eight automated checks pass, including real official-parser decoding and chunked SSE, valid empty matches, failed interpretation with retained masks, incomplete stream rejection and selected-only/n=1 image generation. No personal imagery was used.


### Scene-led recorded-footage review

The recorded-footage workflow now starts with Review a take, followed by scene intention and upload. Each sampled frame includes a director's reading, an existing strength, and two to four creative explorations connecting visible evidence to the scene's requirements, a concrete experiment, intended effect and tradeoff. Suggestions distinguish editing from reshooting; the complete six-area craft report remains available. Changing the brief retains the local clip and invalidates its previous notes.

Visual alternatives attach the actual selected frame to Muse Image's image-edit endpoint, with filmmaker-selected factors and edit/reshoot scope. This request path is covered by mocked route tests. Live image-edit verification is incomplete: the first browser request returned an upstream failure, and the follow-up diagnostic was blocked by Codex approval-review usage limits. Earlier successful image-generation tests do not establish that image editing works.

Current local validation: 30 automated tests and TypeScript checks pass. Real Muse Spark testing with a synthetic clip confirmed scene-specific director notes. Recorded review still samples four frames; it does not analyze continuous motion or audio.
