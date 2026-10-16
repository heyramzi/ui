// Turns Editor OS's project state (GET /p/<name>/state) into a ReviewModel fixture.
import { readFileSync, writeFileSync } from "node:fs";

const [, , input = "dev/fixtures/a19-studio-state.json", output = "dev/fixtures/a19.json"] =
  process.argv;
const s = JSON.parse(readFileSync(input, "utf8"));

const groups = [
  { id: "edit", label: "Edit" },
  { id: "dress", label: "Dress" },
  { id: "ship", label: "Ship" },
];
const layout = {
  organise: { group: "prep", view: "none" },
  cut: { group: "edit", view: "transcript", lens: "cut" },
  reorder: { group: "edit", view: "transcript", lens: "moved" },
  rhythm: { group: "edit", view: "transcript", lens: "pace", kinds: ["layout"] },
  music: { group: "dress", view: "music" },
  motion: { group: "dress", view: "beats", kinds: ["motion"] },
  broll: { group: "dress", view: "beats", kinds: ["broll"] },
  review: { group: "ship", view: "beats", kinds: ["sound"] },
  handoff: { group: "ship", view: "none" },
};
const passes = s.passes.map((p) => ({
  id: p.name,
  label: p.label,
  state: p.state === "done" ? "done" : p.state === "started" ? "review" : "todo",
  ...layout[p.name],
}));

const fix = (option) => ({
  id: option.id,
  name: option.name,
  kind: option.kind,
  ...(option.media ? { src: `media:${option.media}` } : {}),
  ...(option.preview ? { preview: option.preview } : {}),
});
const beat = (b) => ({
  id: b.id,
  kind: b.kind,
  seconds: b.seconds,
  at: b.at,
  line: b.line,
  options: b.options.map(fix),
  state: b.state,
  ...(b.pick ? { pick: b.pick } : {}),
});
const beats = [...s.review.layouts, ...s.review.inserts, ...s.review.sound].map(beat);

// Marks are demo data: the studio state doesn't carry them yet.
const paragraphs = s.review.paragraphs.map((p, pi) => ({
  at: p.at,
  ...(p.chapter ? { chapter: p.chapter } : {}),
  lines: p.lines.map((l, li) => {
    const n = pi * 7 + li;
    const marks =
      n % 11 === 4 ? ["cut"] : n % 13 === 5 ? ["moved"] : n % 6 === 2 ? ["pause"] : undefined;
    return { at: l.at, seconds: l.seconds, text: l.text, ...(marks ? { marks } : {}) };
  }),
}));

const model = {
  id: s.name,
  title: "AI project manager",
  route: "In Descript",
  status: { tone: "warn", text: "12 choices wait for you" },
  groups,
  passes,
  kinds: [
    { id: "layout", label: "Layout", icon: "layout", tone: "neutral" },
    { id: "motion", label: "Motion", icon: "motion", tone: "accent" },
    { id: "broll", label: "B-roll", icon: "broll", tone: "warn" },
    { id: "sound", label: "Sound", icon: "sound", tone: "ok" },
  ],
  paragraphs,
  beats,
  music: {
    decision: s.music.decision,
    more: s.music.more,
    options: s.music.options.map((o, i) => ({
      id: o.id,
      title: o.title,
      mood: o.mood,
      seconds: o.seconds,
      src: `media:music/tone-${i + 1}.mp3`,
    })),
  },
  notes: [
    {
      id: "n1",
      target: { kind: "beat", beat: "motion:1" },
      text: "Use an alpha layer instead.",
      status: "answered",
      by: "person",
      pass: "motion",
      reply: s.notes[0].reply,
      createdAt: s.notes[0].createdAt,
    },
    {
      id: "n2",
      target: {
        kind: "text",
        from: "0:07",
        to: "0:09",
        quote: "Yep, I'm good. And the truth is they",
      },
      text: "This beat lands late. Tighten the pause before it.",
      status: "open",
      by: "person",
      pass: "cut",
      createdAt: "2026-09-29T22:30:00.000Z",
    },
    {
      id: "n3",
      target: { kind: "beat", beat: "broll:1" },
      text: "Firing scenes cast the speaker as the boss. Try a calmer shot?",
      status: "proposal",
      by: "agent",
      pass: "broll",
      createdAt: "2026-09-29T22:31:00.000Z",
    },
    {
      id: "n4",
      target: { kind: "video" },
      text: "Check the outro music against the last chapter.",
      status: "open",
      by: "person",
      createdAt: "2026-09-29T22:32:00.000Z",
    },
  ],
  session: "listening",
};
writeFileSync(output, `${JSON.stringify({ root: s.dir, model }, null, 1)}\n`);
console.log(`wrote ${output}: ${beats.length} beats, ${paragraphs.length} paragraphs`);
