# Visual notes and reference-inspired filming

## Visual callouts

Each craft check can carry one approximate region identifying its visible concern. Numbered markers and “Locate in frame” buttons link the image to the complete checklist; no concerns are discarded merely because they cannot be localized. Nonlocal issues stay textual. Invalid, out-of-bounds and low-confidence regions are omitted. Positions are model estimates, not segmentation masks or measured geometry.

On a still, callouts appear on the reviewed image. During live camera use, choose “Inspect analyzed snapshot” to inspect the exact JPEG paired with the response. “Live camera” returns to the moving feed. Boxes are never presented as if they tracked an object after the camera moved. Capture time is shown separately from when the model replied. Portrait and landscape images use the same object-contain geometry as the overlay.

## References

1. Expand “Bring an influence” in scene setup.
2. Supply a director/visual influence, your own reference notes, and optionally a reference image or clip. Choose loose inspiration or a close study.
3. Images are resized locally. Browser-playable clips up to 30 seconds / 20 MB are sampled at three timestamps. Only those stills are sent during Meta shot planning, not the full video or audio.
4. Generate shots in Meta mode. The reference study names techniques, adaptations and source labels. Select the traits you want to carry into filming, then choose a shot.
5. The on-set reference section shows selected traits and reference thumbnails. Live review receives the selected traits, not the original video, full notes or every unselected style preference.

A link is attribution only: the server does not fetch it, scrape YouTube or claim to have watched it. Upload media or supply notes for grounded study. A director name without user reference material uses general model knowledge and is labeled accordingly; there is no curated director database in this version. The selected study goal is guidance, not a promise of an exact reproduction.

## Low-compute retrieval

User notes are split into short passages. A local BM25-style lexical scorer retrieves up to three passages relevant to the scene and intention, with note IDs carried into the plan. No embeddings, vector database or additional retrieval-model calls are used. Source labels in the reference study are checked against supplied frames, retrieved passages and the explicit general-knowledge label.

## Verification

- Twenty automated checks cover domain validation, complete reporting, optional regions, portrait/landscape mapping, note retrieval, input bounds, attribution URLs not being fetched, selected traits in live requests, and error handling.
- The synthetic annotation test returned camera-frame regions while keeping all six checks.
- Browser reference upload sampled a two-second fixture into three frames. Browser Meta planning returned a source-labeled reference study, and selected traits carried into the on-set panel.
- Reference planning initially returned malformed text; the request now uses Meta's JSON response mode in addition to server validation.
- Continuous object tracking, motion/audio analysis of reference clips, SAM segmentation and automatic remote-video ingestion are not implemented.

The final review layout uses one checklist beside the image for both stills and live snapshots; the old duplicated still-review block was removed. A located concern scrolls its image back into view. On desktop the viewfinder stays alongside long reports. Browser interaction verified reference selection, clip sampling, sourced planning, callout selection and the consolidated still-review flow. Model region accuracy remains approximate and full live hardware behavior still needs real-device acceptance.

## Film, Reels and Look Lab

Choose **Film & scenes** or **Reels & shorts** before describing the scene. Meta planning and all live/still checks carry this choice. Reels considers vertical 9:16 framing, readable faces/hands/products, optional caption room and app controls. Film considers scene coverage, blocking and eyelines. Neither mode claims to assess pacing, retention, cuts, audio or temporal continuity from a still.

In **Look Lab**, describe the scene and intended feeling, then explicitly request three palette options. Meta mode makes one text-only request; rehearsal offers clearly labeled fixed exercises. No camera image is sent for palette generation. Options include color swatches and their roles, feasible light arrangements, wardrobe/background ideas, optional grading and a tradeoff. Select one or leave all unselected. The chosen look accompanies shot planning and live/still review, and appears beside the monitor. It never changes camera pixels or automatically grades footage. Color interpretations are creative proposals, not psychological facts or inferred emotions.

Changing the scene, intention, available resources or format clears the selected look and generated options so stale suggestions are not followed. Selecting or clearing a look invalidates the shot plan and pauses camera guidance. Saved briefs and exported notes include the selected look. Older saved briefs continue to work as Film briefs. Reference traits and selected palettes remain distinct controls.

Camera requests prefer portrait dimensions for Reels when supported. The monitor preserves the actual received image ratio and does not stretch or secretly crop a landscape camera feed. Platform-specific safe areas are not measured or guaranteed.

## Your own recorded footage

**Review footage** is separate from reference uploads and works in Film and Reels. Describe the scene and intended feeling, then choose **Review recorded footage**; generating or selecting a shot is optional. Upload a browser-playable recording up to 60 seconds / 100 MB. Four locally extracted stills span the take. **Get footage insights** sends those four samples in one Meta request and returns a summary plus a complete six-category craft report for each timestamp. Selecting a thumbnail seeks the local video and opens that sample's report and approximate callouts. Export footage insights downloads a text report.

The full clip and its audio remain local. This is sampled visual assessment: short events between samples, continuous motion, pacing, cuts and audio are not evaluated. It does not replace full-video review. Suggestions distinguish possible edits from work requiring a reshoot. A chosen palette and any chosen shot/reference traits accompany the review. Leaving the workflow clears the local clip.

## Three-model implementation: Muse Spark, SAM 3.1 and Muse Image

The following supersedes earlier notes that SAM and Muse Image were unimplemented.

- **Muse Spark** interprets a scene or short script excerpt, proposes three shots, reviews stills/recorded samples/live snapshots, proposes palettes, and interprets reference traits. Script excerpts currently share the bounded 4,000-character scene field.
- **SAM 3.1** is available through Subject study below an uploaded still, an inspected live snapshot, or a selected recorded-footage sample. Enter one concrete subject phrase (for example person or tennis racket) and choose Segment & assess composition. One SAM image request returns actual masks; the official @meta-sam/parser decodes the streamed protocol. Mask coverage, centroid and bounding margins are computed locally on the server. Muse Spark then receives the same image and these measurements to offer subject-aware composition alternatives. A failed interpretation retains valid masks; zero matches is an honest empty result.
- **Muse Image** is available inside each shot card's Visualize this shot panel. Add optional direction, then generate one preview. The request incorporates the scene/script, chosen shot, selected palette and only selected reference traits. The result is explicitly labeled generated previs, can be downloaded, and never replaces or alters camera footage. Film and Reel formats request different aspect ratios.

Both visual operations are explicit; none runs automatically while the camera is open. Starting Subject study on a live analyzed snapshot pauses ongoing live guidance to keep its geometry tied to a frozen frame. SAM is not run continuously or used for video tracking in this implementation. Masks are model estimates, not ground truth; tiny objects, partial subjects and ambiguity may yield incomplete or empty masks. A mask centroid is not the face or gaze, and edge contact does not prove accidental cropping. Approximate Muse Spark issue boxes remain separate from SAM subject masks.

Official API references:
- https://dev.meta.ai/docs/sam/overview
- https://dev.meta.ai/docs/sam/client-libraries
- https://dev.meta.ai/docs/image-generation

Requests use the existing server-only META_API_KEY. SAM uses sam-3.1 over /v1/responses. Muse Image uses muse-image-1.0 over /v1/images/generations. Image generation requests n=1 and disables external search/shell tools. No new credential is needed if the account has access. Request and input bounds, safe errors, timeouts, client cancellation and stale-result invalidation apply. This is not an account spending cap.

## Scene-led director notes and frame-based alternatives

The dashboard now separates **Review a take** from **Plan & shoot**. Review a take asks for scene requirements, then continues to upload; planning is not a prerequisite. Optional palettes and visual influences are tucked away so the primary path stays clear. The clip is retained while returning to edit the intention; changing the brief invalidates its report, so a new review uses the updated scene. Switching workflows or removing footage clears the clip.

Recorded feedback now foregrounds a director's reading, an existing strength to preserve, and 2–4 distinct creative explorations at each timestamp. Every exploration includes visible evidence, a concrete experiment, its intended scene-specific effect, a tradeoff, and edit/reshoot feasibility. All six technical craft checks remain available in Full craft notes. They are coverage, not a quality score or ranked error list. Recommendations explicitly consider the scene/script, required mood, resources, selected palette and any chosen shot; they do not infer actual feelings from a face.

In **Director’s notes**, choose **Visualize this direction** or open **Visual alternatives** directly. Select framing, light, color and/or background factors, choose an edit study versus a reshoot concept, and adjust the direction. Muse Image receives the actual selected video frame through its images/edits endpoint, not just a text description. The result appears beside the unchanged original and can be downloaded. Each click makes one explicit image-edit request. Changing timestamps invalidates the previous frame's alternative; no stale image is presented as another timestamp.

An edit study targets captured content, crop, exposure and color. A reshoot concept may imagine another composition or lighting arrangement but is not an achievable edit of the existing recording. Both are AI still proposals that may change details, not regenerated videos, identity guarantees or proof that missing content was recovered. SAM remains available separately on the selected original frame.
