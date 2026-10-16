<!-- ========================== -->
<!-- IMPORTS                    -->
<!-- ========================== -->
<script lang="ts">
	import { untrack } from "svelte";
	import { swapText } from "#src/animations/text-swap.js";
	import Bell from "@lucide/svelte/icons/bell";
	import Info from "@lucide/svelte/icons/info";
	import Menu from "@lucide/svelte/icons/menu";
	import X from "@lucide/svelte/icons/x";
	import ShowcaseStage from "#src/showcase/ShowcaseStage.svelte";
	import chevronArms from "#src/showcase/chevron-arms.svg?raw";
	import chevronDown from "#src/showcase/chevron-down.svg?raw";
	import heart from "#src/showcase/heart.svg?raw";
	import plus from "#src/showcase/plus.svg?raw";
	import successCheck from "#src/showcase/success-check.svg?raw";

	// =========================
	// CONST
	// =========================
	const CLEAR_TEXT = "project deadline";

	// =========================
	// STATE
	// =========================
	let target = null;
	const phrases = [
		"Build the system.",
		"Ship the route.",
		"Verify the output.",
		"Repeat tomorrow.",
	];
	let cursor = 0;

	let digitGroup = null;
	let digitAnimating = $state(false);
	let digitValue = $state("1234");

	let resizeSmall = $state(false);
	let badgeOpen = $state(true);
	let badgeCount = $state(3);
	let activePage = $state<"1" | "2">("1");

	let modalOpen = $state(true);
	let dropdownOpen = $state(true);
	let panelOpen = $state(true);
	let iconState = $state<"a" | "b">("a");

	let checkEl = null;

	let avatarRoot = null;
	// Dummy team members so the hover-lift reads as a real avatar stack.
	const avatars = [
		{ initials: "RK", hue: 24 },
		{ initials: "KA", hue: 158 },
		{ initials: "AM", hue: 268 },
		{ initials: "MT", hue: 334 },
		{ initials: "ZL", hue: 200 },
	];

	let shakeWrap = null;
	let shakeInput = null;
	let shakeRevert;

	let clearWrap = null;
	let clearInput = null;
	let clearMirror = null;
	let clearPhold = null;
	let clearGlow = null;
	let clearBusy = false;

	let skelEl = null;
	let skelSkeleton = null;

	let tabsBar = null;
	let tabsPill = null;
	const tabs = ["Plan", "Debug", "Ask"];
	let activeTab = $state(0);

	let staggerEl = null;

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		const checkPath = checkEl?.querySelector("path");
		if (!checkPath) return;
		const len = Math.ceil(checkPath.getTotalLength());
		checkPath.style.strokeDasharray = String(len);
		checkPath.style.strokeDashoffset = String(len);
	});

	$effect(() => {
		untrack(() => positionTabsPill(false));
		const onResize = () => untrack(() => positionTabsPill(false));
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	});

	// =========================
	// FUNCTIONS
	// =========================
	function cssNum(name: string, fallback: number) {
		const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
		return Number.isFinite(v) ? v : fallback;
	}
	function nextPhrase() {
		if (!target) return;
		cursor = (cursor + 1) % phrases.length;
		swapText(target, phrases[cursor]);
	}

	function replayDigits() {
		if (!digitGroup) return;
		digitAnimating = false;
		digitValue = String(Math.floor(1000 + Math.random() * 8999));
		// WHY: force reflow so removing+re-adding .is-animating restarts the keyframes
		void digitGroup.offsetWidth;
		digitAnimating = true;
	}

	function bumpBadge() {
		badgeOpen = false;
		setTimeout(() => {
			badgeCount += 1;
			badgeOpen = true;
		}, 220);
	}

	function togglePage() {
		activePage = activePage === "1" ? "2" : "1";
	}

	function replayCheck() {
		if (!checkEl) return;
		checkEl.setAttribute("data-state", "out");
		// WHY: force reflow so the appear keyframes restart from offset 0
		void checkEl.offsetWidth;
		checkEl.setAttribute("data-state", "in");
	}

	function liftAvatars(activeIdx: number | null) {
		if (!avatarRoot) return;
		const lift = cssNum("--avatar-lift", -4);
		const falloff = cssNum("--avatar-falloff", 0.45);
		const scale = cssNum("--avatar-scale", 1.05);
		const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
		avatarRoot.querySelectorAll(".t-avatar").forEach((el, i) => {
			el.style.transitionTimingFunction = ease;
			if (activeIdx === null) {
				el.style.setProperty("--shift", "0px");
				el.style.setProperty("--scale-active", "1");
				return;
			}
			const d = Math.abs(i - activeIdx);
			el.style.setProperty("--shift", `${(lift * Math.pow(falloff, d)).toFixed(3)}px`);
			el.style.setProperty("--scale-active", i === activeIdx ? String(scale) : "1");
		});
	}

	function showError() {
		if (!shakeWrap || !shakeInput) return;
		shakeWrap.classList.add("is-error");
		shakeInput.classList.add("is-error");
		// Replay the shake from a clean baseline.
		shakeInput.classList.remove("is-shaking");
		void shakeInput.offsetWidth;
		shakeInput.classList.add("is-shaking");
		const shakeMs = cssNum("--shake-dur-a", 80) * 2 + cssNum("--shake-dur-b", 60) * 2;
		setTimeout(() => shakeInput?.classList.remove("is-shaking"), shakeMs + 20);
		if (shakeRevert) clearTimeout(shakeRevert);
		const hold = cssNum("--revert-hold", 3000);
		shakeRevert = setTimeout(() => {
			shakeWrap?.classList.remove("is-error");
			shakeInput?.classList.remove("is-error");
		}, shakeMs + hold);
	}

	// Minimal cubic-bezier sampler so the JS easing matches the CSS curves.
	function cubicBezier(str: string) {
		const m = str.match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
		if (!m) return (t: number) => t;
		const [x1, y1, x2, y2] = m.slice(1).map(Number);
		const cx = 3 * x1;
		const bx = 3 * (x2 - x1) - cx;
		const ax = 1 - cx - bx;
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		const ay = 1 - cy - by;
		return (t: number) => {
			if (t <= 0) return 0;
			if (t >= 1) return 1;
			let s = t;
			for (let i = 0; i < 8; i++) {
				const dx = ((ax * s + bx) * s + cx) * s - t;
				const d = (3 * ax * s + 2 * bx) * s + cx;
				if (Math.abs(dx) < 1e-6 || d === 0) break;
				s -= dx / d;
			}
			return ((ay * s + by) * s + cy) * s;
		};
	}

	function buildClearGlow(text: string, isDark: boolean) {
		if (!clearInput || !clearWrap) return "";
		const ctx = document.createElement("canvas").getContext("2d");
		if (!ctx) return "";
		ctx.font = getComputedStyle(clearInput).font;
		const rgb = isDark ? "255,255,255" : "0,0,0";
		const w = clearWrap.clientWidth || 280;
		const padLeft = parseFloat(getComputedStyle(clearInput).paddingLeft) || 12;
		const spread = cssNum("--glow-spread", 1.5);
		const layers: string[] = [];
		let x = 0;
		text.split(/(\s+)/).forEach((seg) => {
			const segW = ctx.measureText(seg).width;
			if (seg.trim()) {
				const cx = padLeft + x + segW / 2;
				const hw = Math.max(segW * 0.45, 8) * spread;
				(
					[
						[0, 0.8, 7, 0.22],
						[hw * 0.45, 0.55, 8, 0.18],
						[-hw * 0.4, 0.65, 6, 0.16],
						[hw * 0.15, 0.9, 5, 0.14],
					] as const
				).forEach(([dx, rwm, rh, a]) => {
					const lx = (((cx + dx) / w) * 100).toFixed(2);
					layers.push(
						`radial-gradient(ellipse ${Math.max(hw * rwm, 2).toFixed(1)}px ${rh}px at ${lx}% 100%, rgba(${rgb},${a}), transparent)`,
					);
				});
			}
			x += segW;
		});
		return layers.join(", ");
	}

	function triggerClear() {
		if (clearBusy || !clearWrap || !clearInput || !clearMirror || !clearPhold || !clearGlow) return;
		// Repeatable demo: an empty field refills instantly instead of clearing.
		if (!clearInput.value) {
			clearInput.value = CLEAR_TEXT;
			clearMirror.textContent = CLEAR_TEXT;
			clearWrap.classList.add("has-value");
			return;
		}
		clearBusy = true;
		const isDark = !document.documentElement.classList.contains("light");
		const total = cssNum("--clear-dur", 1000);
		const outDur = cssNum("--clear-out-dur", 400);
		const inDur = cssNum("--clear-in-dur", 400);
		const outFly = cssNum("--clear-out-fly", 12);
		const inFly = cssNum("--clear-in-fly", 12);
		const blur = cssNum("--clear-blur", 2);
		const delay = cssNum("--glow-delay", 50);
		const peakAt = cssNum("--glow-peak-at", 0.15);
		const gOp = isDark ? 0.85 : cssNum("--glow-opacity", 0.42);
		const cs = getComputedStyle(document.documentElement);
		const easeOut = cubicBezier(cs.getPropertyValue("--clear-out-ease"));
		const easeIn = cubicBezier(cs.getPropertyValue("--clear-in-ease"));

		const text = clearInput.value;
		clearMirror.textContent = text;
		clearInput.value = "";
		clearWrap.classList.remove("has-value");
		clearWrap.classList.add("is-clearing");
		clearGlow.style.mixBlendMode = isDark ? "screen" : "multiply";
		clearGlow.style.background = buildClearGlow(text, isDark);
		clearGlow.style.opacity = "0";
		clearPhold.style.transform = `translateY(-${inFly}px)`;
		clearPhold.style.opacity = "0.9";
		clearPhold.style.filter = `blur(${blur}px)`;

		const start = performance.now();
		const tick = (now: number) => {
			if (!clearWrap || !clearMirror || !clearPhold || !clearGlow) return;
			const el = now - start;
			const eo = easeOut(Math.min(1, el / outDur));
			clearMirror.style.transform = `translateY(${(eo * outFly).toFixed(1)}px)`;
			clearMirror.style.opacity = (1 - eo).toFixed(3);
			clearMirror.style.filter = `blur(${(eo * blur).toFixed(1)}px)`;

			const ei = easeIn(Math.min(1, el / inDur));
			clearPhold.style.transform = `translateY(${(-inFly + ei * inFly).toFixed(1)}px)`;
			clearPhold.style.opacity = (0.9 + ei * 0.1).toFixed(3);
			clearPhold.style.filter = `blur(${(blur - ei * blur).toFixed(1)}px)`;

			let g = 0;
			if (el > delay) {
				const gp = Math.min(1, (el - delay) / Math.max(1, total - delay));
				g = gp < peakAt ? gp / peakAt : 1 - (gp - peakAt) / (1 - peakAt);
			}
			clearGlow.style.opacity = (g * gOp).toFixed(3);

			if (el < total) {
				requestAnimationFrame(tick);
			} else {
				clearWrap.classList.remove("is-clearing");
				clearMirror.style.cssText = "";
				clearPhold.style.cssText = "";
				clearMirror.textContent = "";
				clearGlow.style.opacity = "0";
				clearGlow.style.background = "";
				clearBusy = false;
			}
		};
		requestAnimationFrame(tick);
	}

	function replaySkeleton() {
		if (!skelEl || !skelSkeleton) return;
		skelEl.classList.add("is-resetting");
		skelEl.classList.remove("is-revealed");
		skelSkeleton.classList.remove("is-pulsing");
		void skelSkeleton.offsetWidth;
		skelEl.classList.remove("is-resetting");
		skelSkeleton.classList.add("is-pulsing");
		const total = cssNum("--pulse-dur", 1000) * cssNum("--pulse-count", 1);
		setTimeout(() => skelEl?.classList.add("is-revealed"), total);
	}

	function positionTabsPill(animate: boolean) {
		if (!tabsBar || !tabsPill) return;
		const tab = tabsBar.querySelectorAll(".t-tab")[activeTab];
		if (!tab) return;
		if (animate) {
			tabsPill.style.transform = `translateX(${tab.offsetLeft}px)`;
			tabsPill.style.width = `${tab.offsetWidth}px`;
		} else {
			const prev = tabsPill.style.transition;
			tabsPill.style.transition = "none";
			tabsPill.style.transform = `translateX(${tab.offsetLeft}px)`;
			tabsPill.style.width = `${tab.offsetWidth}px`;
			void tabsPill.offsetWidth;
			tabsPill.style.transition = prev;
		}
	}

	function selectTab(i: number) {
		activeTab = i;
		positionTabsPill(true);
	}

	function replayStagger() {
		if (!staggerEl) return;
		staggerEl.classList.remove("is-hiding");
		staggerEl.classList.remove("is-shown");
		void staggerEl.offsetHeight;
		staggerEl.classList.add("is-shown");
	}

	// =========================
	// THE NINE THE SECTION USED TO SKIP
	// =========================
	// Four are pure CSS. The rest carry the small JS each upstream usage note
	// calls for; the markup follows `.upstream/transitions/<slug>.css`.
	let accOpen = $state(true);
	let morphOpen = $state(false);
	let liked = $state(false);
	let bursting = $state(false);

	let tiltEl = null;
	let tiltCard = null;
	let reelEl = null;
	let streamEl = null;
	let reasonScroll = null;
	let thinkEl = null;

	const STREAM_TEXT =
		"The parser reads the diff, keeps the hunks it can apply, and hands the rest back with a reason.";
	const THINK_STATES = ["Thinking...", "Reading the repository...", "Drafting the patch..."];
	const REASON_LINES = [
		"Checking the lockfile for a version that moved.",
		"Two primitives changed upstream since the last sync.",
		"One of them is retuned here, so it stays ours.",
		"Writing the other and formatting what landed.",
	];

	function tiltMove(event: PointerEvent) {
		const rect = tiltEl.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width;
		const y = (event.clientY - rect.top) / rect.height;
		tiltCard.classList.add("is-tilting");
		tiltEl.classList.add("is-hover");
		tiltEl.style.setProperty("--tilt-rx", `${(0.5 - y) * 14}deg`);
		tiltEl.style.setProperty("--tilt-ry", `${(x - 0.5) * 14}deg`);
		tiltEl.style.setProperty("--tilt-gx", `${x * 100}%`);
		tiltEl.style.setProperty("--tilt-gy", `${y * 100}%`);
	}

	function tiltLeave() {
		tiltCard.classList.remove("is-tilting");
		tiltEl.classList.remove("is-hover");
		tiltEl.style.setProperty("--tilt-rx", "0deg");
		tiltEl.style.setProperty("--tilt-ry", "0deg");
	}

	// A spray nobody can predict: every dot takes its own angle, distance and
	// clock, which is what keeps two likes from looking like one animation.
	function toggleLike(event: MouseEvent) {
		liked = !liked;
		if (!liked) return;
		const root = event.currentTarget as HTMLElement;
		for (const dot of root.querySelectorAll<HTMLElement>(".t-like-particles i")) {
			const angle = Math.random() * Math.PI * 2;
			const dist = 14 + Math.random() * 14;
			dot.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
			dot.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
			dot.style.setProperty("--pdur", `${480 + Math.random() * 240}ms`);
			dot.style.setProperty("--pdelay", `${Math.random() * 60}ms`);
			dot.style.setProperty("--psize", `${0.7 + Math.random() * 0.8}`);
		}
		bursting = false;
		void root.offsetHeight;
		bursting = true;
		setTimeout(() => (bursting = false), 700);
	}

	/** One column per digit, each clipping a 0-9 strip it spins past. */
	function spinReel(value = "482") {
		reelEl.replaceChildren();
		value.split("").forEach((digit, index) => {
			const col = document.createElement("div");
			col.className = "t-reel-col";
			const strip = document.createElement("div");
			strip.className = "t-reel-strip";
			for (let n = 0; n < 30; n++) {
				const cell = document.createElement("div");
				cell.className = "t-reel-digit";
				cell.textContent = String(n % 10);
				strip.append(cell);
			}
			col.append(strip);
			reelEl.append(col);
			const cells = 20 + Number(digit);
			strip.style.transform = "translateY(0)";
			strip.style.filter = "blur(0px)";
			void strip.offsetHeight;
			strip.style.transition = `transform var(--reel-dur) var(--reel-ease) ${index * 90}ms, filter var(--reel-dur) linear ${index * 90}ms`;
			strip.style.transform = `translateY(calc(var(--reel-cell) * -${cells}))`;
		});
	}

	/** Wrap each word once, then let them in one --stream-gap apart. */
	function replayStream() {
		const words = streamEl.querySelectorAll<HTMLElement>(".t-stream-w");
		for (const word of words) {
			word.style.transition = "none";
			word.classList.remove("is-in");
		}
		void streamEl.offsetHeight;
		words.forEach((word, index) => {
			word.style.transition = "";
			setTimeout(() => word.classList.add("is-in"), index * 60);
		});
	}

	// The two that run on their own: a transcript stepping up while a model
	// thinks, and the line under it swapping state.
	$effect(() => {
		if (!reasonScroll || !thinkEl) return;
		replayStream();
		spinReel();

		let offset = 0;
		const step = setInterval(() => {
			offset = (offset + 2) % REASON_LINES.length;
			reasonScroll.style.transition = "transform var(--reason-step) var(--reason-ease)";
			reasonScroll.style.transform = `translateY(calc(var(--reason-line) * -${offset}))`;
		}, 840);

		let state = 0;
		const swap = setInterval(() => {
			state = (state + 1) % THINK_STATES.length;
			thinkEl.classList.add("is-exit");
			setTimeout(() => {
				thinkEl.textContent = THINK_STATES[state];
				thinkEl.dataset.text = THINK_STATES[state];
				thinkEl.classList.remove("is-exit");
				thinkEl.classList.add("is-enter-start");
				void thinkEl.offsetHeight;
				thinkEl.classList.remove("is-enter-start");
			}, 200);
		}, 2000);

		return () => {
			clearInterval(step);
			clearInterval(swap);
		};
	});
</script>

<!-- ========================== -->
<!-- MARKUP                     -->
<!-- ========================== -->
<div class="grid">
	<ShowcaseStage
		title="Text states swap"
		note="Text swap with translate and blur"
		importPath={"import { swapText } from '@heyramzi/ui/animations/text-swap';"}
		onaction={nextPhrase}
	>
		<span bind:this={target} class="phrase">{phrases[0]}</span>
	</ShowcaseStage>

	<ShowcaseStage
		title="Number pop-in"
		note="Digit flip with blur and stagger"
		importPath={"import '@heyramzi/ui/animations/digit-pop-in.css';"}
		onaction={replayDigits}
	>
		<span
			bind:this={digitGroup}
			class="t-digit-group digit-display"
			class:is-animating={digitAnimating}
		>
			{#each digitValue.split("") as ch, i (i + ch)}
				<span class="t-digit" data-stagger={i}>{ch}</span>
			{/each}
		</span>
	</ShowcaseStage>

	<ShowcaseStage
		title="Card resize"
		note="Smooth width and height transition"
		importPath={"import '@heyramzi/ui/animations/resize.css';"}
		onaction={() => (resizeSmall = !resizeSmall)}
	>
		<div class="t-resize sk-card" class:is-small={resizeSmall}>
			<span class="sk sk-1"></span>
			<span class="sk sk-2"></span>
			<span class="sk sk-3"></span>
			<span class="sk sk-4"></span>
			<span class="sk sk-5"></span>
			<span class="sk sk-6"></span>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Notification badge"
		note="Diagonal slide with spring pop-in"
		importPath={"import '@heyramzi/ui/animations/notification-badge.css';"}
		onaction={bumpBadge}
	>
		<button type="button" class="bell-trigger" onclick={bumpBadge} aria-label="Notifications">
			<Bell class="size-5" />
			<span class="t-badge" data-open={badgeOpen ? "true" : "false"}>
				<span class="t-badge-dot">{badgeCount}</span>
			</span>
		</button>
	</ShowcaseStage>

	<ShowcaseStage
		title="Modal open / close"
		note="Scale and blur transition"
		importPath={"import '@heyramzi/ui/animations/modal.css';"}
		onaction={() => (modalOpen = !modalOpen)}
	>
		<div class="t-modal sk-modal" class:is-open={modalOpen}>
			<div class="sk sk-mtitle"></div>
			<div class="sk sk-mclose"></div>
			<div class="sk sk-line full"></div>
			<div class="sk sk-line full"></div>
			<div class="sk sk-line three-q"></div>
			<div class="sk-pills">
				<div class="sk sk-pill"></div>
				<div class="sk sk-pill"></div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Menu dropdown"
		note="Origin-aware open and close"
		importPath={"import '@heyramzi/ui/animations/dropdown.css';"}
		onaction={() => (dropdownOpen = !dropdownOpen)}
	>
		<div class="dropdown-stack">
			<div class="sk-trigger"></div>
			<div class="t-dropdown sk-dropdown" class:is-open={dropdownOpen}>
				<div class="sk sk-row full"></div>
				<div class="sk sk-row three-q"></div>
				<div class="sk sk-row half"></div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Panel reveal"
		note="Translate and blur entrance"
		importPath={"import '@heyramzi/ui/animations/panel.css';"}
		onaction={() => (panelOpen = !panelOpen)}
	>
		<div class="panel-clip">
			<div class="t-panel-slide sk-panel" data-open={panelOpen ? "true" : "false"}>
				<div class="sk sk-line full"></div>
				<div class="sk sk-line three-q"></div>
				<div class="sk-tiles">
					<div class="sk sk-tile"></div>
					<div class="sk sk-tile"></div>
					<div class="sk sk-tile"></div>
					<div class="sk sk-tile"></div>
				</div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Page side-by-side"
		note="Forward and back page slide"
		importPath={"import '@heyramzi/ui/animations/page-side-by-side.css';"}
		actionLabel={activePage === "1" ? "Next" : "Back"}
		onaction={togglePage}
	>
		<div class="t-page-slide sk-page-stage" data-page={activePage}>
			<section class="t-page sk-page" data-page-id="1">
				<div class="sk sk-row full"></div>
				<div class="sk sk-row three-q"></div>
				<div class="sk sk-row half"></div>
			</section>
			<section class="t-page sk-page sk-page-2" data-page-id="2">
				<div class="sk-amount">$10</div>
				<div class="sk-pill-row">
					<div class="sk sk-mini-pill"></div>
					<div class="sk sk-mini-pill"></div>
					<div class="sk sk-mini-pill"></div>
				</div>
			</section>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Icon swap"
		note="Crossfade with blur between icons"
		importPath={"import '@heyramzi/ui/animations/icon-swap.css';"}
		onaction={() => (iconState = iconState === "a" ? "b" : "a")}
	>
		<div class="t-icon-swap icon-stack" data-state={iconState}>
			<div class="t-icon" data-icon="a"><Menu class="size-7" /></div>
			<div class="t-icon" data-icon="b"><X class="size-7" /></div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Success check"
		note="Fade, rotate, bob, and stroke draw"
		importPath={"import '@heyramzi/ui/animations/success-check.css';"}
		onaction={replayCheck}
	>
		<div class="check-badge">
			<span bind:this={checkEl} class="t-success-check" data-state="in" aria-hidden="true">
				{@html successCheck}
			</span>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Avatar group hover"
		note="Distance falloff lift with spring return"
		importPath={"import '@heyramzi/ui/animations/avatar-group-hover.css';"}
	>
		<div
			bind:this={avatarRoot}
			class="t-avatar-group avatar-row"
			role="group"
			aria-label="Team"
			onmouseleave={() => liftAvatars(null)}
		>
			{#each avatars as person, i (person.initials)}
				<div
					class="t-avatar avatar-chip"
					style="z-index: {avatars.length -
						i}; background: linear-gradient(145deg, hsl({person.hue} 52% 52%), hsl({person.hue} 56% 38%)); color: #fff;"
					onmouseenter={() => liftAvatars(i)}
				>
					{person.initials}
				</div>
			{/each}
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Error state shake"
		note="Percussive shake with auto-revert"
		importPath={"import '@heyramzi/ui/animations/input-shake.css';"}
		actionLabel="Submit"
		onaction={showError}
	>
		<div bind:this={shakeWrap} class="t-input-wrap shake-wrap">
			<div bind:this={shakeInput} class="t-input shake-input">name@email</div>
			<p class="t-error-msg shake-msg">Enter a valid email address.</p>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Input clear"
		note="Fly-out text with per-word streak"
		importPath={"import '@heyramzi/ui/animations/input-clear-dissolve.css';"}
		actionLabel="Clear"
		onaction={triggerClear}
	>
		<div bind:this={clearWrap} class="t-clear clear-field has-value">
			<input
				bind:this={clearInput}
				class="clear-input"
				type="text"
				value={CLEAR_TEXT}
				readonly
				aria-label="Search"
			/>
			<div bind:this={clearMirror} class="t-clear-mirror clear-text" aria-hidden="true">
				{CLEAR_TEXT}
			</div>
			<div
				bind:this={clearPhold}
				class="t-clear-placeholder clear-text clear-ph"
				aria-hidden="true"
			>
				Search
			</div>
			<div bind:this={clearGlow} class="t-clear-glow" aria-hidden="true"></div>
			<button type="button" class="t-clear-btn clear-x" onclick={triggerClear} aria-label="Clear">
				<X class="size-3.5" />
			</button>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Skeleton loader"
		note="Pulse, then cross-blur to content"
		importPath={"import '@heyramzi/ui/animations/skeleton-reveal.css';"}
		actionLabel="Reload"
		onaction={replaySkeleton}
	>
		<div bind:this={skelEl} class="t-skel skel-card is-revealed">
			<div bind:this={skelSkeleton} class="t-skel-skeleton skel-layer">
				<span class="sk skel-avatar"></span>
				<span class="skel-bars">
					<span class="sk skel-l1"></span>
					<span class="sk skel-l2"></span>
				</span>
			</div>
			<div class="t-skel-content skel-layer">
				<div class="skel-avatar-real">R</div>
				<div class="skel-lines">
					<div class="skel-name">Ramzi K.</div>
					<div class="skel-sub">Shipped 14 routes</div>
				</div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Shimmer text"
		note="Sweeping highlight on a loop"
		importPath={"import '@heyramzi/ui/animations/shimmer-text.css';"}
	>
		<span class="t-shimmer shimmer-demo" data-text="Generating response">Generating response</span>
	</ShowcaseStage>

	<ShowcaseStage
		title="Tabs sliding"
		note="Active pill slides between options"
		importPath={"import '@heyramzi/ui/animations/tabs-sliding.css';"}
	>
		<div bind:this={tabsBar} class="t-tabs tabs-demo" role="tablist" aria-label="View">
			<span bind:this={tabsPill} class="t-tabs-pill" aria-hidden="true"></span>
			{#each tabs as label, i (label)}
				<button
					type="button"
					class="t-tab"
					role="tab"
					aria-selected={i === activeTab}
					onclick={() => selectTab(i)}
				>
					{label}
				</button>
			{/each}
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Tooltip"
		note="Delayed fade-in, instant out"
		importPath={"import '@heyramzi/ui/animations/tooltip.css';"}
	>
		<span class="t-tt-wrap tt-demo">
			<button type="button" class="t-tt-trigger tt-trigger" aria-describedby="tt-anim">
				<Info class="size-5" />
			</button>
			<span class="t-tt tt-bubble" id="tt-anim" role="tooltip">Keyboard shortcuts</span>
		</span>
	</ShowcaseStage>

	<ShowcaseStage
		title="Texts reveal"
		note="Staggered blurred rise"
		importPath={"import '@heyramzi/ui/animations/texts-reveal.css';"}
		actionLabel="Replay"
		onaction={replayStagger}
	>
		<div bind:this={staggerEl} class="t-stagger stagger-demo is-shown">
			<strong class="t-stagger-line t-stagger-line--1 stagger-head">Ship with rhythm</strong>
			<span class="t-stagger-line t-stagger-line--2 stagger-sub"
				>Headline first, the rest follows.</span
			>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Accordion"
		note="Grid-row expand, no measured height"
		importPath={"import '@heyramzi/ui/animations/accordion.css';"}
	>
		<div class="t-acc acc-demo" data-open={accOpen ? "true" : "false"}>
			<button
				type="button"
				class="t-acc-head acc-head"
				aria-expanded={accOpen}
				onclick={() => (accOpen = !accOpen)}
			>
				Shipping details
				<span class="t-acc-chevron">
					{@html chevronDown}
				</span>
			</button>
			<div class="t-acc-panel">
				<div class="t-acc-panel-inner">
					<p class="acc-body">
						Standard delivery takes three to five days. Express arrives the next morning, tracked
						end to end.
					</p>
				</div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Card tilt"
		note="Pointer-tracked 3D tilt with a glare"
		importPath={"import '@heyramzi/ui/animations/card-tilt.css';"}
	>
		<div bind:this={tiltEl} class="t-tilt" onpointermove={tiltMove} onpointerleave={tiltLeave}>
			<div bind:this={tiltCard} class="t-tilt-card tilt-card">
				<strong>Pro</strong>
				<span class="tilt-price">39 EUR</span>
				<span class="tilt-note">Move the pointer across the card.</span>
				<div class="t-tilt-glare"></div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Learn more hover"
		note="Chevron shifts, its arms open"
		importPath={"import '@heyramzi/ui/animations/learn-more-hover.css';"}
	>
		<button type="button" class="t-learn learn-demo">
			Learn more
			<span class="t-learn-chevron">
				{@html chevronArms}
			</span>
		</button>
	</ShowcaseStage>

	<ShowcaseStage
		title="Like button"
		note="Heart fills, particles spray"
		importPath={"import '@heyramzi/ui/animations/like-button.css';"}
	>
		<button
			type="button"
			class="t-like like-demo"
			class:is-bursting={bursting}
			data-liked={liked ? "true" : "false"}
			aria-pressed={liked}
			onclick={toggleLike}
		>
			<span class="t-like-icon">
				{@html heart}
			</span>
			<span class="t-like-particles" aria-hidden="true">
				{#each { length: 8 } as _, i (i)}
					<i></i>
				{/each}
			</span>
			Like
		</button>
	</ShowcaseStage>

	<ShowcaseStage
		title="Plus menu morph"
		note="The button becomes the surface"
		importPath={"import '@heyramzi/ui/animations/plus-menu-morph.css';"}
	>
		<div class="morph-anchor">
			<div class="t-morph morph-demo" data-open={morphOpen ? "true" : "false"}>
				<div class="t-morph-menu morph-menu">
					<span>Duplicate</span>
					<span>Move to...</span>
					<span>Archive</span>
				</div>
				<button
					type="button"
					class="t-morph-plus morph-plus"
					aria-expanded={morphOpen}
					aria-label={morphOpen ? "Close menu" : "Open menu"}
					onclick={() => (morphOpen = !morphOpen)}
				>
					{@html plus}
				</button>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Spinning counter"
		note="One reel per digit, staggered landing"
		importPath={"import '@heyramzi/ui/animations/spinning-counter.css';"}
		onaction={() => spinReel(String(100 + Math.floor(Math.random() * 900)))}
	>
		<div bind:this={reelEl} class="t-reel reel-demo"></div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Streaming text"
		note="Word by word, opacity and blur"
		importPath={"import '@heyramzi/ui/animations/streaming-text.css';"}
		onaction={replayStream}
	>
		<p bind:this={streamEl} class="stream-demo">
			{#each STREAM_TEXT.split(" ") as word, i (i)}
				<span class="t-stream-w">{word}&nbsp;</span>
			{/each}
		</p>
	</ShowcaseStage>

	<ShowcaseStage
		title="Reasoning stream"
		note="A transcript stepping under a mask"
		importPath={"import '@heyramzi/ui/animations/reasoning-stream.css';"}
	>
		<div class="t-reason reason-demo">
			<div class="t-reason-viewport">
				<div bind:this={reasonScroll} class="t-reason-scroll">
					{#each [...REASON_LINES, ...REASON_LINES] as line, i (i)}
						<p class="reason-line">{line}</p>
					{/each}
				</div>
			</div>
		</div>
	</ShowcaseStage>

	<ShowcaseStage
		title="Thinking states"
		note="Shimmering line, swapped on a hold"
		importPath={"import '@heyramzi/ui/animations/thinking-states.css';"}
	>
		<span class="t-think think-demo" role="status">
			<span class="t-think-sizer" aria-hidden="true">Reading the repository...</span>
			<span bind:this={thinkEl} class="t-think-text" data-text="Thinking...">Thinking...</span>
		</span>
	</ShowcaseStage>
</div>

<!-- ========================== -->
<!-- STYLE                      -->
<!-- ========================== -->
<style>
	/* One demo per row, the rule ShowcaseSection states for `.sc-stack`. An
	   animation is read by watching it run, and a third-width stage clips it. */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;

		/* transitions.dev demo material mapped onto host tokens. Nothing defined
		   the names, so eleven of eighteen drew transparent until 10 Sep 2026.
		   Every value reads the app palette. */
		--td-material-bg: var(--color-card, var(--card));
		--td-material-shadow:
			0 0 0 1px color-mix(in oklab, var(--color-border, var(--border)) 80%, transparent),
			0 6px 18px -8px
				color-mix(in oklab, var(--color-foreground, var(--foreground)) 22%, transparent);
		--td-skeleton: color-mix(
			in oklab,
			var(--color-muted-foreground, var(--muted-foreground)) 22%,
			transparent
		);
		--td-stage-bg: var(--color-background, var(--background));
		--td-text: var(--color-foreground, var(--foreground));
		--td-text-subtle: var(--color-muted-foreground, var(--muted-foreground));
		--td-icon-color: var(--color-foreground, var(--foreground));
		--td-icon-color-muted: var(--color-muted-foreground, var(--muted-foreground));
		--td-copy-bg: color-mix(in oklab, var(--color-muted, var(--muted)) 80%, transparent);
		--td-copy-bg-hover: var(--color-muted, var(--muted));
	}

	.sk {
		background: var(--td-skeleton);
		border-radius: 4px;
	}

	.phrase {
		font-size: 1.0625rem;
		font-weight: 500;
		color: var(--td-text, var(--foreground));
		--text-swap-dur: 240ms;
	}

	.digit-display {
		font-size: 2.25rem;
		font-weight: 600;
		font-family: ui-monospace, SFMono-Regular, monospace;
		color: var(--td-text, var(--foreground));
		font-feature-settings: "tnum";
		letter-spacing: -0.02em;
	}

	.sk-card {
		position: relative;
		width: 12.5rem;
		height: 8.75rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 12px;
		/* WHY: clip the skeleton lines so they don't spill past the card edge as it shrinks */
		overflow: hidden;
	}
	.sk-card.is-small {
		width: 9rem;
		height: 6rem;
	}
	.sk-card .sk {
		position: absolute;
		left: 14px;
		right: 14px;
	}
	.sk-card .sk-1 {
		top: 16px;
		height: 10px;
		right: auto;
		width: 56%;
	}
	.sk-card .sk-2 {
		top: 32px;
		height: 6px;
	}
	.sk-card .sk-3 {
		top: 44px;
		height: 6px;
	}
	.sk-card .sk-4 {
		top: 56px;
		height: 6px;
		right: auto;
		width: 70%;
	}
	.sk-card .sk-5 {
		top: 84px;
		height: 6px;
	}
	.sk-card .sk-6 {
		top: 96px;
		height: 6px;
	}

	.bell-trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 12px;
		border: 0;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		color: var(--td-icon-color, var(--foreground));
		cursor: pointer;
	}
	.bell-trigger:hover {
		filter: brightness(1.05);
	}
	:global(.bell-trigger .t-badge-dot) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding: 0 0.3125rem;
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--primary-foreground);
		background: var(--primary);
		border-radius: 999px;
		line-height: 1;
	}

	.sk-modal {
		position: relative;
		width: 16rem;
		height: 10rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border: 0;
		border-radius: 12px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
	}
	.sk-modal .sk-mtitle {
		width: 60%;
		height: 12px;
	}
	.sk-modal .sk-mclose {
		position: absolute;
		top: 0.875rem;
		right: 0.875rem;
		width: 14px;
		height: 14px;
		border-radius: 50%;
	}
	.sk-modal .sk-line {
		height: 8px;
	}
	.sk-modal .sk-line.full {
		width: 100%;
	}
	.sk-modal .sk-line.three-q {
		width: 75%;
	}
	.sk-modal .sk-pills {
		margin-top: auto;
		display: flex;
		gap: 0.5rem;
	}
	.sk-modal .sk-pill {
		width: 4.25rem;
		height: 1.375rem;
		border-radius: 999px;
	}

	.dropdown-stack {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	.sk-trigger {
		width: 7rem;
		height: 2rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 8px;
	}
	.sk-dropdown {
		width: 11rem;
		padding: 0.625rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border: 0;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
	}
	.sk-dropdown .sk-row {
		height: 9px;
	}
	.sk-dropdown .sk-row.full {
		width: 100%;
	}
	.sk-dropdown .sk-row.three-q {
		width: 75%;
	}
	.sk-dropdown .sk-row.half {
		width: 50%;
	}

	.panel-clip {
		width: 100%;
		max-width: 16rem;
		height: 9rem;
		overflow: hidden;
		border-radius: 12px;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
	}
	.sk-panel {
		padding: 0.875rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.sk-panel .sk-line {
		height: 9px;
	}
	.sk-panel .sk-line.full {
		width: 100%;
	}
	.sk-panel .sk-line.three-q {
		width: 75%;
	}
	.sk-panel .sk-tiles {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.sk-panel .sk-tile {
		height: 2.25rem;
	}

	.sk-page-stage {
		position: relative;
		width: 16rem;
		height: 10rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 12px;
		overflow: hidden;
	}
	.sk-page {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.sk-page .sk-row {
		height: 10px;
	}
	.sk-page .sk-row.full {
		width: 100%;
	}
	.sk-page .sk-row.three-q {
		width: 75%;
	}
	.sk-page .sk-row.half {
		width: 50%;
	}
	.sk-page-2 {
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
	}
	.sk-amount {
		font-size: 2rem;
		font-weight: 600;
		color: var(--td-text, var(--foreground));
		font-family: ui-monospace, SFMono-Regular, monospace;
	}
	.sk-pill-row {
		display: flex;
		gap: 0.375rem;
	}
	.sk-mini-pill {
		width: 2.5rem;
		height: 1.25rem;
		border-radius: 999px;
	}

	.icon-stack {
		display: inline-grid;
		place-items: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 12px;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		color: var(--td-icon-color, var(--foreground));
		--icon-swap-dur: 220ms;
	}
	.icon-stack :global(.t-icon) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.check-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: oklch(0.66 0.16 155);
		color: #fff;
	}
	.check-badge :global(.t-success-check svg) {
		width: 2.25rem;
		height: 2.25rem;
	}

	.avatar-row {
		display: inline-flex;
	}
	.avatar-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		margin-left: -0.625rem;
		border-radius: 50%;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border: 2px solid var(--td-stage-bg);
		color: var(--td-text);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: default;
	}
	.avatar-chip:first-child {
		margin-left: 0;
	}

	.shake-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 13rem;
	}
	.shake-input {
		display: flex;
		align-items: center;
		height: 2.5rem;
		padding: 0 0.75rem;
		border: 1.5px solid var(--border);
		border-radius: 8px;
		background: var(--td-material-bg);
		color: var(--td-text-subtle);
		font-size: 0.875rem;
	}
	.shake-input.is-error {
		border-color: var(--destructive);
	}
	.shake-msg {
		margin: 0;
		font-size: 0.75rem;
		color: var(--destructive);
	}

	.clear-field {
		width: 14rem;
		height: 2.75rem;
		border-radius: 10px;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
	}
	.clear-input {
		width: 100%;
		height: 100%;
		padding: 0 2.25rem 0 0.75rem;
		border: 0;
		background: transparent;
		outline: none;
		font: inherit;
		font-size: 0.9375rem;
		color: var(--td-text);
	}
	.clear-text {
		padding-left: 0.75rem;
		font-size: 0.9375rem;
		color: var(--td-text);
	}
	.clear-ph {
		color: var(--td-text-subtle);
	}
	.clear-x {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		transform: translateY(-50%);
		z-index: 4;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: 0;
		border-radius: 50%;
		background: var(--td-copy-bg);
		color: var(--td-icon-color-muted);
		cursor: pointer;
	}
	.clear-x:hover {
		background: var(--td-copy-bg-hover);
		color: var(--td-icon-color);
	}

	.skel-card {
		width: 14rem;
		height: 4.5rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 12px;
	}
	.skel-layer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 1rem;
	}
	.skel-avatar {
		flex: none;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
	}
	.skel-bars {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.skel-l1 {
		width: 6rem;
		height: 9px;
	}
	.skel-l2 {
		width: 4rem;
		height: 9px;
	}
	.skel-avatar-real {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--primary);
		color: var(--primary-foreground);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.skel-lines {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.skel-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--td-text);
	}
	.skel-sub {
		font-size: 0.75rem;
		color: var(--td-text-subtle);
	}

	.shimmer-demo {
		font-size: 1.125rem;
		font-weight: 500;
		--shimmer-base: var(--td-text-subtle);
		--shimmer-highlight: var(--td-text);
	}

	.tabs-demo {
		font-size: 0.8125rem;
		font-weight: 500;
		--tabs-bar-bg: color-mix(in srgb, var(--td-text) 8%, transparent);
		--tabs-pill-bg: var(--td-material-bg);
		--tabs-text-muted: var(--td-text-subtle);
		--tabs-text-active: var(--td-text);
	}
	.tabs-demo :global(.t-tabs-pill) {
		box-shadow: var(--td-material-shadow);
	}

	.tt-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 10px;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		color: var(--td-icon-color);
		cursor: pointer;
	}
	.tt-bubble {
		font-size: 0.8125rem;
		font-weight: 500;
		--tt-bg: var(--td-material-bg);
		--tt-fg: var(--td-text);
	}

	.stagger-demo {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		max-width: 14rem;
		text-align: center;
	}
	.stagger-head {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--td-text);
		letter-spacing: -0.01em;
	}
	.stagger-sub {
		font-size: 0.875rem;
		color: var(--td-text-subtle);
	}
	/* ---- the nine added 14 Sep 2026 ---- */
	.acc-demo {
		width: min(24rem, 100%);
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 10px;
	}

	.acc-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.75rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--td-text);
		background: none;
		border: 0;
		cursor: pointer;
	}

	.acc-body {
		margin: 0;
		padding: 0 0.875rem 0.875rem;
		font-size: 0.8125rem;
		line-height: 1.55;
		color: var(--td-text-subtle);
	}

	.tilt-card {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 13rem;
		padding: 1.125rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		color: var(--td-text);
		font-size: 0.8125rem;
	}

	.tilt-price {
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	.tilt-note {
		color: var(--td-text-subtle);
	}

	.learn-demo,
	.like-demo {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--td-text);
		background: var(--td-copy-bg);
		border: 0;
		border-radius: 8px;
		cursor: pointer;
	}

	.like-demo {
		position: relative;
	}

	/* The anchor is sized to the open footprint, the way the usage note asks:
	   without it the morph grows the stage and every demo under it jumps. */
	.morph-anchor {
		position: relative;
		width: 11rem;
		height: 7.5rem;
	}

	.morph-demo {
		position: absolute;
		inset-block-start: 0;
		inset-inline-start: 0;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
	}

	.morph-menu {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0.875rem;
		font-size: 0.8125rem;
		color: var(--td-text);
	}

	.morph-plus {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--td-text);
		background: none;
		border: 0;
		cursor: pointer;
	}

	.reel-demo {
		font-size: 2rem;
		font-weight: 600;
		font-family: ui-monospace, SFMono-Regular, monospace;
		color: var(--td-text);
	}

	.stream-demo {
		margin: 0;
		max-width: 32rem;
		font-size: 0.9375rem;
		line-height: 1.6;
		color: var(--td-text);
	}

	.reason-demo {
		width: min(26rem, 100%);
		height: 7rem;
		padding: 0.875rem 1rem;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border-radius: 10px;
		--reason-line: 1.5rem;
	}

	.reason-line {
		margin: 0;
		height: 1.5rem;
		font-size: 0.8125rem;
		line-height: 1.5rem;
		color: var(--td-text-subtle);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.think-demo {
		font-size: 0.9375rem;
		color: var(--td-text-subtle);
	}
</style>
