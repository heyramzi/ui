<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Git with parallel sessions

Several sessions work the same repos at once, and Ramzi commits, not you. That shapes every git command.

- **Another session may stash your uncommitted work mid-turn**, so a file you just wrote reads as reverted and `git status` is clean. Take your paths back with `git checkout stash@{0} -- <paths>` and leave the entry for its owner.
- **Never stash somebody else's uncommitted file to test something.** `stash push -- <path>`, then `checkout` and `drop`, leaves the file at HEAD and their work in a dangling commit you can only find by grepping `git fsck --unreachable`. Copy the file to the scratchpad and test there.
- **When asked to commit, `git commit --only -- <your paths>`** leaves everyone else's staged work alone.
