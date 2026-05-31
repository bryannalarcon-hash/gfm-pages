#!/usr/bin/env python3
"""Backfill a claude-*-conversation.md from a Claude Code session transcript (.jsonl).

The live logger (scripts/prompt_logger.py) captures the planner session incrementally via
hooks. For sessions where the hook wasn't pointed at a per-phase file (e.g. the coder phase),
this rebuilds the same two-section format from the transcript after the fact, reusing the
logger's rules:
  - skip subagent sidechain lines (isSidechain)
  - drop background <task-notification> "prompts" (is_noise)
  - a prompt's reply is the last MAIN-agent assistant text AFTER the last tool_use in that
    prompt's turn span (a preamble always precedes a tool call, so it never wins)
  - trivial echoes ("No response requested.") never clobber a real reply

Editorial: standalone <system-reminder> turns (session-injected context, not real prompts)
are skipped; trailing/embedded <system-reminder> blocks are stripped from prompt bodies;
slash-command wrappers are rendered readably; identical autonomous-loop tick boilerplate is
collapsed to a one-line marker. These are noted in the file header so the log stays honest.

Usage: python3 scripts/backfill_conversation.py <transcript.jsonl> <out.md>
"""
import json
import re
import sys
from datetime import datetime

TRIVIAL = {"no response requested.", ""}


def to_ts(iso):
    if not iso:
        return ""
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone().strftime(
            "%Y-%m-%d %H:%M:%S %Z"
        )
    except Exception:
        return iso


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(
            b.get("text", "")
            for b in content
            if isinstance(b, dict) and b.get("type") == "text"
        )
    return ""


def has_tool(content):
    return isinstance(content, list) and any(
        isinstance(b, dict) and b.get("type") == "tool_use" for b in content
    )


def is_tool_result_only(content):
    return isinstance(content, list) and content and all(
        isinstance(b, dict) and b.get("type") == "tool_result" for b in content
    )


def strip_reminders(s):
    return re.sub(r"<system-reminder>.*?</system-reminder>", "", s, flags=re.DOTALL)


def clean_prompt(raw):
    s = raw
    # Render slash commands readably: <command-name>/x</command-name> ... <command-args>y</...>
    name = re.search(r"<command-name>(.*?)</command-name>", s, re.DOTALL)
    args = re.search(r"<command-args>(.*?)</command-args>", s, re.DOTALL)
    if name:
        cmd = name.group(1).strip()
        a = (args.group(1).strip() if args else "")
        return (cmd + ((" " + a) if a else "")).strip()
    s = strip_reminders(s)
    # Drop local-command echo blocks
    s = re.sub(r"<local-command-stdout>.*?</local-command-stdout>", "", s, flags=re.DOTALL)
    s = re.sub(r"<command-message>.*?</command-message>", "", s, flags=re.DOTALL)
    return s.strip()


def is_real_prompt(raw):
    s = (raw or "").lstrip()
    if not s:
        return False
    if s.startswith("<task-notification"):
        return False
    # Pure system-reminder injection (no real content) → not a prompt
    if not strip_reminders(s).strip() and "<command-name>" not in s:
        return False
    return True


AUTOLOOP_RE = re.compile(r"autonomous[- ]loop", re.IGNORECASE)


def collapse_autoloop(prompt):
    if AUTOLOOP_RE.search(prompt) and ("loop tick" in prompt.lower() or "loop check" in prompt.lower()):
        return "[Autonomous loop tick — continue toward the /goal build]"
    return prompt


def main():
    src, out = sys.argv[1], sys.argv[2]
    # Collect ordered events: ('prompt', text, ts) and ('reply_text', text) / ('tool',)
    turns = []  # list of dicts: {prompt, ts, replies:[(text, after_tool_flag)]}
    cur = None
    with open(src, encoding="utf-8") as f:
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
            # Harness-injected, non-user messages (Stop-hook notices, autonomous-loop ticks,
            # "Continue" resume nudges, slash-command stdout) are flagged isMeta — only count
            # prompts the user actually typed.
            if o.get("isMeta"):
                continue
            m = o.get("message") or {}
            role = m.get("role")
            content = m.get("content")
            ts = o.get("timestamp")
            if role == "user":
                if is_tool_result_only(content):
                    continue
                raw = text_of(content) if isinstance(content, list) else (content if isinstance(content, str) else "")
                if not is_real_prompt(raw):
                    continue
                body = collapse_autoloop(clean_prompt(raw))
                if not body:
                    continue
                cur = {"prompt": body, "ts": to_ts(ts), "seq": []}
                turns.append(cur)
            elif role == "assistant" and cur is not None:
                t = text_of(content).strip()
                ht = has_tool(content)
                if ht:
                    cur["seq"].append(("tool", ""))
                if t and t.lower() not in TRIVIAL:
                    cur["seq"].append(("text", t))

    # Resolve each turn's final reply: last text AFTER the last tool in the turn; else last text.
    for t in turns:
        last_tool_i = max((i for i, (k, _) in enumerate(t["seq"]) if k == "tool"), default=-1)
        after = [v for i, (k, v) in enumerate(t["seq"]) if k == "text" and i > last_tool_i]
        anytext = [v for (k, v) in t["seq"] if k == "text"]
        t["reply"] = (after[-1] if after else (anytext[-1] if anytext else ""))

    header = (
        "# Coder / Implementation phase — AI usage log\n\n"
        "> Rebuilt from the Claude Code session transcript by `scripts/backfill_conversation.py`,\n"
        "> in the same two-section format as `claude-planner-conversation.md` (see\n"
        "> `scripts/prompt-logging-instruct.md`). Subagent (sidechain) output and background\n"
        "> task-notifications are excluded; replies are the final synthesized message per turn.\n"
        "> Only real user-typed prompts are kept — harness-injected messages (isMeta: Stop-hook\n"
        "> notices, autonomous-loop ticks, 'Continue' resume nudges) are dropped.\n\n"
    )

    only = ["# PROMPTs ONLY\n"]
    full = ["# full conversation\n"]
    for i, t in enumerate(turns, 1):
        head = "### Prompt #%d — %s\n%s\n" % (i, t["ts"], t["prompt"])
        only.append("\n" + head)
        full.append("\n" + head)
        if t["reply"]:
            full.append("\n**Reply #%d:**\n%s\n" % (i, t["reply"]))

    with open(out, "w", encoding="utf-8") as fh:
        fh.write(header)
        fh.write("".join(only).rstrip() + "\n\n---\n\n")
        fh.write("".join(full).rstrip() + "\n")

    print("wrote %s — %d prompts, %d with replies" % (out, len(turns), sum(1 for t in turns if t["reply"])))


if __name__ == "__main__":
    main()
