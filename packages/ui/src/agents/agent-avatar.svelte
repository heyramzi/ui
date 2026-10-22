<script lang="ts">
	import { onMount, untrack } from "svelte";
	import type {
		BotAvatarShading,
		BotAvatarState,
		BotAvatarType,
	} from "#src/agents/vendor/types.js";
	import type { AgentAvatarProps } from "#src/agents/types.js";
	import { botAvatarPresets, stateLabels } from "#src/agents/vendor/presets.js";
	import { SHAPE_PATHS, SHAPE_PARTS } from "#src/agents/vendor/shapes.js";
	import { richer, shade } from "#src/agents/vendor/color.js";
	import { Sim, restPose } from "#src/agents/vendor/engine.js";
	import {
		draw,
		LIGHT_DEFAULTS,
		OVERSCAN,
		RISE,
		type DrawConfig,
	} from "#src/agents/vendor/draw.js";
	import {
		bakesPending,
		hurry,
		onLanded,
		takeMissed,
		warmPlastic,
		type FurStyle,
	} from "#src/agents/vendor/plastic.js";
	import { subscribe, pointer } from "#src/agents/vendor/ticker.js";
	import {
		SHOW_WITHIN,
		bodyPath,
		nextUid,
		onThemeChange,
		partPaths,
		showReady,
		waiters,
	} from "#src/agents/page-state.js";
	import {
		clamp,
		clampOpt,
		deviceDpr,
		hashSeed,
		inkFor,
		lightsFor,
		pointerStrength,
		q,
		reducedMotion,
		resolveTheme as themeOf,
		warmIdle,
	} from "#src/agents/helpers.js";

	let {
		name,
		role,
		shape = "clover",
		path,
		face = "eyes",
		state: botState = "default",
		size,
		color,
		ink,
		brightness: brightnessProp,
		saturation: saturationProp,
		speed = 1,
		paused = false,
		seed,
		shading = "fabric",
		hat = "none",
		glasses = "none",
		headphones = false,
		bowTie = false,
		accessoryColor = "#27272b",
		shadow,
		highlight,
		depth = 0.65,
		roundness = 1,
		furLength = 1,
		furDensity = 1.6,
		furFuzz = 0.9,
		furClumps = 0.4,
		furCurl = 0.7,
		furGravity = 0.9,
		light,
		rim,
		spread,
		backLight,
		lightFront,
		shine,
		sheen,
		backSoftness,
		pose: heldPose,
		interactive = true,
		turn = 1,
		theme = "auto",
		whirl = 0,
		whirlSize = 1,
		whirlWidth = 1,
		whirlLength = 1,
		whirlTilt = 1,
		jumpHeight = 26,
		jumpTime = 0.68,
		jumpStretch = 1,
		jumpSpin = 1,
		jumpLean = 6,
		jumpEvery = 8,
		jumpLand = 0,
		jumpSquash = 1.15,
		jumpSquashTime = 0.37,
		jumpSquashEase = "pulse",
		jumpGroundTime = 0.11,
		jumpGroundEase = "pulse",
		jumpRiseTime = 0.33,
		jumpRiseEase = "pulse",
		jumpClickSquashTime = 0.24,
		class: className,
		style,
		"aria-label": ariaLabel,
		"aria-hidden": ariaHidden,
		onclick: userClick,
		...rest
	}: AgentAvatarProps = $props();

	const shapePath = (t: BotAvatarType) => SHAPE_PATHS[t] ?? SHAPE_PATHS.clover;

	const uid = nextUid();

	/* The avatar draws at 75% of its slot so an idle jump has room in the box
     and never clips. A numeric `size` overrides the measurement. */
	const JUMP_CLEARANCE = 0.75;
	let hostEl = $state<HTMLElement | null>(null);
	let hostWidth = $state(0);
	const drawnSize = $derived(
		typeof size === "number" ? size : hostWidth > 0 ? hostWidth * JUMP_CLEARANCE : 0,
	);

	const type = $derived(shape);
	const preset = $derived(botAvatarPresets[type] ?? botAvatarPresets.clover);
	const faceKind = $derived(face ?? preset.face);
	const picked = $derived(color ?? preset.color);
	const brightness = $derived(brightnessProp ?? preset.brightness ?? 1);
	const saturation = $derived(saturationProp ?? preset.saturation ?? 1.5);
	const vivid = $derived(clamp(saturation, 1.5, 2.5) - 1.5);
	const body = $derived(
		richer(
			brightness === 1 && saturation === 1
				? picked
				: shade(
						picked,
						(Math.min(2, Math.max(0, brightness)) - 1) * 0.35,
						(Math.min(1.5, Math.max(0, saturation)) - 1) * 0.5,
					),
			vivid,
		),
	);
	const inkColor = $derived(ink ?? inkFor(body));
	const seedValue = $derived(Math.min(1, Math.max(0, seed ?? hashSeed(uid))));
	const stateKey = $derived((botState in stateLabels ? botState : "default") as BotAvatarState);
	const frozen = $derived(paused || !(speed > 0));
	const shadingMode = $derived(
		(shading === true ? "crisp" : shading === false ? "flat" : shading) as BotAvatarShading,
	);
	const customPath = $derived(typeof path === "string" && path.trim() ? path.trim() : null);
	const outlineKey = $derived(
		customPath ? `path:${hashSeed(customPath)}:${customPath.length}` : type,
	);
	const lit = $derived(LIGHT_DEFAULTS[shadingMode === "fabric" ? "fabric" : "other"]);
	const fur = $derived({
		length: q(furLength, 0.3, 2.5),
		density: q(furDensity, 0.3, 2),
		fuzz: q(furFuzz, 0, 1),
		clumps: q(furClumps, 0, 1),
		curl: q(furCurl, 0, 1),
		gravity: q(furGravity, 0, 1),
	} satisfies FurStyle);
	const material = $derived(shadingMode === "plastic" || shadingMode === "fabric");
	const lookKey = $derived(`${shadingMode}|${outlineKey}|${Math.round(drawnSize)}`);
	/* What the bakes depend on, as strings, so the warm effect re-runs only
     when one of them changes, not on every prop or every resized pixel. */
	const warmSize = $derived(Math.round(drawnSize));
	const furKey = $derived(
		`${fur.length}|${fur.density}|${fur.fuzz}|${fur.clumps}|${fur.curl}|${fur.gravity}`,
	);
	const interactiveNow = $derived(interactive && !heldPose);

	/* Captured once, on purpose: `shown` never returns to false, so a later
     shading change must not reset it. */
	function beginsMaterial() {
		return shading === "plastic" || shading === "fabric";
	}

	function partsFor(t: BotAvatarType) {
		return !customPath && SHAPE_PARTS[t] ? partPaths(SHAPE_PARTS[t] as string) : undefined;
	}

	function configure(): DrawConfig {
		return {
			path: bodyPath(customPath ?? shapePath(type)),
			face: faceKind,
			faceX: preset.faceX,
			faceY: preset.faceY,
			faceScale: preset.faceScale,
			color: body,
			ink: inkColor,
			shading: shadingMode,
			shadow: clampOpt(shadow, lit.shadow, 0, 2),
			highlight: clampOpt(highlight, lit.highlight, 0, 2),
			depth: clamp(depth, 0.2, 2),
			roundness: clamp(roundness, 0, 1),
			fur,
			vivid,
			backLight,
			lightFront,
			shine,
			sheen,
			backSoftness,
			light: light ?? lit.light,
			rim: clampOpt(rim, lit.rim, 0, 2),
			spread: clampOpt(spread, lit.spread, 0.4, 2.5),
			typeKey: outlineKey,
			still: frozen || reducedMotion(),
			furOnIdle: true,
			whirl: {
				strength: clamp(whirl, 0, 2),
				size: clamp(whirlSize, 0.6, 1.6),
				width: clamp(whirlWidth, 0.4, 2),
				length: clamp(whirlLength, 0.4, 1.6),
				tilt: clamp(whirlTilt, 0.5, 1.8),
			},
			parts: partsFor(type),
			wear: {
				hat,
				glasses,
				headphones,
				bowTie,
				color: accessoryColor,
				fabric: shadingMode === "fabric",
			},
		};
	}

	const cfg = $derived(configure());

	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let sim: Sim | null = null;
	let cssSize = 0;
	let lastLook: string | null = null;

	let shown = $state(!beginsMaterial());
	let shownRef = !beginsMaterial();
	function markShown() {
		shownRef = true;
		shown = true;
	}

	let stillPaint: (() => void) | null = null;
	let waiting: (() => void) | null = null;
	let watch: (() => void) | null = null;
	let showPaint: (() => void) | null = null;
	let ready = false;
	let holding: (() => void) | null = null;
	const meRef = {};

	const resolveTheme = (el: HTMLElement | null) => themeOf(theme, el);

	function layoutPx(canvas: HTMLCanvasElement) {
		return canvas.clientWidth / OVERSCAN || cssSize || drawnSize || 64;
	}

	function poseFor(rest0: ReturnType<typeof restPose>) {
		const held = heldPose;
		if (held)
			return {
				...rest0,
				yaw: held.yaw ?? 0,
				pitch: held.pitch ?? rest0.pitch,
				roll: held.roll ?? rest0.roll,
			};
		return sim ? sim.pose : rest0;
	}

	function paint() {
		const canvas = canvasEl;
		const c = cfg;
		if (!canvas || !c?.path) return;
		const px = layoutPx(canvas);
		if (!px) return;
		const dpr = deviceDpr();
		const want = Math.round(px * OVERSCAN * dpr);
		if (canvas.width !== want || canvas.height !== want) {
			canvas.width = want;
			canvas.height = want;
		}
		cssSize = px;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		c.dpr = dpr;
		draw(ctx, px, poseFor(restPose(stateKey)), c);
	}

	function paintStill() {
		const canvas = canvasEl;
		const c = cfg;
		if (!canvas || !c?.path) return;
		const px = layoutPx(canvas);
		if (!px) return;
		cssSize = px;
		const dpr = deviceDpr();
		canvas.width = canvas.height = Math.round(px * OVERSCAN * dpr);
		const ctx = canvas.getContext("2d");
		if (ctx) {
			c.theme = resolveTheme(canvas);
			c.dpr = dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			draw(ctx, px, restPose(stateKey), c);
		}
	}

	function stopWaiting() {
		if (waiting) waiting();
		waiting = null;
	}

	function settle(paintNow: () => void) {
		takeMissed();
		paintNow();
		if (!takeMissed()) stopWaiting();
		else if (!waiting)
			waiting = onLanded(() => {
				const p = stillPaint;
				if (canvasEl && p) settle(p);
				else stopWaiting();
			});
	}

	function stopWatch() {
		if (watch) watch();
		watch = null;
	}

	function showWhenBaked(paintNow: () => void) {
		showPaint = paintNow;
		/* No canvas means nothing was drawn, so nothing could report a missed
       bake. Calling that ready would skip the fade. */
		if (!canvasEl) return;
		takeMissed();
		paintNow();
		ready = !takeMissed();
		if (ready && !bakesPending()) {
			showReady();
			return;
		}
		if (!watch)
			watch = onLanded(() => {
				const p = showPaint;
				if (canvasEl && p && !shownRef) showWhenBaked(p);
				else stopWatch();
				showReady();
			});
	}

	function warm() {
		if (!material || !cfg?.path) return;
		const c = cfg;
		const dev = (drawnSize || 64) * deviceDpr();
		const lightAt = c.light ?? 295;
		const lights = lightsFor(lightAt, backLight, lightFront);
		warmPlastic(outlineKey, c.path, dev, depth, shadingMode === "fabric", fur, lightAt, lights);
	}

	function hold() {
		warm();
		if (!bakesPending()) return;
		hurry(true);
		const release = () => {
			if (!holding) return;
			holding();
			holding = null;
			applyPose();
		};
		const off = onLanded(() => {
			if (!bakesPending()) release();
		});
		const t = setTimeout(release, SHOW_WITHIN);
		holding = () => {
			off();
			clearTimeout(t);
			hurry(false);
		};
	}

	function handleClick(e: MouseEvent) {
		if (interactive && !frozen && !heldPose) sim?.poke();
		userClick?.(e);
	}

	onMount(() => () => {
		stopWaiting();
		holding?.();
		holding = null;
	});

	function shouldHold() {
		return shownRef && material && lastLook !== null && lastLook !== lookKey && !holding;
	}

	function applyPose() {
		if (holding) return;
		if (reducedMotion()) {
			stillPaint = paintStill;
			if (shownRef) settle(paintStill);
			else showWhenBaked(paintStill);
			return;
		}
		if (canvasEl) {
			const c = cfg;
			if (c) c.theme = resolveTheme(canvasEl);
		}
		if (!shownRef) {
			stillPaint = frozen ? paint : null;
			showWhenBaked(paint);
		} else if (frozen) {
			stillPaint = paint;
			settle(paint);
		} else {
			stillPaint = null;
			stopWaiting();
			paint();
		}
	}

	/* Sync the rig with the props on every meaningful change: this is the
     React `useLayoutEffect` (which ran each render) made reactive. */
	$effect(() => {
		/* Until the slot is measured there's no canvas to draw on. */
		if (drawnSize <= 0) return;
		if (!sim) sim = new Sim(seedValue, stateKey);
		else sim.setState(stateKey);
		sim.setTurn(clamp(turn, 0, 2));
		if (shouldHold()) hold();
		lastLook = lookKey;
		sim.setJump({
			height: jumpHeight,
			time: Math.max(0.2, jumpTime),
			stretch: jumpStretch,
			spin: Math.max(0, Math.round(jumpSpin)),
			lean: jumpLean,
			every: jumpEvery,
			land: jumpLand,
			squash: jumpSquash,
			squashTime: Math.max(0.05, jumpSquashTime),
			squashEase: jumpSquashEase,
			groundTime: Math.max(0, jumpGroundTime),
			groundEase: jumpGroundEase,
			riseTime: Math.max(0.05, jumpRiseTime),
			riseEase: jumpRiseEase,
			clickSquashTime: Math.max(0.05, jumpClickSquashTime),
		});
		applyPose();
	});

	/* Register with the shared shown-gate so a row of baked avatars appears
     together, or after SHOW_WITHIN at the latest. */
	$effect(() => {
		if (shown) return;
		waiters.set(meRef, { ready: () => ready, show: markShown });
		showReady();
		hurry(true);
		const t = setTimeout(markShown, SHOW_WITHIN);
		return () => {
			hurry(false);
			clearTimeout(t);
			stopWatch();
			waiters.delete(meRef);
			showReady();
		};
	});

	/* Once shown, a paused or reduced-motion avatar draws only when asked, so
     it repaints here and keeps repainting as its bakes land. */
	$effect(() => {
		if (!shown) return;
		untrack(() => {
			if (canvasEl && drawnSize > 0) applyPose();
		});
	});

	$effect(() => {
		if (theme !== "auto") return;
		return onThemeChange(() => {
			if (canvasEl && drawnSize > 0) applyPose();
		});
	});

	/* Start the material's bakes on idle time as soon as the shape is known. */
	$effect(() => {
		void shadingMode;
		void outlineKey;
		void warmSize;
		void depth;
		void light;
		void backLight;
		void lightFront;
		void furKey;
		if (!material || !warmSize || !untrack(() => cfg?.path)) return;
		return warmIdle(warm);
	});

	function updatePointer(s: Sim, canvas: HTMLCanvasElement) {
		if (!interactiveNow || Number.isNaN(pointer.x)) {
			s.setPointer(0, 0, 0);
			return;
		}
		const r = canvas.getBoundingClientRect();
		const box = r.width / OVERSCAN || 1;
		const dx = (pointer.x - (r.left + r.width / 2)) / box;
		const dy = (pointer.y - (r.top + r.height / 2 + RISE * box)) / box;
		const d = Math.hypot(dx, dy);
		s.setPointer(dx / Math.max(1, d), dy / Math.max(1, d), pointerStrength(d));
	}

	/* The loop, only while visible, animated and not reduced. */
	$effect(() => {
		if (frozen || reducedMotion()) return;
		const canvas = canvasEl;
		if (!canvas) return;
		let unsub: (() => void) | null = null;
		const tick = (dt: number) => {
			const s = sim;
			if (!s) return;
			updatePointer(s, canvas);
			s.update(dt * speed);
			if (shownRef && !holding) paint();
		};
		const run = () => {
			if (!unsub) unsub = subscribe(tick);
		};
		const stop = () => {
			if (unsub) unsub();
			unsub = null;
		};
		let io: IntersectionObserver | null = null;
		if (typeof IntersectionObserver === "function") {
			io = new IntersectionObserver((entries) => {
				if (entries[0]?.isIntersecting ?? true) run();
				else stop();
			});
			io.observe(canvas);
		} else run();
		return () => {
			stop();
			if (io) io.disconnect();
		};
	});

	const canvasStyle = $derived.by(() => {
		const s = drawnSize || 64;
		const dim = `${s * OVERSCAN}px`;
		const side = (OVERSCAN - 1) / 2;
		const pull = (k: number) => `${-s * k}px`;
		return (
			`display:inline-block;vertical-align:middle;width:${dim};height:${dim};` +
			`margin-left:${pull(side)};margin-right:${pull(side)};` +
			`margin-top:${pull(side + RISE)};margin-bottom:${pull(side - RISE)};` +
			`flex:none;opacity:${shown ? 1 : 0};transition:opacity 0.3s ease-out`
		);
	});

	/* No box: the slot carries no border, background or padding. Without an
     explicit size it stays square, and the avatar fills three quarters of it. */
	const hostStyle = $derived.by(() => {
		const base =
			size === undefined
				? "display:inline-grid;place-items:center;line-height:0;width:100%;aspect-ratio:1/1;"
				: "display:inline-block;line-height:0;";
		return style ? `${base}${style}` : base;
	});

	onMount(() => {
		if (!hostEl) return;
		/* A hidden parent (a closed tab or panel) reports 0. Keep the last width
       so the canvas, its picture and its gate survive being hidden. */
		const observer = new ResizeObserver(([entry]) => {
			if (entry && entry.contentRect.width > 0) hostWidth = entry.contentRect.width;
		});
		observer.observe(hostEl);
		return () => observer.disconnect();
	});

	export function getCanvas(): HTMLCanvasElement | null {
		return canvasEl;
	}
</script>

<span
	bind:this={hostEl}
	class={className ? `agent-avatar ${className}` : "agent-avatar"}
	style={hostStyle}
	data-agent-shape={type}
>
	{#if drawnSize > 0}
		<canvas
			bind:this={canvasEl}
			data-bot-avatar={type}
			data-face={faceKind}
			data-state={stateKey}
			role={ariaHidden ? undefined : "img"}
			aria-hidden={ariaHidden ? "true" : undefined}
			aria-label={ariaHidden
				? undefined
				: (ariaLabel ??
					(name
						? `${name}${role ? `, ${role}` : ""}`
						: `${preset.label} agent, ${stateLabels[stateKey]}`))}
			style={canvasStyle}
			onclick={handleClick}
			{...rest}
		></canvas>
	{/if}
</span>
