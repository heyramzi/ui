# @heyramzi/ui/triage

The three pieces of an email triage screen. They never fetch: you pass the words and callbacks, and they hand back what the person did.

- `TriagePlan` is one email with the plan the model proposes ("Create a task in Clients") and three ways out: approve, type another task, dismiss.
- `TriageTask` is one settled email: what happened, the task it became, when, and Undo when the host passes `onUndo`.
- `TriageQueue` is the list around them, with the empty state. `kind="plans"` stacks cards, `kind="tasks"` draws one divided list.

```svelte
<script lang="ts">
  import { TriageQueue, TriagePlan } from "@heyramzi/ui/triage";
</script>

<TriageQueue items={emails} key={(e) => e.id} empty="Nothing to review.">
  {#snippet row(e)}
    <TriagePlan
      sender={e.from}
      subject={e.subject}
      plan={e.plan}
      onApprove={() => approve(e.id)}
      onPick={(task) => approve(e.id, task)}
      onDismiss={() => dismiss(e.id)}
    />
  {/snippet}
</TriageQueue>
```

`labels` on each piece is a partial, so a host translates it. A callback may return a promise: the buttons stay disabled until it settles.
