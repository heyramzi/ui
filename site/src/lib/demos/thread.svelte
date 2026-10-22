<script lang="ts">
  import { Thread, type ThreadComment, type ThreadLabels, type ThreadPost } from "@heyramzi/ui/thread";
  import { Button } from "@heyramzi/ui/shadcn/button";

  const ada = { kind: "user", name: "Ada Okafor" } as const;
  const scribe = { kind: "agent", name: "Scribe" } as const;

  let comments = $state<ThreadComment[]>([
    {
      id: "c1",
      author: ada,
      body: "The three plans fit one screen on a laptop. Can we cut the table under it?",
      createdAt: "2026-10-22T08:40:00Z",
    },
    {
      id: "c2",
      author: scribe,
      body: "Cut it. The comparison now sits in the plan cards, 4 rows each.",
      createdAt: "2026-10-22T08:52:00Z",
      parentId: "c1",
    },
    {
      id: "c3",
      author: ada,
      body: "",
      content: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Pin this on the pricing node: " }, { type: "text", text: "the headline", marks: [{ type: "bold" }] }, { type: "text", text: " still says per seat." }] },
        ],
      },
      createdAt: "2026-10-22T09:10:00Z",
      anchor: { nodeId: "pricing", dx: 12, dy: -8 },
    },
    {
      id: "c4",
      author: scribe,
      body: "Footer links checked, none are broken.",
      createdAt: "2026-10-21T16:00:00Z",
      resolved: true,
    },
  ]);

  const french: Partial<ThreadLabels> = {
    title: "Activité",
    placeholder: "Écrire un commentaire",
    replyPlaceholder: "Répondre",
    send: "Commenter",
    sending: "Envoi",
    reply: "Répondre",
    resolve: "Résoudre",
    unresolve: "Rouvrir",
    resolved: "Résolu",
    showResolved: "Afficher {count} résolu",
    hideResolved: "Masquer les résolus",
    edit: "Modifier le commentaire",
    delete: "Supprimer le commentaire",
    edited: "modifié",
    save: "Enregistrer",
    cancel: "Annuler",
    pinned: "Épinglé",
  };

  let fr = $state(false);

  function onPost({ body, parentId }: ThreadPost) {
    comments = [...comments, { id: crypto.randomUUID(), author: ada, body, parentId, createdAt: new Date().toISOString() }];
  }

  function onEdit(comment: ThreadComment, body: string) {
    comments = comments.map((c) => (c.id === comment.id ? { ...c, body, edited: true } : c));
  }

  function onDelete(comment: ThreadComment) {
    comments = comments.filter((c) => c.id !== comment.id);
  }

  function onResolve(comment: ThreadComment, resolved: boolean) {
    comments = comments.map((c) => (c.id === comment.id ? { ...c, resolved } : c));
  }
</script>

<div class="mx-auto flex max-w-xl flex-col gap-3">
  <div class="flex justify-end">
    <Button size="sm" variant="outline" aria-pressed={fr} onclick={() => (fr = !fr)}>FR</Button>
  </div>
  <Thread
    {comments}
    labels={fr ? french : undefined}
    {onPost}
    {onEdit}
    {onDelete}
    {onResolve}
    onAnchor={() => {}}
    canEdit={(comment) => comment.author.kind === "user"}
  />
</div>
