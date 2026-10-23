<script lang="ts">
	import { ShaderGradient } from "@heyramzi/ui/effects/shader-gradient";
</script>

<div class="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
	<div class="h-64 overflow-hidden rounded-2xl">
		<ShaderGradient class="size-full" />
	</div>
	<div class="h-64 overflow-hidden rounded-2xl">
		<ShaderGradient
			class="size-full"
			color1="#0f766e"
			color2="#a7f3d0"
			color3="#f5e9c8"
			bgColor="#042f2e"
			uSpeed={0.25}
			rotationZ={120}
		/>
	</div>
</div>
