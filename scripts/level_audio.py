"""Even out the footage's audio so quiet sections match the loud ones.

The car talk sits ~9 dB and the night scenes ~13 dB below the morning. This
applies a slow, smoothed gain curve (no pumping) toward a common level, then
a soft limiter. Final loudness normalization (-14 LUFS for YouTube) is done
by ffmpeg's loudnorm afterwards (see `npm run level-audio`).

Usage: python3 scripts/level_audio.py in.wav out.wav
"""

import sys
import wave

import numpy as np

TARGET_DB = -18.0  # level for the "active" (speaking) part of each window
MAX_BOOST_DB = 14.0
MAX_CUT_DB = -6.0
WINDOW_S = 1.0
SMOOTH_S = 8.0  # gain changes are spread over ~8 seconds


def main(src, dst):
    with wave.open(src) as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32)
    x = x.reshape(-1, ch) / 32768.0
    mono = x.mean(axis=1)

    # Loudness of the active half of each window, so pauses don't count.
    hop = int(sr * WINDOW_S)
    sub = hop // 10
    levels = []
    for i in range(0, len(mono), hop):
        seg = mono[i : i + hop]
        seg = seg[: len(seg) // sub * sub].reshape(-1, sub)
        if len(seg) == 0:
            levels.append(levels[-1] if levels else TARGET_DB)
            continue
        r = np.sqrt((seg**2).mean(axis=1))
        active = np.sort(r)[len(r) // 2 :]
        levels.append(20 * np.log10(np.sqrt((active**2).mean()) + 1e-9))
    levels = np.array(levels)

    # Silence (below -45 dB) keeps the neighbouring gain instead of being boosted.
    quiet = levels < -45
    levels[quiet] = np.interp(np.flatnonzero(quiet), np.flatnonzero(~quiet), levels[~quiet])

    gain_db = np.clip(TARGET_DB - levels, MAX_CUT_DB, MAX_BOOST_DB)
    k = int(SMOOTH_S / WINDOW_S)
    kernel = np.hanning(2 * k + 1)
    kernel /= kernel.sum()
    padded = np.pad(gain_db, k, mode="edge")
    gain_db = np.convolve(padded, kernel, mode="valid")

    centers = (np.arange(len(gain_db)) + 0.5) * hop
    gain = 10 ** (np.interp(np.arange(len(mono)), centers, gain_db) / 20)
    y = x * gain[:, None]

    # Soft limiter so boosted peaks don't clip.
    y = np.tanh(y * 1.2) / 1.2

    pcm = (np.clip(y, -1, 1) * 32767).astype("<i2")
    with wave.open(dst, "wb") as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    for t in range(0, len(gain_db), 30):
        print(f"{t // 60}:{t % 60:02d} {gain_db[t]:+.1f} dB", end="  ")
    print(f"\nwrote {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
