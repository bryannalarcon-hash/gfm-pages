# Prompt Logging — Setup Instructions

A small Claude Code system that auto-records every user prompt and Claude's final reply to a markdown file. Survives `/exit` and resume. Ignores background-subagent task-notifications. Captures the final synthesized reply — not preambles, not interim updates.

## What it produces

A single markdown file with two top-level sections:

```
# PROMPTs ONLY
### Prompt #1 — 2026-05-27 09:29:06 CDT
<prompt body>

### Prompt #2 — …
<prompt body>

---

# full conversation
### Prompt #1 — 2026-05-27 09:29:06 CDT
<prompt body>

**Reply #1:**
<final reply text>

### Prompt #2 — …
```

`# PROMPTs ONLY` is a sequential index of prompts. `# full conversation` interleaves prompts with replies.

## Requirements

- Claude Code with hook support (`UserPromptSubmit` + `Stop` events).
- Python 3 on `PATH`.

## Setup (5 minutes)

1. **Copy the logger script** to `scripts/prompt_logger.py` in the target project. Reference implementation: see `scripts/prompt_logger.py` in this repo. The script is self-contained (no external dependencies) and ~140 lines. Adjust `DEFAULT_LOG` if you want a different filename than `claude-conversation.md`.

2. **Initialize the log file** in the project root with the two-section scaffold:

   ```markdown
   # PROMPTs ONLY

   ---

   # full conversation
   ```

   Filename should match `DEFAULT_LOG` in the script.

3. **Add the hooks** to `.claude/settings.local.json` (or `settings.json`). Merge with existing keys; do not replace:

   ```json
   {
     "hooks": {
       "UserPromptSubmit": [{
         "hooks": [{
           "type": "command",
           "command": "python3 \"$CLAUDE_PROJECT_DIR/scripts/prompt_logger.py\" prompt",
           "timeout": 15,
           "statusMessage": "Logging prompt"
         }]
       }],
       "Stop": [{
         "hooks": [{
           "type": "command",
           "command": "python3 \"$CLAUDE_PROJECT_DIR/scripts/prompt_logger.py\" reply",
           "timeout": 15,
           "statusMessage": "Logging reply"
         }]
       }]
     }
   }
   ```

4. **Reload config.** Open `/hooks` once, or `/exit` and resume — hooks load on session start.

5. **Verify.** Send a test prompt. Confirm a new entry appears in both sections, and that Reply #N is added when Claude finishes the turn.

## Key design properties (don't re-discover these)

The script encodes several non-obvious fixes. Preserve them when adapting:

- **`is_noise()` filter drops subagent notifications.** Background subagent completions arrive as messages starting with `<task-notification>`. Without this filter, every completion becomes a phantom prompt #N+1.
- **Text-after-tool rule beats the Stop-hook race.** Stop fires before the final assistant message is flushed to the transcript `.jsonl`. Naive "last assistant text" reads the *preamble* (the line emitted before the first tool call), not the reply. The fix: only accept text that comes AFTER the last `tool_use` in the transcript — a preamble always precedes a tool call, so it never qualifies.
- **Trivial-reply sentinel.** "No response requested." is the standard echo for slash-command caveats. It's in `TRIVIAL_REPLIES` so it can't clobber a real reply.
- **Sidechain (subagent) entries skipped.** Transcript lines with `isSidechain: true` are excluded.
- **Numbering survives exit/resume.** `max(existing #) + 1` is computed from the log file, not session memory.
- **Backfill on next prompt.** If Stop misses the final reply (race), the next `UserPromptSubmit` extracts it (transcript is fully flushed by then) and writes it before logging the new prompt.
- **Overwrite-on-Stop within a multi-turn flow.** Async subagent completions span multiple Stop events for one logical prompt. The script overwrites the reply each time so the FINAL summary wins, not an interim "still working" message.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Reply captures preamble ("Let me check…") instead of final answer | text-after-tool rule disabled or sentinel-skip broken |
| Subagent notification became a prompt | `is_noise()` prefix doesn't match the notification format in this Claude Code version |
| Numbering jumped or duplicated | Log file unreadable/unwritable, or the script ran twice with stale state |
| Hook doesn't fire at all | `/hooks` not reloaded; settings.json malformed; `CLAUDE_PROJECT_DIR` not set |

## File format guarantees

- Sections are ordered: `# PROMPTs ONLY` first, then `---`, then `# full conversation`.
- Every prompt appears in *both* sections under the same number.
- Replies appear ONLY in the `# full conversation` section, directly under their prompt.
- Reply for the most recent prompt may be missing momentarily (Stop race) — backfilled on the next prompt.
