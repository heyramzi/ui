# AGENTS.md

<!-- vibekit:agents-core:start -->
<!-- Generated from upsys/kit/ai-doc/references/agents-core.md. Edit there, then run: node upsys/kit/ai-doc/scripts/sync-agents-core.cjs -->

Preserve concurrent work. A problem you find on the way is part of the task: fix it and verify it before you stop, never report it as a leftover. Stop short only when the fix needs Ramzi's decision or another session holds the file, and then say exactly what you need. A sign-in, an OAuth screen, a tool pick or a mail to find is never his decision: Proton Pass (`pass-cli`), `gws` and the browser reach them. When your change is verified, commit only your own paths (`git add -- <paths>`, then `git commit --only -- <paths>`) and push; a client production push still waits for his OK. Edit `AGENTS.md` or `CLAUDE.md` only when asked.

Confirm messages sent under the user's name, payments or refunds, deleting another person's unbacked data, and client production pushes. Established workflows and Ramzi's own files and infrastructure are otherwise authorized. Before deploying, inspect the branch, working-tree diff, target and command side effects.

Every task you work on, in any repo, is a `TSK-n` ticket on that repo's UpSys project, so Ramzi's board shows what each session is on: find or create it before the first edit, keep it `in_progress` with steps you tick, comment each commit, and close it when delivered. The `ticket` skill has the commands (read `~/Studio/upsys/kit/ai-doc/skills/delivery/projects/ticket/SKILL.md` where the repo doesn't list it), and its Stop hook sends a session with edits and no ticket back.

Client, past-call or personal decisions: search `qmd` before relying on memory or declaring information unknown.

Delegate to Opus subagents when the work splits into parallel pieces, makes long output the session only needs the conclusion of, needs a reviewer that doesn't share the author's context, or belongs to an owner whose preloaded skills matter. A change under about 5 tool calls stays in the session: a subagent starts with an empty context, and a multi-agent run costs about 15x the tokens of a chat (Anthropic, multi-agent research system). The session briefs, reviews and runs gates. Hand a task to the named agent that owns it (screens and screenshots go to `frontend-designer`), briefed for the fix alone (no gates, re-audits or waits) and sized to finish inside its turn limit: about 15 items, a sign-in plus 5 page actions, or one job moved to a VPS. A build and its screenshots, a change and the kit release it needs, or a sign-up and the publish behind it are 2 agents, and scope sent mid-run counts against the same budget, so it goes to a new agent. The briefs that ran out, and where a new case goes, are in `~/Studio/upsys/kit/ai-doc/references/orchestration.md` (Sizing a brief). A subagent finishes its brief and starts another agent only when it says so. Tool names are case-sensitive (`Bash`, not `bash`), and a skill this repo doesn't list is read at its `~/Studio/upsys/kit/ai-doc/skills` path, never by name.

Code, copy, dependencies, scripts, commands or product/design/release decisions: read the relevant sections of [CODING_STANDARDS.md](CODING_STANDARDS.md) before acting.

Skills, agents and references: edit their owning source through the authoring skill; project projections are generated. Heal lessons there, deleting the contradicted instruction.

<!-- vibekit:agents-core:end -->
