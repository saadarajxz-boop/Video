"""Synthesize an original, royalty-free "epic trailer" sound bed.

Everything here is generated from oscillators and noise, so there is no
copyrighted material in the output. Cue times come from a JSON file written
by the Trailer composition's edit (see scripts/cues.json):

  {
    "duration": 19.5,          # seconds
    "cuts": [2.0, 3.0, ...],   # every shot change
    "build": [7.0, 13.0],      # window where the pulse accelerates with the cuts
    "hero": 13.4,              # the big drop (flash)
    "end": 17.0,               # end card hit
    "braams": [0.0],           # extra low brass hits
    "duck": [[0.2, 2.1], ...]  # dialogue windows: score dips under the voice
  }

Usage: python3 scripts/make_score.py scripts/cues.json public/trailer/score.wav
"""

import json
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def lowpass(x, cutoff):
    """One-pole low-pass; cutoff may be a scalar or a per-sample array."""
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def saw(freq, t):
    phase = (freq * t) % 1.0
    return 2 * phase - 1


def env(t, attack, decay):
    return np.minimum(t / max(attack, 1e-4), 1) * np.exp(-np.maximum(t - attack, 0) / decay)


def place(buf, sig, at, gain=1.0):
    start = int(at * SR)
    if start >= len(buf):
        return
    end = min(len(buf), start + len(sig))
    buf[start:end] += sig[: end - start] * gain


def boom(length=2.5, f0=110, f1=32):
    """Sub impact: a pitch-dropping sine with a noisy transient."""
    t = t_axis(length)
    freq = f1 + (f0 - f1) * np.exp(-t * 18)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * env(t, 0.002, 0.9)
    click = lowpass(rng.standard_normal(len(t)), 2500) * env(t, 0.001, 0.03)
    return body + 0.6 * click


def braam(length=3.5, root=55.0):
    """Low brass-like swell: detuned saws with an opening then closing filter."""
    t = t_axis(length)
    tone = np.zeros_like(t)
    for mult, gain in [(1, 1.0), (1.5, 0.6), (2, 0.7), (3, 0.25)]:
        for detune in (-0.6, 0.0, 0.7):
            tone += gain * saw(root * mult + detune, t)
    cutoff = 200 + 1400 * env(t, 0.12, 0.8)
    tone = lowpass(lowpass(tone, cutoff), cutoff)
    return tone / 6 * env(t, 0.06, 1.3)


def hit(length=0.6):
    """Short taiko-ish drum for the pulse."""
    t = t_axis(length)
    freq = 45 + 90 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(t, 0.001, 0.18)
    skin = lowpass(rng.standard_normal(len(t)), 1200) * env(t, 0.001, 0.04)
    return body + 0.35 * skin


def whoosh(length=0.45):
    t = t_axis(length)
    noise = rng.standard_normal(len(t))
    sweep = 300 + 5000 * np.sin(np.pi * t / length) ** 2
    return lowpass(noise, sweep) * np.sin(np.pi * t / length) ** 2


def riser(length):
    """Filtered noise plus a climbing tone that stops dead at the drop."""
    t = t_axis(length)
    ramp = (t / length) ** 2
    noise = lowpass(rng.standard_normal(len(t)), 400 + 7000 * ramp)
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * ramp) / SR)
    return (0.7 * noise + 0.25 * tone) * ramp


def drone(seconds, swell):
    """Dark pad under everything; `swell` is a per-sample 0..1 intensity."""
    t = t_axis(seconds)
    pad = sum(saw(f, t) for f in (55.0, 55.3, 82.4, 110.2)) / 4
    pad = lowpass(pad, 150 + 500 * swell)
    return pad * (0.25 + 0.75 * swell)


def reverb(x, mix=0.25):
    """Cheap feedback-delay reverb so hits have a tail."""
    out = x.copy()
    for delay_ms, gain in [(37, 0.5), (53, 0.45), (71, 0.4), (97, 0.35)]:
        d = int(SR * delay_ms / 1000)
        tail = np.zeros_like(x)
        for k in range(1, 12):
            if d * k >= len(x):
                break
            tail[d * k :] += x[: len(x) - d * k] * gain**k
        out += tail * mix / 4
    return lowpass(out, 6000)


def main(cue_path, out_path):
    cues = json.load(open(cue_path))
    dur = cues["duration"]
    n = int(dur * SR)
    t = t_axis(dur)
    hero, end = cues["hero"], cues["end"]
    b0, b1 = cues["build"]

    # Intensity curve: calm open, climbs through the build, peaks at the hero,
    # settles, then a final lift into the end card.
    swell = np.interp(t, [0, b0, hero - 0.3, hero, end - 0.5, end, dur], [0.2, 0.35, 1.0, 0.9, 0.5, 0.8, 0.0])

    music = drone(dur, swell) * 0.5
    fx = np.zeros(n)

    for at in cues.get("braams", []):
        place(music, braam(), at, 0.9)
    # Pulse: a drum on every cut inside the build window, getting louder.
    for c in cues["cuts"]:
        if b0 <= c < hero - 0.3:
            place(fx, hit(), c, 0.45 + 0.5 * (c - b0) / (hero - b0))
        elif c < b0:
            place(fx, whoosh(), c - 0.2, 0.25)
    # Riser into the drop, then 0.3s of near-silence before the hit.
    rise = riser(hero - 0.3 - b0)
    place(fx, rise, b0, 0.35)
    gap = (t > hero - 0.3) & (t < hero)
    music[gap] *= 0.15
    place(music, braam(4.0, 41.2), hero, 1.2)
    place(fx, boom(3.0), hero, 1.0)
    place(fx, boom(3.0, 90, 28), end, 0.9)
    place(music, braam(3.0, 55.0), end, 0.8)

    mix = reverb(music + fx * 0.8, mix=0.3)

    # Duck under dialogue so every line stays clear.
    duck = np.ones(n)
    for s, e in cues.get("duck", []):
        duck = np.minimum(duck, np.interp(t, [s - 0.15, s, e, e + 0.25], [1, 0.4, 0.4, 1], left=1, right=1))
    mix *= duck

    fade = np.clip((dur - t) / 0.8, 0, 1)
    mix *= fade
    # Soft saturation lifts the drone and drums relative to the big hits.
    mix /= np.max(np.abs(mix)) + 1e-9
    mix = np.tanh(mix * 3.0)
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.89  # -1 dBFS peak

    stereo = np.stack([mix, np.roll(mix, int(SR * 0.012))], axis=1)
    pcm = (stereo * 32767).astype("<i2")
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"wrote {out_path} ({dur:.2f}s)")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
