<script lang="ts">
  import { CANVAS, sfSymbols } from "@heyramzi/ui/icons/sf-symbols";

  const names = [
    "mic.fill", "globe", "waveform", "sparkles", "clock.fill", "chart.bar.fill", "envelope.fill", "person.2.fill",
    "folder", "magnifyingglass", "doc.on.doc", "trash", "tray.full", "star.fill", "plus", "list.bullet",
    "square.and.pencil", "play.fill", "link", "photo", "checklist", "arrow.clockwise", "square.and.arrow.down", "xmark",
  ] as const;
</script>

<ul class="grid grid-cols-4 gap-3 sm:grid-cols-6">
  {#each names as name (name)}
    {@const s = sfSymbols[name]}
    <li class="flex w-20 flex-col items-center gap-1.5">
      <span class="grid size-12 place-items-center rounded-xl border border-border bg-card text-foreground">
        <svg viewBox="0 0 {CANVAS} {CANVAS}" class="size-6" fill="currentColor" aria-hidden="true">
          <g transform="translate({(CANVAS - s.w) / 2} {(CANVAS - s.h) / 2})">
            {#each s.paths as d (d)}<path {d} />{/each}
          </g>
        </svg>
      </span>
      <span class="w-full truncate text-center text-[11px] text-muted-foreground" title={name}>{name}</span>
    </li>
  {/each}
</ul>
