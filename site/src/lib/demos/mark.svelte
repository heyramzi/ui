<script lang="ts">
  import { Mark } from "@heyramzi/ui/components/mark";

  const logo = (bg: string, body: string) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${bg}"/>${body}</svg>`)}`;

  const northwind = logo("#0f3d3e", '<path d="M8 23V9l16 14V9" fill="none" stroke="#f4efe6" stroke-width="3" stroke-linejoin="round"/>');
  const atelier = logo("#e8553d", '<circle cx="16" cy="16" r="7" fill="none" stroke="#fff" stroke-width="3"/>');

  const marks = [
    { label: "Northwind Legal", src: northwind },
    { label: "Atelier Morel", src: atelier },
    { label: "Harbor Dental", src: "data:image/png;base64,AA==" },
    { label: "Kestrel Surveys" },
  ];
</script>

<div class="flex flex-col gap-6">
  <ul class="flex flex-col gap-2">
    {#each marks as m (m.label)}
      <li class="flex items-center gap-2 text-sm">
        <Mark src={m.src} label={m.label} />
        {m.label}
      </li>
    {/each}
  </ul>
  <div class="flex items-center gap-3">
    {#each marks as m (m.label)}
      <Mark src={m.src} label={m.label} shape="circle" class="size-9 text-sm" />
    {/each}
  </div>
</div>
