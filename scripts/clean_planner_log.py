#!/usr/bin/env python3
"""One-time cleanup: remove entries that misfired into claude-planner-conversation.md from
OTHER sessions (the coder build + the 'herdr' session) while the live logger's DEFAULT_LOG
still pointed at the planner file. Keeps the real planner-phase turns and renumbers them.

A planner-log prompt is dropped iff its text matches a real user message from one of the
polluting session transcripts (matched on a normalized prefix). Everything else is kept.

Usage: python3 scripts/clean_planner_log.py <planner.md> <keepTranscript.jsonl> <dropTranscript.jsonl>
A prompt is dropped iff its signature is in the DROP transcript (the polluting session) AND
NOT in the KEEP transcript (the genuine session that owns this log). Back up first.
"""
import json
import re
import sys

LOG = sys.argv[1]
KEEP_TRANSCRIPT = sys.argv[2]
DROP_TRANSCRIPT = sys.argv[3]
SIG_LEN = 40


def norm(s: str) -> str:
    s = re.sub(r"<system-reminder>.*?</system-reminder>", "", s, flags=re.DOTALL)
    # Drop the slash-command message wrapper content (e.g. <command-message>goal</...>) so a
    # /goal entry normalizes the same whether captured live (prompt text) or from the transcript.
    s = re.sub(r"<command-message>.*?</command-message>", " ", s, flags=re.DOTALL)
    s = re.sub(r"<command-(name|args)>", " ", s)
    s = re.sub(r"</command-(name|args)>", " ", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s[:SIG_LEN]


def collect_sigs(paths):
    sigs = set()
    for p in paths:
        with open(p, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    o = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if o.get("isSidechain"):
                    continue
                m = o.get("message") or {}
                if m.get("role") != "user":
                    continue
                c = m.get("content")
                if isinstance(c, list):
                    if all(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                        continue
                    t = "".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
                else:
                    t = c if isinstance(c, str) else ""
                t = t.strip()
                if not t:
                    continue
                sig = norm(t)
                if len(sig) >= 8:
                    sigs.add(sig)
    return sigs


# Prompt body in the log is the line(s) immediately after the "### Prompt #N — ts" header.
HEADER_RE = re.compile(r"^### Prompt #(\d+) — (.+)$")


def split_blocks(section_text):
    """Yield (body_first_line, full_block_text) for each '### Prompt #N' block in a section."""
    lines = section_text.split("\n")
    blocks = []
    cur = None
    for ln in lines:
        if HEADER_RE.match(ln):
            if cur is not None:
                blocks.append(cur)
            cur = [ln]
        elif cur is not None:
            cur.append(ln)
    if cur is not None:
        blocks.append(cur)
    return blocks


def block_sig(block_lines):
    # body is the lines after the header up to a blank line or the reply marker
    body = []
    for ln in block_lines[1:]:
        if ln.startswith("**Reply #") or ln.startswith("### Prompt #"):
            break
        body.append(ln)
    return norm("\n".join(body))


def renumber_block(block_lines, new_n):
    out = []
    for ln in block_lines:
        m = HEADER_RE.match(ln)
        if m:
            out.append(f"### Prompt #{new_n} — {m.group(2)}")
            continue
        ln = re.sub(r"^\*\*Reply #\d+:\*\*", f"**Reply #{new_n}:**", ln)
        out.append(ln)
    return out


def main():
    keep_sigs = collect_sigs([KEEP_TRANSCRIPT])
    drop_sigs = collect_sigs([DROP_TRANSCRIPT])
    pollution = drop_sigs - keep_sigs  # only what the polluting session added, not shared text
    content = open(LOG, encoding="utf-8").read()

    # Split into preamble + PROMPTs-ONLY section + full-conversation section.
    conv_match = list(re.finditer(r"^# full conversation[ \t]*$", content, re.MULTILINE))
    conv_idx = conv_match[-1].start()
    top = content[:conv_idx]
    bottom = content[conv_idx:]

    # In top: everything before the first "### Prompt" is the preamble (# PROMPTs ONLY + ---).
    first_top = re.search(r"^### Prompt #", top, re.MULTILINE)
    top_preamble = top[: first_top.start()].rstrip() if first_top else top.rstrip()
    top_body = top[first_top.start():] if first_top else ""

    first_bot = re.search(r"^### Prompt #", bottom, re.MULTILINE)
    bot_preamble = bottom[: first_bot.start()].rstrip() if first_bot else bottom.rstrip()
    bot_body = bottom[first_bot.start():] if first_bot else ""

    top_blocks = split_blocks(top_body)
    bot_blocks = split_blocks(bot_body)

    kept_top, kept_bot, dropped = [], [], 0
    for b in top_blocks:
        if block_sig(b) in pollution:
            dropped += 1
        else:
            kept_top.append(b)
    for b in bot_blocks:
        if block_sig(b) in pollution:
            pass
        else:
            kept_bot.append(b)

    # Renumber both sections 1..N (order preserved).
    new_top = "\n".join("\n".join(renumber_block(b, i + 1)).rstrip() for i, b in enumerate(kept_top))
    new_bot = "\n".join("\n".join(renumber_block(b, i + 1)).rstrip() for i, b in enumerate(kept_bot))

    out = (
        top_preamble.rstrip()
        + "\n\n"
        + new_top.strip()
        + "\n\n"
        + bot_preamble.rstrip()
        + "\n\n"
        + new_bot.strip()
        + "\n"
    )
    open(LOG, "w", encoding="utf-8").write(out)
    print(f"pollution sigs: {len(pollution)} | top kept {len(kept_top)}/{len(top_blocks)} | bottom kept {len(kept_bot)}/{len(bot_blocks)} | dropped {len(top_blocks)-len(kept_top)} prompts")


if __name__ == "__main__":
    main()
