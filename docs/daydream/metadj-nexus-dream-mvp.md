# MetaDJ Nexus "Dream" MVP (Daydream StreamDiffusion)

**Last Modified**: 2025-12-19 20:50 EST

Scope and approach for piping webcam feed into Daydream StreamDiffusion and showing the AI output in the Cinema hover UI.

## Goal
Let users toggle "Dream" inside the Cinema overlay to send their webcam feed to Daydream, then reveal the AI-remixed output after a 15s warm-up. Users can select a persona presentation; the prompt base is currently locked while the prompt bar UI is disabled.

## User Flow
1) User opens Cinema overlay and sees a new **Dream** toggle in the hover controls.
2) Toggle ON → create Daydream stream with SD-Turbo + SD2.1 ControlNets, request webcam permission, and begin WHIP ingest. Dream can run even when no music is playing.
3) Show a **15s countdown** near the toggle while ingest + warm-up run. Dream iframe loads in the background during the countdown.
    - **Controls**: Users can adjust **Frame Size** (Default/Small) and **Frame Position** (Center, Bottom-Left, Bottom-Right, Bottom-Center) during and after countdown.
    - **Auto-hide**: Cinema controls still fade after ~5s of inactivity during the countdown; pointer/tap resets the timer.
    - **Prompt Editing**: The prompt bar UI is currently disabled (partially implemented). Prompt base stays locked to default; only persona selection is available. (Prompt bar is tracked as a roadmap item.)
    - **Warm-up grace**: If Daydream isn't active when the countdown ends, keep the "connecting" state and continue polling through a ~60s grace window plus a short post-poll buffer before showing a failure.
    - **WHIP retry**: Not-ready WHIP responses during warm-up (404/409/429/5xx) are retried with exponential backoff to avoid false errors on quick stop/start.
4) After 15s, reveal the Dream output overlay (iframe/video) in a square frame matching the stream aspect ratio.
5) Toggle OFF → stop ingest, DELETE the stream, hide overlay, clear countdown state.
   - Closing Cinema while Dream is active triggers the same teardown (stop ingest, delete stream, release camera).

## Technical Approach (Implemented MVP)

### Input Source: Webcam Only
**CRITICAL**: Dream uses webcam as the ONLY input source. There are no fallbacks to visualizers or video scenes.

- **Capture source**: Webcam feed (640×480) drawn to an off-screen **512×512** intermediate canvas (square, cover-cropped), mirrored horizontally for natural orientation
- **Capture rate**: Draw loop is throttled to ~30fps and streamed via `canvas.captureStream(30)`; capture track uses `contentHint="motion"` for smoother WebRTC encoding
- **No fallbacks**: If webcam is unavailable (denied, in use, not found), Dream shows an error state and cannot proceed
- **Webcam lifecycle**: Webcam is acquired only while Dream is active (connecting/streaming) and is released immediately when Dream stops (idle) or errors. When Permissions API is available, Dream skips a redundant getUserMedia pre-check if camera permission is already granted.
- **Waiting state**: While webcam initializes, a pulsing gradient with "Initializing Camera..." text is shown (but not sent to Daydream)
- **Webcam constraints**: Requests `640×480 @ 30fps` (ideal/max) for stable capture across devices

### API & State
- **WHIP ingest**: Single client managing offer/answer; proxy via `/api/daydream/streams/:id/whip?resource=...` with HTTPS + allowlist enforcement.
- **Trickle ICE**: Currently disabled for reliability with Livepeer WHIP; we send a single offer after ICE gathering/timeout (no candidate PATCH).
- **API proxy**: Routes at `/api/daydream/streams` (create), `.../status`, `.../parameters`, `.../whip`, `.../:id` (delete) shield keys and enforce host rules.
- **Prompt/persona sync**: While Dream is active (connecting/streaming), persona changes PATCH the StreamDiffusion parameters via `{ pipeline: "streamdiffusion", params: {...} }` (including required `model_id`). Prompt base updates are currently disabled at the UI level. Sync attempts wait until the countdown completes and the stream is active (WHIP connected or status poll confirms), then retry on warm-up failures (404/409/429/5xx) so changes apply as soon as the backend is ready. Warm-up errors during the grace window do not count toward the PATCH failure limit.
  - **Live updates**: Persona toggle changes sync in real-time via PATCH to `/api/daydream/streams/{id}/parameters` without requiring stream restart. If Daydream rejects PATCH repeatedly, live updates pause for the session and changes apply on restart.
  - **Required PATCH fields**: Per Daydream API, the PATCH payload must include `model_id` even when only updating dynamic parameters like `prompt`, `guidance_scale`, or `delta`.
- **State**: Minimal Daydream state inside Cinema context (status: idle/connecting/streaming/error, streamId, playbackId, whipUrl, countdownRemaining).
- **UI**: Dream toggle + countdown pill in hover controls; hide iframe until countdown completes.
- **Playback**: Prefer Livepeer iframe via `playbackId` with HLS fallback; always `object-fit: cover` to fill available space.

## Default Generation Settings (MVP)
- Model: `stabilityai/sd-turbo`
- Default Prompt Base: `cartoon magical dj blue sparkle` (locked; prompt bar disabled for now)
- Persona Prefix: `androgynous` | `female` | `male` (selectable via Persona dropdown)
- Full Prompt: `{persona} {promptBase}` (e.g., `androgynous cartoon magical dj blue sparkle`)
- Negative prompt: `blurry, low quality, flat, 2d`
- Resolution: **512×512** (square). Display: 1:1 container with three-tier iframe cropping to hide Livepeer controls:
  - Mobile (~280px): `min-h-[140%] -mt-[20%]`
  - Desktop small (~207px): `min-h-[130%] -mt-[15%]`
  - Desktop default (~342px): `min-h-[120%] -mt-[10%]`
- Steps: 25
- Guidance: 1.0
- Delta: 0.7
- Acceleration: `tensorrt`
- Extras: `use_denoising_batch: true`, `do_add_noise: true`, `t_index_list: [12, 20, 24]`, `enable_similar_image_filter: true`, `prompt_interpolation_method: slerp` (LCM LoRA omitted; Daydream default)
- ControlNets (SD2.1 set, must match sd-turbo architecture):
  - OpenPose: 0.75 (pose_tensorrt)
  - HED (soft edge): 0.2
  - Canny: 0.2 (low/high thresholds 100/200)
  - Depth: 0.75 (depth_tensorrt)
  - Color: 0.2 (passthrough)
- IP Adapter: Disabled

## Cinema Placement (Components)
- Primary surface: `src/components/cinema/CinemaOverlay.tsx` (controls and overlay rendering, webcam acquisition, draw loop)
- Dream hook: `src/hooks/use-dream.ts` (stream lifecycle, WHIP client, status management)
- Cinema hook: `src/hooks/cinema/use-cinema.ts` (intermediate canvas ref, capture stream, prompt/presentation state)
- UI affordance: Hover controls bar — Dream toggle + countdown timer + size/position controls
- Display: Dream output overlay sits atop existing Cinema content; hidden until countdown ends

## Browser Requirements
- **Camera permission required**: Dream cannot function without webcam access
- **HTTPS required**: getUserMedia and WHIP both require secure context (except localhost)
- **Permissions-Policy**: Server must allow `camera=(self)` — see `docs/security/README.md`

## Error States
- **Camera denied**: Shows error overlay with retry/cancel options
- **No camera found**: Shows error overlay
- **Camera in use**: Shows error overlay
- **Stream creation failed**: Shows error with message from API
- **WHIP connection failed**: Shows error state

## Implementation Status
- ✅ Daydream env validation + API proxy routes (create/status/params/whip/delete)
- ✅ Dream client hook (create → poll status → start WHIP → surface playbackId)
- ✅ Cinema hover UI with Dream toggle + countdown + overlay
- ✅ Teardown logic on toggle off and on cinema close/unmount
- ✅ Webcam-only input (no visualizer/video fallbacks)
- ✅ Persona selection (prompt base locked; prompt bar disabled)
- ✅ Frame size/position controls
- ✅ PATCH support detection (tracks failures, shows "Live updates unavailable" after 5 consecutive failures)
- ⬜ Prompt bar UI (partially implemented, currently disabled; re-enable in future)
- ⬜ Analytics: log `dream_enabled`, `dream_disabled`, `dream_ready` events

## Related Documentation
- `docs/daydream/streamdiffusion-reference.md` — API payload reference
- `docs/features/cinema-system.md` — Cinema system overview
- `docs/security/README.md` — Permissions-Policy configuration
