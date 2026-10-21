<script lang="ts">
  import { onMount } from "svelte";
  import { Inbox, type InboxItem, type InboxVerdict } from "@heyramzi/ui/tasks";

  const intake = { name: "Intake agent", shape: "clover" } as const;
  const caller = { name: "Call agent", shape: "flower" } as const;

  const leads = { id: "leads", name: "Inbound leads" };
  const northwind = { id: "northwind", name: "Contract workflow", client: "Northwind Legal" };
  const acme = { id: "acme", name: "Onboarding", client: "Acme Freight" };

  let items = $state<InboxItem[]>([
    {
      id: "lead-birchwood",
      kind: "decision",
      tier: "ask",
      state: "proposed",
      title: "Birchwood Logistics wants a quote",
      project: leads,
      agent: intake,
      proposal: {
        summary: "Reply to the intake form. I'd ask about budget before we pre-qualify.",
        recommended: "clarify",
        drafts: [
          {
            templateId: "lead-prequalify",
            label: "Pre-qualify",
            outcome: "approve",
            subject: "Let's get Birchwood set up",
            body:
              "Hi Dana,\n\nThanks for reaching out. A workflow like yours is exactly what we build, and we'd love to help.\n\nCan we book 30 minutes this week to walk through your templates and sign-off steps?\n\nBest,\nThe team",
          },
          {
            templateId: "lead-decline",
            label: "Decline",
            outcome: "decline",
            subject: "Your e-signature project",
            body:
              "Hi Dana,\n\nThank you for thinking of us. We looked closely at what you described, and we're not the right fit for it right now.\n\nIf the scope changes, we'd be glad to take another look. We're also happy to point you to a partner who handles this size of project.\n\nWarm regards,\nThe team",
          },
          {
            templateId: "lead-clarify",
            label: "Clarify",
            outcome: "clarify",
            subject: "A quick question on your budget",
            body:
              "Hi Dana,\n\nThanks for the detail. You mentioned 14 templates and an approval chain across 3 offices, which is a larger build than the budget range in your form usually covers.\n\nCould you tell us whether the budget is flexible, or whether we should start with a smaller first phase?\n\nBest,\nThe team",
          },
        ],
      },
      confidence: {
        score: 0.58,
        missing: "The budget range doesn't match the scope they described.",
      },
      trace: {
        source: { type: "form", label: "Website intake form, Birchwood Logistics", at: "Tue 09:12" },
        evidence: [
          { quote: "Budget: under 5k", by: "Form field" },
          { quote: "We need 14 templates with approvals across 3 offices.", by: "Form field" },
        ],
        reasoning:
          "Fourteen templates and a three-office approval chain usually run well past a 5k budget. I can't tell if the budget is firm.",
      },
    },
    {
      id: "scope-northwind",
      kind: "decision",
      tier: "ask",
      state: "proposed",
      title: "Add a second signing workflow",
      project: northwind,
      agent: caller,
      proposal: {
        summary: "Extend the scope of work with a vendor-contract workflow, as discussed on the call.",
        detail: "This moves the go-live and adds 18 hours to the plan.",
      },
      confidence: {
        score: 0.71,
        missing: "Whether the extra workflow falls inside the current fee.",
      },
      trace: {
        source: {
          type: "call",
          label: "Weekly sync, Northwind Legal",
          at: "Mon 15:40",
          href: "https://example.com/calls/weekly-sync",
        },
        evidence: [
          { quote: "Could we also run vendor contracts through the same flow?", by: "Marcus", at: "12:41" },
          { quote: "Yes, we can scope that after go-live.", by: "You", at: "12:58" },
        ],
        reasoning:
          "The client asked for new work and you didn't say no. Anything that changes the scope needs your yes.",
      },
    },
    {
      id: "action-acme",
      kind: "action",
      tier: "ask",
      state: "proposed",
      title: "Send the template mapping sheet to Acme",
      project: acme,
      agent: caller,
      proposal: {
        summary: "Create a task and reply to Acme's counsel with the mapping sheet attached.",
        drafts: [
          {
            templateId: "reply-mapping",
            label: "Reply",
            outcome: "approve",
            subject: "Re: Template mapping for the MSA",
            body:
              "Hi Priya,\n\nHere's the mapping sheet you asked for. Each field lines up with a signer role, so your team can check it before we load the templates.\n\nTell us what to change and we'll turn it around by Thursday.\n\nBest,\nThe team",
          },
        ],
      },
      confidence: { score: 0.86 },
      trace: {
        source: { type: "email", label: "Gmail thread, Acme Freight counsel", at: "Tue 10:05" },
        evidence: [{ quote: "Can you send over the field mapping before Thursday?", by: "Priya" }],
        reasoning: "A direct request with a deadline. The sheet already exists in the project folder.",
      },
    },
    {
      id: "steer-acme",
      kind: "decision",
      tier: "ask",
      state: "working",
      title: "Renewal price for the envelope bundle",
      project: acme,
      agent: caller,
      steer: "No, keep the current envelope price and move the discount to year two.",
      proposal: { summary: "Offer 10% off the envelope bundle on renewal." },
      confidence: { score: 0.64, missing: "Whether the discount can wait until year two." },
      trace: {
        source: { type: "call", label: "Renewal call, Acme Freight", at: "Mon 11:20" },
        evidence: [{ quote: "We'd renew if the price came down a little.", by: "Priya", at: "21:07" }],
        reasoning: "The client tied the renewal to price. A discount is a commercial call, so it's yours.",
      },
    },
    {
      id: "auto-golive",
      kind: "information",
      tier: "auto",
      state: "done",
      title: "Go-live moved to 14 Nov",
      project: northwind,
      agent: caller,
      proposal: { summary: "Added to the track record and the project timeline." },
      confidence: { score: 0.94 },
      trace: {
        source: { type: "slack", label: "Huddle in #northwind-delivery", at: "Tue 08:50" },
        evidence: [{ quote: "Let's land go-live on the 14th, the 7th is too tight.", by: "Marcus", at: "03:12" }],
        reasoning: "A plain date change with no cost attached, so I logged it without asking.",
      },
    },
    {
      id: "auto-summary",
      kind: "information",
      tier: "auto",
      state: "done",
      title: "Call summary filed",
      project: acme,
      agent: caller,
      proposal: { summary: "Saved the renewal call summary to the Acme track record." },
      confidence: { score: 0.97 },
      trace: {
        source: { type: "call", label: "Renewal call, Acme Freight", at: "Mon 11:20" },
        evidence: [{ quote: "So that's renewal in January, pending the price.", by: "You", at: "34:40" }],
        reasoning: "Every finished call gets a summary. Filing it changes nothing outside the record.",
      },
    },
  ]);

  const timers = new Set<ReturnType<typeof setTimeout>>();

  function patch(id: string, change: Partial<InboxItem>) {
    items = items.map((item) => (item.id === id ? { ...item, ...change } : item));
  }

  // WHY a timer: the host runs the agent. Here a second pass comes back with a revised proposal,
  // the way a real retry would, so a steer is seen to land.
  function rerun(id: string) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      patch(id, {
        state: "proposed",
        steer: undefined,
        proposal: {
          summary: "Keep today's envelope price and move the 10% discount to year two.",
          detail: "Revised with your note.",
        },
        confidence: { score: 0.9 },
      });
    }, 4000);
    timers.add(timer);
  }

  function onverdict(verdict: InboxVerdict) {
    if (verdict.type === "approve") patch(verdict.id, { state: "approved" });
    else if (verdict.type === "decline") patch(verdict.id, { state: "declined" });
    else if (verdict.type === "undo") patch(verdict.id, { state: "undone" });
    else {
      patch(verdict.id, { state: "working", steer: verdict.note });
      rerun(verdict.id);
    }
  }

  onMount(() => {
    for (const item of items) if (item.state === "working") rerun(item.id);
    return () => timers.forEach(clearTimeout);
  });
</script>

<div class="h-[34rem] w-full max-w-3xl">
  <Inbox {items} {onverdict} />
</div>
