# CineMind 2.0 — three-minute submission demo

The supplied event guide specifies a three-minute demo and requires clear identification of work created during the hackathon. Present only the new 2.0 workflows. Use the companion DEMO_INPUTS.md for exact paste-ready inputs. The narration below is about 350–390 words; rehearse with a stopwatch and finish before 3:00.

## Recording plan

Record these as separate segments, then assemble in this order. Capture actual requests and actual responses; shorten or speed up waiting with an on-screen “Waiting shortened” or “Response wait sped up” label. Do not splice a different response into a supposedly live adjustment. Keep one before/after pair from the same camera session. Freeze briefly on useful UI states instead of constantly scrolling.

Keep the existing iPhone camera → Mac UI setup. Test the iPhone feed before recording. localhost on the Mac is sufficient when the iPhone is a camera device; the phone is not opening the Mac's localhost page. For reconnection, see Apple's Continuity Camera guide: https://support.apple.com/en-ie/102546 . If the browser lists multiple cameras, choose the iPhone inside CineMind after opening the camera.

Use two main recordings: a tennis excerpt and a simple live desk scene. Prepare the optional palette/reference results in separate browser tabs; navigating away from recorded-footage review clears its clip.

## 0:00–0:18 — Introduction

SCREEN: Open on the cinematic dashboard. Brief title overlay: “CineMind 2.0 — a filmmaking copilot.”

SAY:
“I'm Vedant, and this is CineMind 2.0: a filmmaking copilot that helps creators bring their own vision to the screen. CineMind started as an earlier project; this demo shows the new Meta-powered workflows I built during this hackathon.”

## 0:18–0:30 — The UI and intent

SCREEN: Film & scenes selected. Briefly show Reels & shorts, then return to Film. Show the three intention fields and Meta live selector. Paste the tennis input.

SAY:
“I start with the scene, the feeling I want, and the resources I have. Film and Reels follow different framing goals. The filmmaker supplies the intention.”

## 0:30–1:12 — Uploaded tennis video → insights

SCREEN: Choose Review a take, set the intention, then Continue to video. Upload the real tennis clip, show the local player and four samples, then click Get director’s notes. Shorten only the wait. Show scene-specific director’s notes, select a timestamp and choose Visualize this direction. Show original versus generated alternative and shorten only the real request wait. Open Full craft notes for any callout. Open Subject study, run SAM for person, show its mask and composition guidance. Shorten only the wait. Show a second timestamp seeking the player.

SAY:
“Here's a recording of me practicing tennis against a wall. I want it to feel focused and persistent, while keeping the action readable.

“Four frames are sampled locally and sent together to Meta's Muse Spark. It checks subject visibility, clarity, composition, background, lighting and scene intention at every timestamp.

“Each creative direction connects visible evidence to my scene, with a change, its intended effect and a tradeoff. Muse Image can visualize that direction from my actual frame. SAM 3.1 adds subject masks for composition. These are sampled visual insights, not continuous video or tennis coaching.”

DIRECTOR NOTE: If there is no localized issue in your real result, show the evidence text instead. Do not invent an error or box. You may replace one sentence above with a short description of an actual finding after testing your clip.

## 1:12–2:05 — Live iPhone camera → adjustment → response

SCREEN: Start a new brief with the desk-scene input. Show Explore shot options and choose a medium shot. Briefly show its tradeoff. Show the iPhone supplying the Mac camera feed; select the device if needed. Start live guidance with intentionally tight headroom. Show the actual first report, adjust the framing, and show the next report from this same session. Inspect analyzed snapshot, then pause.

SAY:
“Before filming, Muse Spark also turns a scene brief into three shot options, with technical tradeoffs. I choose the starting point.

“Now my iPhone is the camera, with CineMind on my Mac. I'll start live guidance, then change the framing after its first response.

“The next snapshot is evaluated afresh against my chosen shot. I can see which concerns remain and decide what to change.

“Guidance is periodic: the next snapshot is captured twelve seconds after a reply, plus model response time. The feed stays local. Callouts stay on the analyzed snapshot, and I can pause at any time.”

DIRECTOR NOTE: React to what the model actually reports. Do not narrate “it detected my cropped head” unless it did. A remaining or uncertain issue is a valid result. Show one complete before/after cycle, not just a camera preview. If the phone is being used as the Mac's camera, say that; do not imply CineMind is running independently on the phone.

## 2:05–2:47 — Remaining features montage

SCREEN: Briefly show a separate prepared tab with a genuine Muse Image shot preview, then three Look Lab palettes; open Build this look. Show reference-study source labels and selecting one trait. Show Reels mode, a still-review callout, Quick tour and exported notes. A compact screen overlay can list the faster utility features.

SAY:
“Muse Image visualizes a shot and mood as optional previs. Look Lab uses Muse Spark to propose palettes with lighting, wardrobe and grading suggestions. Neither changes my actual footage.

“For reference-inspired shots, CineMind retrieves relevant passages from my notes locally, then Muse Spark combines that context with any supplied reference frames. I choose which traits to carry forward.

“Reels mode adds vertical framing and caption-space considerations. Still review, composition guides, a tutorial and exported notes complete the workflow.”

DIRECTOR NOTE: Local reference retrieval uses lexical ranking of user notes, not a vector database or an entire external film library. Links are attribution only. The static shot-card sketches remain diagrams; only previews explicitly generated through Visualize this shot are Muse Image outputs. Local brightness and guide lines do not use a Meta model.

## 2:47–3:00 — Closing

SCREEN: End on a genuine camera/report view or tennis report, then CineMind title and repo URL.

SAY:
“CineMind helps independent creators understand their shots, explore alternatives, and refine their work with the equipment they already have. The AI offers technical perspective. The filmmaker keeps the creative decision.”

## Model attribution to keep accurate

- Muse Spark, currently configured as muse-spark-1.3: shot planning, recorded-footage sample review, live-snapshot guidance, still reviews, palette proposals and reference-trait interpretation.
- Browser/local code: camera acquisition and playback, video sampling, sample timestamps and seeking, brightness average, composition guides, region rendering, exports and lexical retrieval over supplied notes.
- Approximate boxes: model-proposed positions on an analyzed still, validated and rendered by the application; not SAM masks or tracking.
- SAM 3.1: actual subject masks on selected stills/snapshots/recorded samples, decoded with the official parser and measured for composition. Not continuous tracking.
- Muse Image: explicit per-shot generated previs from scene, shot, selected palette and optional direction. Generated imagery is not captured footage.
- No face-based emotion inference. Color proposals follow the user's stated mood.

## Before the final recording

- Use the production preview and select Meta live, not rehearsal.
- Trim the tennis clip to a clear 15–30 second excerpt if possible; maximum 60 seconds / 100 MB.
- Test the actual tennis recording once and inspect the report. We have verified the feature with a synthetic clip, not your tennis footage.
- Confirm the iPhone feed and one full live before/after response cycle. Keep the browser tab visible; guidance pauses when hidden and stops after eight attempted requests.
- Record the screen and voice. If using an inset to establish the phone, keep the report readable.
- Record the palette/reference montage separately using real generated results. Preserve the chosen camera session for the live before/after.
- Keep actual API keys out of the recording and repository. The example template is blank; the real key belongs in the ignored .env.local file.
- Label sped-up request waits. Show real limitations rather than promising per-frame, audio, or full-video analysis.
- Check the final duration is at most 3:00 and the video/repo access works for judges. This script does not publish or submit anything.
