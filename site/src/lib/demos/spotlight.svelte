<script lang="ts">
	import Spotlight from "@heyramzi/ui/effects/spotlight";
</script>

<div
	class="relative flex min-h-56 w-full items-center justify-center overflow-hidden rounded-xl bg-[#050505]"
>
	<!-- The beam rests up and left of its box. Placed for a full-height hero, a short panel showed
	     only its tail in one corner, so this one starts it further in and lets it cross the text. -->
	<Spotlight class="top-[10%] left-[40%] w-[110%] lg:w-[110%]" fill="white" />
	<div class="z-[2] px-6 text-center">
		<p class="font-medium text-[#f5f5f5]">Spotlight</p>
		<p class="text-xs text-[#a3a3a3]">A soft beam sweeps in on mount.</p>
	</div>
</div>
