# CineMind 2.0

A filmmaking copilot for turning a scene or short script excerpt into shots, studying recorded footage, and refining camera framing. The filmmaker sets the intention and keeps creative control.

## Three Meta models, three roles

| Model | Role in CineMind |
| --- | --- |
| **Muse Spark** (`muse-spark-1.3`) | Script/scene interpretation, three shot options with tradeoffs, live and recorded-sample craft checks, palette proposals, reference interpretation, and composition guidance grounded in SAM geometry. |
| **SAM 3.1** (`sam-3.1`) | Actual subject masks on a selected still, recorded sample or frozen live snapshot. Mask coverage, centroid and bounding margins support subject-aware composition. |
| **Muse Image** (`muse-image-1.0`) | Optional generated shot/mood previews from a planned shot, scene intention, selected palette and selected reference traits. |

All three use Meta Model API with the same server-only key. The UI labels model outputs and keeps generated previews separate from captured footage. Approximate Muse Spark issue boxes are distinct from SAM masks.

## Try it

1. Install Node.js 22.9 or newer and run `npm install`.
2. Create `.env.local` from the blank `.env.example` if it does not already exist. Set `META_API_KEY` and `META_MODEL=muse-spark-1.3`. Keep the real key out of example files and Git; `.env.local` is ignored.
3. Run `npm run preview` for the stable production preview. Open `http://127.0.0.1:3000/dashboard`.
4. Start in rehearsal for clearly labeled fixed exercises without API calls. Select **Meta live** for real model requests.

## Workflow

- **Describe**: choose Film or Reels, paste a scene/script excerpt and state the feeling and available resources. Look Lab offers three optional color directions.
- **Plan**: compare three Muse Spark shot options. Open **Visualize this shot** to generate one Muse Image preview, optionally adding your own direction. Choose a shot to continue to the camera.
- **Go live**: use a browser-visible camera, including an iPhone supplied as the Mac's camera. Open camera, then separately start periodic AI guidance. Inspect an analyzed snapshot to examine issue callouts or open **Subject study** for SAM masks and Muse Spark composition interpretation.
- **Review footage**: upload your own playable clip up to 60 seconds / 100 MB without requiring a shot plan. Four local samples receive complete timestamped craft reports. Selecting a thumbnail seeks the local video. Subject study also works on these samples. Export the text report.
- **Bring an influence**: supply director/visual-direction notes, a still, or a short reference clip. Local lexical retrieval selects passages from your notes; Muse Spark returns source-labeled traits. Choose only the traits you want followed. Reference links are attribution only.

Film considers scene coverage and composition. Reels considers vertical framing, caption room and readable faces/hands/products. Both assess all six craft categories: subject, image clarity, composition, background/edges, light/exposure and scene/intention.

## Scope and request behavior

Live guidance sends an initial snapshot, then waits 12 seconds after each reply before capturing another; response time adds to the interval. Sessions stop after eight attempted requests, on errors, on pause or when the tab is hidden. No continuous video/audio stream is sent for these reviews. Local brightness is a pixel average, not a calibrated light meter.

Recorded-footage review uses four sampled stills, not full-video motion, pacing or sound analysis. SAM Subject study is explicitly requested on a frozen sample; it does not continuously track objects. Starting it pauses live guidance. Zero matches is valid, and masks can be incomplete or wrong. A mask centroid is not gaze, and touching an edge is not inherently bad composition.

Muse Image generates one optional previs image per click. It does not edit the camera feed, recreate exact performer identity, or guarantee the suggested setup is physically achievable. Palette suggestions follow the user's stated feeling, not face-based emotion inference. Explicit requests consume API credits; session limits are not an account spending cap.

## Verification and demo

- `npm test` — domain validation, actual-route tests with mocked network boundaries, timestamp integrity, masks through the official SAM parser, geometry, malformed/partial outputs, and single-image generation bounds.
- `npm run typecheck`
- `npm run build`
- [Testing guide](TESTING.md), [visual/reference guide](VISUAL_REFERENCE_GUIDE.md), [three-minute demo script](DEMO_SCRIPT.md), [tennis and live demo inputs](DEMO_INPUTS.md).

Real API smoke tests used synthetic content and returned both a SAM mask with Muse Spark interpretation and a Muse Image preview. Real-device camera quality and your own footage still require rehearsal.

## Hackathon contribution

CineMind existed before this event. The 2.0 Meta workflows, redesigned studio/onboarding, complete craft reports, spatial callouts, local reference retrieval, Film/Reels modes, Look Lab, recorded-footage sampling, SAM subject study and Muse Image shot previews are the new work. See [HACKATHON.md](HACKATHON.md) for the baseline and development record. Earlier notes there are historical and are superseded by later implementation sections.

Official model documentation: [Meta overview](https://dev.meta.ai/docs/overview), [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries), [Muse Image](https://dev.meta.ai/docs/image-generation).


### Scene-led recorded-footage review

The recorded-footage workflow now starts with Review a take, followed by scene intention and upload. Each sampled frame includes a director's reading, an existing strength, and two to four creative explorations connecting visible evidence to the scene's requirements, a concrete experiment, intended effect and tradeoff. Suggestions distinguish editing from reshooting; the complete six-area craft report remains available. Changing the brief retains the local clip and invalidates its previous notes.

Visual alternatives attach the actual selected frame to Muse Image's image-edit endpoint, with filmmaker-selected factors and edit/reshoot scope. This request path is covered by mocked route tests. Live image-edit verification is incomplete: the first browser request returned an upstream failure, and the follow-up diagnostic was blocked by Codex approval-review usage limits. Earlier successful image-generation tests do not establish that image editing works.

Current local validation: 30 automated tests and TypeScript checks pass. Real Muse Spark testing with a synthetic clip confirmed scene-specific director notes. Recorded review still samples four frames; it does not analyze continuous motion or audio.


### Guided scene builder

On the intention screen, open **Develop an idea into a complete scene**. Supply action, audience feeling, available resources, and optional setting, must-haves/exclusions and visual influences. Muse Spark proposes an editable full scene, intention, constraints, disclosed creative additions and a representative-frame prompt. Nothing replaces the brief until **Use this scene as my brief** is selected. **Preview scene with Muse Image** sends one explicit text-to-image request for that draft without requiring a planned shot. This is separate from recorded-frame image editing. The approved scene flows into planning, live/recorded review and image previews.

Validation: 32 automated checks cover requirement bounds, context propagation, malformed responses and the representative-frame image-generation path. Live model verification of this new builder remains outstanding.
