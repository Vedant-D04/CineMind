# CineMind 2.0 test and submission checklist

## Verified November 2, 2026

- Production build and TypeScript check: passed.
- Four request/output validation tests: passed.
- Meta connectivity: successful small request.
- Live `/api/copilot` shot planning: HTTP 200, three schema-valid alternatives, 11.08 seconds in one test.
- Live frame review: HTTP 200, schema-valid observation, alignment, adjustments and uncertainty, 8.50 seconds in one test. Input was a synthetic 480×270 room/window/figure graphic, not camera footage.
- Earlier browser checks: tutorial progression, sample scene, shot selection, image upload, rehearsal checklist, text export.

These are individual observations, not latency guarantees or proof of creative quality.

## Real-world acceptance test

1. Open `/dashboard`, use Quick tour, complete or skip it. Check Next, Back, Escape and replay.
2. Expand AI connection & mode and select Meta — live model. Confirm the rehearsal label changes.
3. Describe a scene, the audience feeling, and actual equipment. Generate shots. Confirm there are three relevant alternatives with feasible lighting and clear tradeoffs.
4. Choose a shot and rewrite its framing. The director's wording must remain in the editable field.
5. Open the camera and grant permission. Check preview and capture. Stop should release the camera. Also test denying permission and using upload instead.
6. Check this frame with Meta. Read observations separately from interpretation; check for invented objects or equipment. Export and check that notes preserve the brief, selected framing and Meta source label.
7. Retake with one deliberate change: put the subject closer to the window or change its position in the frame. Request another review. It should describe the visible change and relate it to the intention. Do not require aesthetic agreement with the filmmaker.
8. Change the scene intention and regenerate. Earlier shot selection/review must clear. Confirm new options reflect the revised intention.
9. Try an unsupported file and a file over 2 MB; verify a useful error. Check the workflow on a phone as well as a desktop.
10. Check Meta Usage/Billing after testing. The monthly alert is not an automatic cutoff.

## Before submission

- Run the real-camera and creative-quality tests above.
- Decide final scope. SAM 3.1 and Muse Image are not implemented; do not claim them. Current Meta image review is a requested still-frame review, not continuous real-time AI guidance.
- Add access/spend protection and resolve outstanding dependency advisories before exposing the API publicly. Do not share the local server with a paid key as an unrestricted public endpoint.
- Update the main README for 2.0, setup, model use, limitations and newly built features. Keep `.env.local` out of commits.
- Commit and push the new work to a public repository; confirm access while signed out.
- Provide a working demo deployment if included, a three-minute demo video focused on new hackathon work, and the required submission fields.
- Use the baseline commit in HACKATHON.md to distinguish existing work from new contributions.

## Stable local testing

Use `npm run preview` for hands-on acceptance tests. It builds and runs the production server on port 3000, without development auto-refresh. Stop any existing server on that port first. Use `npm run dev` only while editing; development reloads can reset unsaved workspace state. After code changes, stop the preview, rebuild and restart it. A repeated reload loop was observed in the development preview; the acceptance-test preview was moved to production mode.

## Live copilot iteration

The on-set workflow now has an explicit live-guidance session. Camera video and the 500 ms pixel-brightness guide stay local. Pressing Start live guidance in Meta mode sends a 960-pixel-wide JPEG snapshot, then schedules another snapshot 12 seconds after a successful reply. Requests never intentionally overlap within a session; the session stops after eight attempts, on an error, on pause, on camera stop, on brief/shot change, or when the tab is hidden. A pending request may already have reached Meta when paused. Cue timestamps distinguish past observations from the present frame. No video or audio stream is transmitted.

Nine automated tests pass, including mocked live-endpoint tests for context propagation, optional concise direction, invalid requests, malformed responses, and rate limiting. These mocked tests make no paid calls. Real camera hardware and end-to-end scheduling with live Meta still require acceptance testing.

Live-camera acceptance: select Meta mode, choose a shot, open camera, grant permission, then separately start live guidance. Check request count, one cue at a time, timestamps, pause, hidden-tab pause, and automatic eight-request stop. Edit framing and confirm guidance pauses. Stop camera and confirm its OS indicator turns off. Select another browser-visible camera if available. Test on a phone only through HTTPS; the desktop's 127.0.0.1 URL cannot be opened from another device. Arbitrary RTSP/IP cameras and uploaded full-video analysis are not implemented. Native camera permission and a secure reachable host are required for phone use.

## Complete shot reporting — November 2

Supersedes the earlier one-cue design: every live/still review must return six distinct shot checks (subject visibility, image clarity, composition, background/edges, lighting, story/intention), with evidence and status. All attention checks are displayed with their adjustments; no concern is removed to select a single cue or impose a priority ranking. Intentional exclusions can be marked not applicable, and insufficient evidence must be marked uncertain. Missing/malformed checks cause an explicit error, not a partial report. Exported live notes include check evidence.

Twelve automated tests pass, including multiple simultaneous concerns and intentionally excluded faces. Synthetic live checks exposed an exhausted default reasoning budget; live requests now use the documented low reasoning setting without raising the 4,000-token cap. The final cropped-portrait test returned a complete report including the cropped head, composition mismatch, background distraction, subject lighting, and scene fit. An intentional hands-only variant did not request adding a face, though it flagged other mismatches. These simple illustrated fixtures do not establish accuracy on real camera footage. Repeat with a real medium portrait containing simultaneous framing, clutter and lighting issues; check that all identified concerns remain visible, and that deliberate insert framing is respected.

## Visual/reference acceptance

Twenty automated tests cover spatial bounds and letterboxing, reference retrieval and selected-only trait propagation. Check a portrait and landscape upload: callouts must align with the content, not its black bars. Click each numbered marker and Locate in frame; verify the same issue is selected. Toggle callouts off, and confirm complete textual feedback remains. During live use, markers must appear on the analyzed snapshot, not drift over the current moving feed. Inspecting must remain possible after pausing/stopping the camera.

Use Bring an influence with a director name, a reference still/short clip and your own notes. Confirm clips produce three local sample frames, and that no plan is submitted while media is being read. In Meta mode, generate a study, select one trait and verify only that trait appears in the on-set reference section. Go back, change selected traits and verify the chosen shot updates and live guidance pauses. A link alone is not video ingestion. Check source labels and test unsupported/oversize media.

End-to-end browser verification for the final consolidated layout: a Meta still review returned three localized concerns, Locate in frame selected the matching numbered region and scrolled its image into view, and all six craft checks appeared once in the adjacent panel. The synthetic reference clip sampled at 0.1, 1.0 and 1.8 seconds. A reference-aware plan returned four source-labeled traits, and selecting one carried one trait into the on-set panel. These checks used synthetic artwork, not the user's camera footage.

## Format and palette acceptance

1. Choose Reels, describe a student studying late at night, quiet focus with deadline pressure, phone/lamp/laptop plus morning daylight.
2. In rehearsal, explore sample palettes. Verify the static-exercise label and three distinct choices. Select a look, explore shots, and verify vertical rehearsal options and the chosen palette beside the monitor.
3. In Meta mode, Explore AI palettes sends one text-only request and returns three scene-specific directions. Open Build this look for lighting, styling, grade and tradeoff. No camera pixels are changed.
4. Select a palette and plan shots. Confirm the Reel framing and palette reach planning. Selected palette also travels with the brief on live/still requests; all six craft categories still apply.
5. Edit the scene/intention/resources or switch Film/Reels: old palette choices and selection must clear and the previous shot plan must invalidate. Clear chosen look should retain the options but invalidate the plan.
6. Save/reload a brief with a palette; export notes and check format plus hex values and production suggestions. Older saved briefs without a format must still load.

Automated coverage: palette bounds and hex validation, unique three-option outputs, legacy brief compatibility, separate reel exercises, malformed palette rejection, text-only palette calls, film/reel prompting, selected-look propagation and preservation of full craft coverage.

## Recorded footage review (Film and Reels)

- Enter a scene and intention, then choose Review recorded footage without generating shots. Upload a browser-decodable clip up to 60 seconds / 100 MB.
- Four samples are prepared locally at 5%, 35%, 65% and 95% of its duration. Click thumbnails to seek the local player. The report evaluates sampled images, not continuous video or sound.
- Get footage insights in Meta mode makes one explicit request with four small images and timestamps. Expect a summary and all six checks at each timestamp; all concerns remain visible. Optional callouts belong to the selected frozen sample, never the playing video.
- Confirm editing suggestions versus reshoot requirements, scene/format/palette context, export, cancellation, replacement/removal and leaving the workflow. Controls unlock after errors/cancel; removed files and abandoned decoders release local object URLs.
- Rehearsal provides labeled generic self-review prompts without claiming footage analysis. Switching modes invalidates the previous report.
- Automated tests cover sample ordering, duration bounds, full six-category reports at each timestamp, invented timestamp rejection, no prerequisite shot, four images sent together and safe malformed-output handling.

## Three-model acceptance

1. In Meta mode, paste a short script excerpt into The scene or script excerpt. Explore three Muse Spark shot options.
2. Open Visualize this shot on one option, optionally add direction, and generate one Muse Image preview. Confirm generated-previs label, matching aspect intent, download, error handling, and no generation in rehearsal.
3. Upload a still, inspect a live analyzed snapshot, or select a recorded-footage sample. Open Subject study and segment person or a concrete object noun.
4. Confirm actual SAM masks align with the exact source image; the mask centroid and coverage refer to that mask. Toggle masks and verify bounding/centroid geometry. Muse Spark composition guidance should reference the visible scene and measurements without equating centroids with gaze or calling every edge contact a mistake.
5. Change images/samples or modes while a visual request is pending; stale results must not appear on a new image. Starting a study on a live snapshot pauses guidance.
6. Zero SAM matches is valid; a failed Muse Spark interpretation must leave successful masks visible. Incomplete streams are errors, not complete segmentation.

Automated tests use the real official parser and chunked synthetic SSE, verify mask geometry, measurement context, no-match and partial-failure behavior, incomplete-stream rejection, invalid inputs blocked before model calls, explicit n=1 generation and selected-only influence propagation. Real API smoke calls returned SAM masks plus Muse Spark interpretation and a Muse Image preview using synthetic content. No personal camera image was sent.

Browser verification for three-model completion: a short screenplay excerpt returned three Muse Spark shots. A shot-card Muse Image request rendered a generated-previs image and download link. A separate Muse-generated test still was uploaded and segmented by SAM; the mask aligned with the person, the result reported 10.8% frame coverage, and Muse Spark received its geometry for composition feedback. Toggling Show masks removed the overlay without removing the source image or measurements. Test images were generated/synthetic, not personal footage. These cases establish integration behavior, not general segmentation accuracy.

## Director notes, requirements and actual-frame image edits

- Review a take → enter scene/intention/resources → Continue to video → upload → Get director’s notes.
- Confirm the report names the brief's dramatic requirement, explains visible support/conflict, preserves a useful choice and offers concrete experiments with scene-specific effects and tradeoffs. Edit versus reshoot labels must be meaningful. The full six-area appendix remains available without ranking concerns.
- From a direction, choose Visualize this direction. The selected idea and its factor choices should populate the alternative controls. Compare edit-only and reshoot scopes. One actual selected frame must be sent to /v1/images/edits; text-only generation is not a valid substitute.
- Verify original versus AI alternative side by side, model/source labels, downloads, cancellation, and changing timestamps/modes while pending. The alternative must reset when its source frame changes.
- Return to Set the intention and edit the scene: the clip should remain loaded, video should pause, and old notes/alternatives should invalidate. Continue again and request a review for the new intention.
- Plan & shoot remains the separate planning/live path. Optional palette and reference panels should not block the main review flow.

Automated coverage now includes bounded director-note structure and scene-specific effects/tradeoffs, preservation of scene requirements in the request, actual source image propagation to the edits endpoint, allowed factor and scope validation, and explicit n=1 behavior.


### Guided scene builder

On the intention screen, open **Develop an idea into a complete scene**. Supply action, audience feeling, available resources, and optional setting, must-haves/exclusions and visual influences. Muse Spark proposes an editable full scene, intention, constraints, disclosed creative additions and a representative-frame prompt. Nothing replaces the brief until **Use this scene as my brief** is selected. **Preview scene with Muse Image** sends one explicit text-to-image request for that draft without requiring a planned shot. This is separate from recorded-frame image editing. The approved scene flows into planning, live/recorded review and image previews.

Validation: 32 automated checks cover requirement bounds, context propagation, malformed responses and the representative-frame image-generation path. Live model verification of this new builder remains outstanding.


### Progressive studio entrance

The dashboard opens on three filmstrip cards: Develop a scene, Review footage and Live direction. No automatic tour or brief form appears before choosing. On mobile the cards scroll horizontally with snap alignment. Scene development reveals six questions individually; review/live briefs reveal scene, feeling and resources one at a time. Optional creative controls appear at the resources step. Verify Back retains answers, required empty steps cannot continue, and All workflows stops camera guidance. Returning home clears local footage through unmount. Quick tour remains available on demand.
