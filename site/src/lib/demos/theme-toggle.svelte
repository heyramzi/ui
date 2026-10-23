<script lang="ts">
	import ThemeToggle from "@heyramzi/ui/effects/theme-toggle";

	const MODES = ["light", "dark", "system"] as const;
	let mode = $state<(typeof MODES)[number]>("light");
	let isDark = $state(false);

	function cycle() {
		mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
	}
</script>

<div class="flex flex-wrap items-center gap-6">
	<ThemeToggle {isDark} onToggle={() => (isDark = !isDark)} />
	<ThemeToggle {mode} onToggle={cycle} />
	<ThemeToggle {mode} variant="ghost" onToggle={cycle} />
	<div class="bg-foreground rounded-lg p-2">
		<ThemeToggle {mode} variant="inverted" onToggle={cycle} />
	</div>
	<ThemeToggle {isDark} variant="slide" onToggle={() => (isDark = !isDark)} />
	<ThemeToggle
		{isDark}
		variant="slide"
		size="default"
		class="[--theme-toggle-thumb-light:oklch(0.72_0.17_55)] [--theme-toggle-thumb-dark:oklch(0.55_0.2_285)] [--theme-toggle-glow:oklch(0.65_0.2_285)]"
		onToggle={() => (isDark = !isDark)}
	/>
</div>
