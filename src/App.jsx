import { useEffect, useState } from "react";
import "./App.css";

const STORAGE_KEY = "milk-time-counter-session";

function formatDuration(totalMs) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    "0",
  );
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function getStorageState() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {
        running: false,
        elapsedMs: 0,
        startedAt: null,
      };
    }

    const savedSession = window.localStorage.getItem(STORAGE_KEY);

    if (!savedSession) {
      return {
        running: false,
        elapsedMs: 0,
        startedAt: null,
      };
    }

    const parsed = JSON.parse(savedSession);

    return {
      running: Boolean(parsed.running),
      elapsedMs: Number(parsed.elapsedMs) || 0,
      startedAt: parsed.startedAt ? Number(parsed.startedAt) : null,
    };
  } catch {
    return {
      running: false,
      elapsedMs: 0,
      startedAt: null,
    };
  }
}

function App() {
  const [session, setSession] = useState(() => getStorageState());
  const [now, setNow] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!session.running) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(timerId);
  }, [session.running]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage failures so the app still renders on restricted browsers.
    }
  }, [session]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const liveElapsedMs = session.running && session.startedAt
    ? session.elapsedMs + Math.max(0, now - session.startedAt)
    : session.elapsedMs;

  const handleStartPause = () => {
    setNow(Date.now());
    setSession((currentSession) => {
      if (currentSession.running && currentSession.startedAt) {
        return {
          running: false,
          startedAt: null,
          elapsedMs:
            currentSession.elapsedMs + (Date.now() - currentSession.startedAt),
        };
      }

      return {
        ...currentSession,
        running: true,
        startedAt: Date.now(),
      };
    });
  };

  const handleReset = () => {
    setNow(Date.now());
    setSession({
      running: false,
      elapsedMs: 0,
      startedAt: null,
    });
  };

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  const startedLabel = session.startedAt
    ? new Date(session.startedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not started";
  const formattedDuration = formatDuration(liveElapsedMs);
  const totalMinutes = Math.floor(liveElapsedMs / 60000);
  const totalHours = (liveElapsedMs / 3600000).toFixed(1);

  return (
    <main className="app-shell">
      <div className="orb orb-one" aria-hidden="true" />
      <div className="orb orb-two" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <section className="hero-panel">
        <div className="hero-top">
          <p className="brand-mark">MILK MODE</p>
          <div className="eyebrow-row">
            <span className={`status-pill ${session.running ? "live" : "idle"}`}>
              {session.running ? "On the clock" : "Idle"}
            </span>
            <span className="status-pill subtle">Started: {startedLabel}</span>
          </div>
        </div>

        <div className="hero-main">
          <div className="timer-block">
            <p className="section-label">Focus session</p>
            <div className="timer-shell" data-time={formattedDuration}>
              <h1 className="timer">{formattedDuration}</h1>
            </div>
          </div>

          <div className="message-block">
            <p className="warning">DON&apos;T GET DISTRACTED ASSHOLE</p>
            <div className="metric-row" aria-label="Session metrics">
              <div className="metric-card">
                <span className="metric-label">minutes</span>
                <strong className="metric-value">{totalMinutes}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">hours</span>
                <strong className="metric-value">{totalHours}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">mode</span>
                <strong className="metric-value">
                  {session.running ? "locked" : "paused"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-bottom">
          <div>
            <p className="signature">made with &#10084; by Kushal for kushal.</p>
            <p className="hint-line">secondary monitor fuel for deep work, code, study, and shipping</p>
          </div>

          <div className="control-row">
            <button type="button" className="action action-primary" onClick={handleStartPause}>
              {session.running ? "Pause" : liveElapsedMs > 0 ? "Resume" : "Start"}
            </button>
            <button type="button" className="action" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="action" onClick={handleFullscreen}>
              {isFullscreen ? "Exit fullscreen" : "Go fullscreen"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
