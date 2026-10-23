# @heyramzi/ui/thread

One comment thread for any subject: a task, a project, a doc or a diagram. The thread owns the layout and the draft state. It never fetches. You pass comments and callbacks, and it hands back what the person did.

```svelte
<script lang="ts">
  import { Thread, type ThreadComment, type ThreadPost } from "@heyramzi/ui/thread";

  let comments = $state<ThreadComment[]>([]);

  async function onPost({ body, parentId }: ThreadPost) {
    const saved = await save(body, parentId);
    if (!saved) return false; // keeps the draft
    comments = [...comments, saved];
  }
</script>

<Thread {comments} {onPost} {onEdit} {onDelete} {onResolve} canEdit={(c) => c.author.name === me} />
```

- **Replies.** `parentId` points at the comment answered. A reply to a reply sits under the same root, a reply whose parent is gone becomes a root, and `buildThread(comments)` gives you the same grouping without the component.
- **Authors.** `author.kind` is `user` or `agent`. An agent shows an "AI" chip. The `avatar` snippet replaces the face for both kinds, so an app passes its cast portrait there.
- **Rich bodies.** A comment with `content` (Tiptap JSON) draws through `@heyramzi/ui/editor`'s renderer. `body` stays the plain-text fallback. A rich comment has no edit button, because the thread edits text only.
- **Resolve.** Pass `onResolve` and each root gets a check. Resolved roots fold away behind a "Show N resolved" button.
- **Anchor.** `anchor` carries `{ nodeId, dx, dy, x, y }` for a canvas pin. A pinned comment shows a chip, and `onAnchor` fires on a click so the canvas can move to the node. `anchorChip` replaces the chip.
- **Attachments.** The `attachments` snippet draws under a comment's body.
- **Events.** `events` takes `ThreadEvent`s (a whole sentence, a time, an optional Phosphor icon) and draws each as one `Trace` line between the conversations, in time order. `whenEvent(event)` formats its time. `interleave(nodes, events)` gives the same order without the component.
- **Long bodies.** A body over 6 lines folds behind `showMore` and `showLess`.
- **Labels.** Every string comes from `labels`, a partial of `ThreadLabels`. `showResolved` holds a `{count}` slot. `when(comment)` formats the time.

```ts
const fr = { title: "Activité", send: "Commenter", showResolved: "Afficher {count} résolu" };
```
