<script lang="ts">
  import { CaretDown } from "phosphor-svelte";
  import { Picker, pickerTriggerClass } from "@heyramzi/ui/components/picker";

  const options = [
    { value: "urgent", label: "Urgent", hint: "P0" },
    { value: "high", label: "High", hint: "P1" },
    { value: "normal", label: "Normal", hint: "P2" },
    { value: "low", label: "Low", hint: "P3" },
  ];

  let value = $state<string | null>("normal");
  let selected = $derived(options.find((option) => option.value === value));
</script>

<Picker {options} {value} onSelect={(next) => (value = next)} triggerClass={pickerTriggerClass()}>
  {#snippet trigger()}
    <span>{selected?.label ?? "Priority"}</span>
    <CaretDown class="size-3 text-muted-foreground" />
  {/snippet}
</Picker>
