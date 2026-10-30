---
paths:
  - "**/*.swift"
  - "**/project.yml"
  - "**/Makefile"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Swift

**Load the skill before you read further into the code.** A view that redraws, never updates or needs splitting is `swiftui`. A screen's look, layout or polish is `ios-design`. An animation is `swift-designer`. The language, concurrency, a leak or a build is `swift`. On 30 Oct 2026 the routing eval sent 4 Swift debugging prompts straight into the code, and none loaded a skill in 6 turns.

- **Build through the Makefile**: `make build`, `make test`, `make generate`, and any other target it defines. The `command-guard` hook refuses a raw `xcodebuild` or `xcodegen` where the Makefile has the target. When a build fails, rerun with `XCBEAUTIFY=cat` or the real `file.swift:12:5: error:` lines are gone.
- **Every Xcode build on the Mac queues, one at a time at two jobs.** `~/.local/bin/xcodebuild` and `swift` link to `vibe-kit/swift/scripts/xcode-queue.py`, and the hook refuses an absolute path or `xcrun` around it. Two at once crash the laptop (23 Oct 2026), so a "waiting for" line means wait, not retry. Several agents at once is fine (Ramzi, 26 Oct 2026), since the queue takes their builds in turn; rerunning the whole suite isn't. The queue isn't enough alone: the same night one build still hit 16 GB swap while other repos ran checks. Run `memory_pressure | tail -1` first and hold off when free memory is low. `make -n` isn't a dry run here, since recipes calling `$(MAKE)` still execute.
- **Check what you changed: `swift-changed <your paths>`, or `--staged`.** It house-lints your Swift files and runs `make build` only in the Xcode projects whose `project.yml` compiles them, so a Rounds view builds Rounds and a Wavenote `shared/` file builds the Mac and the phone. Docs, web and scripts run nothing. A one-file incremental build is 5 to 20s; Rounds' `make verify` was 99s and never built the app (27 Oct 2026). `--plan` prints the plan and runs nothing.
- **Swift agents work in the main checkout, never `isolation: "worktree"`.** A worktree has no `build/dd`, so its first build is cold and every build after it waits in the queue behind it. Over 4 days in apple-apps a worktree build took a median 119s against 34s in place, and a test run 242s against 26s (27 Oct 2026). The queue runs one build at a time anyway, so the worktree buys no parallel builds.
- **Tests run only when an Apple app is released.** A task, a fix or a subagent's brief stops at `swift-changed <paths>`, and a brief says so in those words, never a gate command written from memory: write the tests the change needs, commit, push, leave them unrun. The release runs `make verify -o test` (every check but the suite), then `swift-changed --test --since <last release commit> products/<name>` (it reads uncommitted and new files too), then publishes with `-o verify` (`make testflight -o verify`). `--test` runs only the suites that name a type the diff declares, plus the test files it changed. When none does, it widens up to 2 hops to the types that call them, and it says when it's done that. "No test suite names anything" means the change is unproven by tests, so say so. On 26 Oct 2026 six Wavenote agents each ran the whole suite through the build queue, and Ramzi: "otherwise this will take five months to finish."
- **No simulator captures as a routine check.** A UI change stops at `swift-changed` and the tests it needs; `make shots-*` and simulator screenshots run only when Ramzi asks. Never wait on, or queue behind, a simulator just to take pictures, and shut down a booted one that blocks real work once nothing drives it. On 27 Oct 2026 a Rounds paywall capture queued behind another session's idle simulator, and Ramzi: "I don't see the point of doing captures each time."
- **A concurrency error usually means the ownership is wrong**, not that an annotation is missing. Never silence one with a detached task you can't explain.
- **Extensions have budgets.** A keyboard extension dies around 60MB, and share and widget extensions are tighter. Check which target an import lands in before you add it.
- **`// MARK: -` for sections.** Comments say why, and the best one names the alternative you rejected.
- **User-facing strings are localizable, never name a part of the machine, and keep every sentence to 12 words, two sentences a string.** cutkit's `ios/Scripts/lint-copy.mjs` enforces it; copy it into any app that lacks one.
- **Segmented pickers and tab bars get `.controlSize(.large)`**, so they match iOS 27 and the tap target clears 44pt. The default is a squat strip.
- **A round control gets a square frame and the glass gets `Circle`**, never `.buttonStyle(.glass)` padding an icon into a capsule. Every control in one bar shares one height, and a top bar is the system's 44pt. `vibe-kit/packages/devtools/src/bar-geometry.py` reads it off the shots; cutkit's `shots.sh` and Wavenote's `make bars` run it.
- **A nested `enum Color` or `enum Font` shadows SwiftUI's**, so `Color(red:)` inside it stops compiling. Write `SwiftUI.Color` in generated token files, and typecheck them with `xcrun swiftc -typecheck` before calling them done.
- **A capture writer input keeps `expectsMediaDataInRealTime = true`**, its warning muted by `@diagnose(DeprecatedDeclaration, as: ignored)` on a one-line helper, never the whole function. iOS 27's `appendImmediately` doesn't imply it, so without it cutkit's recorder threw away 2 of every 3 frames (30 Sep 2026).
- **Retiming a `CMSampleBuffer` sizes its array by timing entries, not samples.** Ask `CMSampleBufferGetSampleTimingInfoArray` for the count first. An audio buffer holds about 1024 samples under one entry, and a per-sample array made cutkit's resumed takes silent (1 Oct 2026).
- **Ported code isn't yours to tidy.** Where a project says a file came from a sibling repo, leave its shape alone, or the next port becomes a merge conflict for nothing.

The banned APIs fail the commit through `vibe-kit/swift/lint/house-lint.mjs`. Depth: the `swift` skill.
