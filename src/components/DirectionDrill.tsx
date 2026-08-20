import { useEffect, useRef, useState } from "react";

/**
 * Classroom "Simon says" drill for bow/stern/port/starboard: calls out a
 * random direction (shown big and spoken aloud) and leaves you to do the
 * motion — no scoring, since there's no way to see whether you actually
 * did it. Just a reflex-building metronome.
 */
interface DirectionSpec {
  id: string;
  word: string;
  /** Text actually sent to the speech engine, when it differs from the displayed word. */
  spoken?: string;
  instruction: string;
  color: string;
}

const DIRECTIONS: DirectionSpec[] = [
  {
    id: "bow",
    word: "Bow",
    // Most TTS voices default "bow" to the bow-tie/violin-bow reading. "Bough" is a homophone
    // of the "rhymes with how" nautical reading, so speaking it says the right sound without
    // changing what's shown on screen.
    spoken: "Bough",
    instruction: "Both hands out in front, together, pointing forward.",
    color: "var(--gold)",
  },
  { id: "stern", word: "Stern", instruction: "Both hands behind your back.", color: "var(--deep)" },
  { id: "port", word: "Port", instruction: "Both hands out to your left.", color: "var(--rust)" },
  { id: "starboard", word: "Starboard", instruction: "Both hands out to your right.", color: "#4a8f72" },
];

const MIN_MS = 800;
const MAX_MS = 4000;

function pickNext(excludeId: string | null): DirectionSpec {
  const choices = excludeId ? DIRECTIONS.filter((d) => d.id !== excludeId) : DIRECTIONS;
  return choices[Math.floor(Math.random() * choices.length)];
}

export default function DirectionDrill() {
  const [current, setCurrent] = useState<DirectionSpec | null>(null);
  const [running, setRunning] = useState(false);
  const [speedMs, setSpeedMs] = useState(2500);
  const [audioOn, setAudioOn] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>("");
  const currentRef = useRef<DirectionSpec | null>(null);
  const audioOnRef = useRef(audioOn);
  const voiceURIRef = useRef(voiceURI);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    audioOnRef.current = audioOn;
  }, [audioOn]);

  useEffect(() => {
    voiceURIRef.current = voiceURI;
  }, [voiceURI]);

  useEffect(() => {
    voicesRef.current = voices;
  }, [voices]);

  // Voice list often arrives async (Chrome fires "voiceschanged" once it's loaded them).
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      setVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  function callNext() {
    const next = pickNext(currentRef.current?.id ?? null);
    setCurrent(next);
    if (audioOnRef.current && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(next.spoken ?? next.word);
      const voice = voicesRef.current.find((v) => v.voiceURI === voiceURIRef.current);
      if (voice) utter.voice = voice;
      window.speechSynthesis.speak(utter);
    }
  }

  useEffect(() => {
    if (!running) return;
    callNext();
    const id = window.setInterval(callNext, speedMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speedMs]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Direction drill — bow, stern, port, starboard
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {DIRECTIONS.map((d) => (
          <div
            key={d.id}
            style={{
              flex: "1 1 150px",
              border: `1px solid ${d.color}`,
              borderRadius: 8,
              padding: "8px 10px",
              background: "var(--paper-card)",
            }}
          >
            <div style={{ color: d.color, fontWeight: "bold", fontSize: "0.95rem" }}>{d.word}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.35, marginTop: 2 }}>
              {d.instruction}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          minHeight: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${current ? current.color : "var(--line)"}`,
          borderRadius: 10,
          background: "var(--paper)",
          marginBottom: 14,
          cursor: running ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={() => running && callNext()}
        title={running ? "Tap to call the next one early" : undefined}
      >
        {current ? (
          <span style={{ color: current.color, fontSize: "2.6rem", fontWeight: "bold" }}>{current.word}</span>
        ) : (
          <span style={{ color: "var(--muted)", fontSize: "1rem" }}>Press start</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? "Stop" : "Start"}
        </button>
        <button className="btn" onClick={() => setAudioOn((a) => !a)}>
          {audioOn ? "🔊 Sound on" : "🔇 Sound off"}
        </button>
        {audioOn && voices.length > 0 && (
          <select
            className="btn"
            value={voiceURI}
            onChange={(e) => setVoiceURI(e.target.value)}
            aria-label="Voice"
            style={{ fontWeight: "normal" }}
          >
            <option value="">Default voice</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="drill-speed" style={{ fontSize: "0.85rem", color: "var(--muted-strong)" }}>
          Call every <b>{(speedMs / 1000).toFixed(1)}s</b>
        </label>
        <input
          id="drill-speed"
          type="range"
          min={MIN_MS}
          max={MAX_MS}
          step={100}
          value={speedMs}
          onChange={(e) => setSpeedMs(Number(e.target.value))}
          style={{ width: "100%", display: "block", marginTop: 6 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: "var(--label)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>

      <div className="callout" style={{ marginTop: 12 }}>
        No scoring here — the app can't see you do the motion, so this is just a caller. React with the motion
        for whatever's called, out loud or on your feet. Bonus real-world hook: on the water a boat's running
        lights are red to port, green to starboard — same side either way.
      </div>
    </div>
  );
}
