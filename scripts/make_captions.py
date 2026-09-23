"""Turn a Whisper transcript (word timestamps) into caption groups + punch-ins.

Input: JSON list of segments {start, end, text, words: [[start, end, word, prob]]}
(faster-whisper, medium.en, word_timestamps=True).
Output: src/FullVideo/captions.json with
  groups:  [{s, e, w: [[start, end, text], ...]}]  -- 1-2 lines on screen
  punches: [[time, scale], ...]                    -- jump zooms in the car talk

Usage: python3 scripts/make_captions.py transcript.json src/FullVideo/captions.json
"""

import json
import sys

# Word fixes: (segment index, original word) -> corrected word.
FIXES = {
    (4, "in"): "than",
    (87, "Their"): "They're",
    (131, "or"): "at",
}

ABBREV = {"Mr.", "Mrs.", "Dr."}

MAX_WORDS = 6
MAX_CHARS = 30
GAP_BREAK = 0.5  # seconds of silence that starts a new caption
MAX_WORD = 1.2  # Whisper sometimes stretches a word across music; clamp it

PUNCH_FROM, PUNCH_TO = 233.7, 505.5
PUNCH_MIN_GAP = 4.0
PUNCH_CYCLE = [1.0, 1.14, 1.0, 1.24]


def main(src, dst):
    segments = json.load(open(src))
    words = []
    for si, seg in enumerate(segments):
        for start, end, text, _prob in seg["words"]:
            text = text.strip()
            if not text:
                continue
            text = FIXES.get((si, text), text)
            if end - start > MAX_WORD:
                start = end - 0.35
            # Fragments like "-shirts" or "'s" belong to the previous word.
            if words and text[0] in "-'" and start - words[-1][1] < 0.3:
                words[-1][1] = round(end, 3)
                words[-1][2] += text
                continue
            words.append([round(start, 3), round(end, 3), text])
    words.sort(key=lambda w: w[0])
    # A lone word far ahead of the next one was mis-timed: attach it to the next.
    for a, b in zip(words, words[1:]):
        if b[0] - a[1] > 5 and b[0] - a[0] > 5:
            a[0], a[1] = round(b[0] - 0.35, 3), round(b[0] - 0.05, 3)

    groups = []
    cur = []
    for w in words:
        if cur:
            prev = cur[-1]
            chars = sum(len(x[2]) + 1 for x in cur) + len(w[2])
            ends_sentence = prev[2][-1] in ".?!," and prev[2] not in ABBREV
            if (
                len(cur) >= MAX_WORDS
                or chars > MAX_CHARS
                or w[0] - prev[1] > GAP_BREAK
                or (ends_sentence and len(cur) >= 2)
            ):
                groups.append(cur)
                cur = []
        cur.append(w)
    if cur:
        groups.append(cur)

    out_groups = []
    for g in groups:
        s, e = g[0][0], g[-1][1]
        out_groups.append({"s": s, "e": round(max(e, s + 0.6), 3), "w": g})
    # Don't let a caption linger over the next one.
    for a, b in zip(out_groups, out_groups[1:]):
        a["e"] = min(a["e"], b["s"])

    # Jump zooms on sentence starts during the car talk.
    punches = [[0.0, 1.0]]
    last = -1e9
    k = 0
    prev_word = None
    for w in words:
        if PUNCH_FROM <= w[0] < PUNCH_TO:
            sentence_start = prev_word is None or (
                prev_word[2][-1] in ".?!" and prev_word[2] not in ABBREV
            )
            if sentence_start and w[0] - last >= PUNCH_MIN_GAP:
                k += 1
                punches.append([round(w[0] - 0.05, 3), PUNCH_CYCLE[k % len(PUNCH_CYCLE)]])
                last = w[0]
        prev_word = w
    punches.append([PUNCH_TO, 1.0])

    json.dump({"groups": out_groups, "punches": punches}, open(dst, "w"))
    print(f"{len(words)} words, {len(out_groups)} captions, {len(punches)} punches -> {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
