# @heyramzi/ui/inbox

One threaded inbox. Entries from any source (a comment, a status change, an assignment, a mention, an agent reply, an agent's ask) group into one thread per subject, and the screen shows the thread list on the left and the selected thread on the right. The inbox never fetches. Everything leaves through callbacks.

```svelte
<script lang="ts">
  import { ThreadInbox, type InboxEntry } from "@heyramzi/ui/inbox";

  let entries = $state<InboxEntry[]>([]);
</script>

<ThreadInbox
  {entries}
  unreadFirst
  onRead={(thread, read) => mark(thread.key, read)}
  onSnooze={({ thread, until }) => snooze(thread.key, until)}
  onDecide={(verdict, thread) => decide(verdict)}
/>
```

- **Grouping.** `threadsOf(entries, { unreadFirst })` keys on `subject.type` plus `subject.id`, sorts threads by their newest entry and entries oldest first. An entry with no subject id is dropped. A malformed timestamp sorts last. Each thread carries `unread`, `latestAt` and `pending`.
- **Needs you.** A `proposal` entry whose `proposal` (an `InboxItem`) is still open pins to the top of its thread, drawn with `InboxCard`. The "Needs you" filter keeps threads that hold one. Verdicts come out of `onDecide`.
- **Filters.** By subject type, by actor name and by Needs you. `filterThreads` runs them without the component.
- **Keys.** `j` and `k` move, `u` marks the thread read (or unread when nothing is unread), `h` opens the snooze row (`1`, `2`, `3` pick a time), and `a`, `d`, `s`, `e` act on the pinned proposal. A key does nothing while focus is in an input, a textarea, a select or an editable element, or while a modifier is held. `inboxKeyOf(event)` is the same check.
- **Snooze.** `onSnooze({ thread, until })` gets a `Date`: 3 hours on, tomorrow 9:00 or next Monday 9:00 (`snoozeChoices(now)`). The host decides what snoozed means and stops passing the entries.
- **Read.** `onRead(thread, read)` is true when the thread had unread entries, so the host marks them all read.
- **Words.** `labels` is a partial of `InboxLabels`. Status and assignment lines have `{from}`, `{to}` and `{assignee}` slots. `typeLabels` names the subject types. The `avatar` and `status` snippets let the app draw its own portrait and status badge.