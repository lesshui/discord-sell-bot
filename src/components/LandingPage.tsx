"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

/* ─── Logo: kawaii corn mascot ─── */
function LogoMark({ size = 48 }: { size?: number }) {
  const stroke = "#1f3a3a";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="#FFE873">
        <path d="M8 22 L9 25 L12 26 L9 27 L8 30 L7 27 L4 26 L7 25 Z"/>
        <path d="M57 18 L58 20.5 L60.5 21.5 L58 22.5 L57 25 L56 22.5 L53.5 21.5 L56 20.5 Z"/>
        <path d="M55 46 L56 47.8 L57.8 48.5 L56 49.2 L55 51 L54 49.2 L52.2 48.5 L54 47.8 Z"/>
        <path d="M10 50 L10.7 51.5 L12.2 52 L10.7 52.5 L10 54 L9.3 52.5 L7.8 52 L9.3 51.5 Z"/>
      </g>
      <path d="M32 8 C 28 14 20 22 10 32 C 14 44 24 54 32 58 C 30 50 28 38 28 28 C 28 20 30 13 32 8 Z"
        fill="#82C975" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M28 30 C 22 38 18 46 22 52" stroke={stroke} strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M32 8 C 36 14 44 22 54 32 C 50 44 40 54 32 58 C 34 50 36 38 36 28 C 36 20 34 13 32 8 Z"
        fill="#82C975" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M36 30 C 42 38 46 46 42 52" stroke={stroke} strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M26 14 C 20 22 14 30 12 36" stroke="#A8DF9A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M38 14 C 44 22 50 30 52 36" stroke="#A8DF9A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M29 9 C 27 6 30 3 32 4 C 34 3 37 6 35 9 Z"
        fill="#5DAF52" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M30 5 C 28 4 27 6 28 7" stroke={stroke} strokeWidth="1" fill="none"/>
      <path d="M34 5 C 36 4 37 6 36 7" stroke={stroke} strokeWidth="1" fill="none"/>
      <path d="M32 10 C 24 14 21 24 22 38 C 23 48 28 54 32 54 C 36 54 41 48 42 38 C 43 24 40 14 32 10 Z"
        fill="#FFE15A" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round"/>
      <g stroke={stroke} strokeWidth="0.55">
        <ellipse cx="32" cy="14.5" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="29" cy="18" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="35" cy="18" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="26" cy="22" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="32" cy="22" rx="2" ry="2.2" fill="#FFF6B0"/>
        <ellipse cx="38" cy="22" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="25" cy="26" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="29" cy="26" rx="2" ry="2.2" fill="#FFF6B0"/>
        <ellipse cx="35" cy="26" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="39" cy="26" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="24.5" cy="30" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="39.5" cy="30" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="25" cy="38" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="39" cy="38" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="26" cy="42" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="32" cy="42" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="38" cy="42" rx="2" ry="2.2" fill="#FFF6B0"/>
        <ellipse cx="28" cy="46" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="32" cy="46" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="36" cy="46" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="30" cy="50" rx="1.8" ry="2" fill="#FFEE7A"/>
        <ellipse cx="34" cy="50" rx="1.8" ry="2" fill="#FFE15A"/>
      </g>
      <ellipse cx="24" cy="36" rx="2.6" ry="1.8" fill="#FF95A8" opacity="0.85"/>
      <ellipse cx="40" cy="36" rx="2.6" ry="1.8" fill="#FF95A8" opacity="0.85"/>
      <ellipse cx="28" cy="31" rx="2.4" ry="3" fill={stroke}/>
      <ellipse cx="36" cy="31" rx="2.4" ry="3" fill={stroke}/>
      <ellipse cx="28.8" cy="30" rx="0.8" ry="1" fill="#ffffff"/>
      <ellipse cx="36.8" cy="30" rx="0.8" ry="1" fill="#ffffff"/>
      <path d="M28 36 C 29 41 35 41 36 36 Z" fill="#FFFFFF" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M30.5 38.8 C 31 41 33 41 33.5 38.8 Z" fill="#FF7A93"/>
    </svg>
  );
}

/* ─── Discord icon ─── */
function DiscordGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.5 5.5C18 4.7 16.4 4.2 14.7 4l-.2.4c1.5.3 2.9.9 4.2 1.7-1.5-.8-3.2-1.3-5-1.5-1.5-.2-3-.1-4.4.2-.2 0-.3 0-.5.1C7.4 5 6.1 5.4 4.8 6.1c1.3-.8 2.7-1.4 4.2-1.7L8.7 4C7 4.2 5.4 4.7 4 5.5 2.4 8.4 1.6 11.6 1.8 14.9c1.6 1.2 3.4 2 5.3 2.5.4-.6.8-1.2 1.1-1.9-.6-.2-1.2-.5-1.8-.9.2-.1.3-.2.5-.3 3.5 1.6 7.3 1.6 10.8 0 .2.1.3.2.5.3-.6.4-1.2.6-1.8.9.3.7.7 1.3 1.1 1.9 1.9-.5 3.7-1.4 5.3-2.5.3-3.6-.6-7-2.3-9.4ZM8.5 13.3c-1 0-1.9-.9-1.9-2.1 0-1.1.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.8 2.1-1.9 2.1Zm7 0c-1 0-1.9-.9-1.9-2.1 0-1.1.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.8 2.1-1.9 2.1Z"
        fill="currentColor"/>
    </svg>
  );
}

/* ─── Spinner ─── */
function Spinner() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ animation: "lp-spin 0.9s linear infinite" }}>
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" fill="none"/>
      <path d="M21 12 a9 9 0 0 0-9-9" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

/* ─── Atmosphere: background grid + glow ─── */
function Atmosphere() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden="true">
      <div style={{
        position: "absolute", top: "50%", left: "50%", width: 1100, height: 1100,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(circle, rgba(84,87,217,0.08) 0%, rgba(224,74,59,0.04) 35%, transparent 65%)",
        filter: "blur(20px)"
      }}/>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} width="100%" height="100%">
        <defs>
          <pattern id="lp-grid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(15,20,25,0.06)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="lp-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <mask id="lp-gridMask">
            <rect width="100%" height="100%" fill="url(#lp-fade)"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#lp-grid)" mask="url(#lp-gridMask)"/>
      </svg>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 220,
        background: "linear-gradient(180deg, transparent, rgba(245,246,248,0.6))"
      }}/>
    </div>
  );
}

/* ─── 3D cardboard box ─── */
function Box3D({ size = 70, variant = 0, animDelay = 0, animDuration = 16 }: {
  size?: number; variant?: number; animDelay?: number; animDuration?: number;
}) {
  const palettes = [
    { face: "#B8854F", side: "#8E6336", top: "#D4A66E", tape: "#E8D4A0", stroke: "#3a2412" },
    { face: "#A07248", side: "#7A5430", top: "#C39866", tape: "#DCC189", stroke: "#3a2412" },
    { face: "#C28E5C", side: "#946A40", top: "#E0B782", tape: "#F0DCA8", stroke: "#3a2412" },
  ];
  const c = palettes[variant % palettes.length];
  const s = size;
  const half = s / 2;

  return (
    <div
      className="lp-pkg-3d"
      style={{
        ["--s" as string]: s + "px",
        ["--half" as string]: half + "px",
        ["--dur" as string]: animDuration + "s",
        animationDelay: animDelay + "s",
      }}
    >
      <div className="lp-pkg-cube">
        <div className="lp-face lp-face-front" style={{ background: c.face, borderColor: c.stroke }}>
          <div className="lp-tape lp-tape-v" style={{ background: c.tape, borderColor: c.stroke }}/>
          <div className="lp-label">
            <div className="lp-label-line"/>
            <div className="lp-label-line"/>
            <div className="lp-label-line lp-short"/>
          </div>
        </div>
        <div className="lp-face lp-face-back" style={{ background: c.face, borderColor: c.stroke }}>
          <div className="lp-tape lp-tape-v" style={{ background: c.tape, borderColor: c.stroke }}/>
        </div>
        <div className="lp-face lp-face-right" style={{ background: c.side, borderColor: c.stroke }}/>
        <div className="lp-face lp-face-left" style={{ background: c.side, borderColor: c.stroke }}/>
        <div className="lp-face lp-face-top" style={{ background: c.top, borderColor: c.stroke }}>
          <div className="lp-tape lp-tape-h" style={{ background: c.tape, borderColor: c.stroke }}/>
          <div className="lp-flap-seam"/>
        </div>
        <div className="lp-face lp-face-bottom" style={{ background: c.side, borderColor: c.stroke }}/>
      </div>
      <div className="lp-pkg-shadow"/>
    </div>
  );
}

/* ─── 3D Conveyor Belt ─── */
function ConveyorBelt3D({ packageCount = 7, speed = 16, pkgYOffset = 152, beltTilt = 0, beltY = 36 }: {
  packageCount?: number; speed?: number; pkgYOffset?: number; beltTilt?: number; beltY?: number;
}) {
  const sizes = [54, 96, 68, 118, 78, 88, 60, 104];

  return (
    <div
      className="lp-belt-stage"
      style={{
        ["--pkg-y" as string]: pkgYOffset + "px",
        ["--belt-tilt" as string]: beltTilt + "deg",
        ["--belt-y" as string]: beltY + "%",
      }}
      aria-hidden="true"
    >
      <div className="lp-belt-scene">
        <div className="lp-leg lp-leg-l"/>
        <div className="lp-leg lp-leg-r"/>
        <div className="lp-roller lp-roller-l"/>
        <div className="lp-roller lp-roller-r"/>
        <div className="lp-belt-top">
          <div className="lp-belt-tread"/>
          <div className="lp-belt-edge lp-belt-edge-near"/>
          <div className="lp-belt-edge lp-belt-edge-far"/>
        </div>
        <div className="lp-belt-side lp-belt-side-front">
          <div className="lp-belt-side-stripe"/>
          {[8, 28, 48, 68, 88].map((l) => (
            <div key={l} className="lp-belt-side-bolt" style={{ left: `${l}%` }}/>
          ))}
        </div>
        <div className="lp-pkg-track">
          {Array.from({ length: packageCount }).map((_, i) => {
            const size = sizes[i % sizes.length];
            const delay = -((i * speed) / packageCount);
            return (
              <Box3D key={i} variant={i % 3} size={size} animDelay={delay} animDuration={speed}/>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Package Factory background ─── */
function PackageFactory({ pkgYOffset = 152, beltTilt = 0, beltY = 36 }: {
  pkgYOffset?: number; beltTilt?: number; beltY?: number;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }} aria-hidden="true">
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, transparent 0%, transparent 55%, rgba(225,228,235,0.5) 100%), radial-gradient(ellipse 80% 50% at 50% 90%, rgba(200,206,218,0.45) 0%, transparent 65%)"
      }}/>
      <ConveyorBelt3D pkgYOffset={pkgYOffset} beltTilt={beltTilt} beltY={beltY}/>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 60% 50% at 50% 42%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 35%, transparent 65%)",
        zIndex: 8
      }}/>
    </div>
  );
}

/* ─── Landing Page ─── */
export default function LandingPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "redirecting">("idle");

  const handleLogin = () => {
    if (status !== "idle") return;
    setStatus("loading");
    setTimeout(() => setStatus("redirecting"), 900);
    void signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      background: "#fff7e6",
      fontFamily: "'Geist', system-ui, -apple-system, sans-serif",
      color: "#0f1419",
      WebkitFontSmoothing: "antialiased",
      zIndex: 9999,
    }}>
      <Atmosphere/>
      <PackageFactory/>

      {/* ── Header ── */}
      <header style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "28px 36px", display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 11, pointerEvents: "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LogoMark size={60}/>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, lineHeight: 1 }}>
            <span style={{
              fontFamily: `"Cinq", "Cinq Display", Arial, system-ui, sans-serif`,
              fontWeight: 900,
              letterSpacing: -1,
              fontSize: 30,
              color: "#0f1419",
            }}>COB</span>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 999,
          background: "rgba(15,20,25,0.03)", border: "1px solid rgba(15,20,25,0.10)",
          fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 10.5,
          color: "#4a5260", letterSpacing: 1.2
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c07a", boxShadow: "0 0 8px rgba(34,192,122,0.5)", display: "inline-block" }}/>
          <span style={{ fontWeight: 500 }}>OFFERS LIVE</span>
        </div>
      </header>

      {/* ── Hero ── */}
      <main style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, zIndex: 10, pointerEvents: "none"
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
          maxWidth: 640, textAlign: "center", pointerEvents: "auto"
        }}>
          {/* Eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "7px 14px", borderRadius: 999,
            background: "rgba(224,74,59,0.08)", border: "1px solid rgba(224,74,59,0.28)",
            fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 11,
            color: "#c43e30", letterSpacing: 1.4
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E04A3B", boxShadow: "0 0 10px rgba(224,74,59,0.5)", display: "inline-block" }}/>
            INSTANT OFFERS · POKÉMON TCG
          </div>

          {/* Wordmark */}
          <h1 style={{
            margin: 0, fontWeight: 700,
            fontSize: "clamp(64px, 11vw, 132px)",
            lineHeight: 0.92, letterSpacing: "-0.045em",
            display: "flex", gap: "0.08em", alignItems: "baseline",
            flexWrap: "wrap", justifyContent: "center"
          }}>
            <span style={{
              background: "linear-gradient(180deg, #0f1419 0%, #4a5260 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
            }}>Cashout</span>
            <span style={{
              fontWeight: 300, fontStyle: "italic",
              color: "#E04A3B",
              fontFamily: "'Geist', serif",
              WebkitTextFillColor: "#E04A3B"
            }}>Bot</span>
          </h1>

          {/* Tagline */}
          <p style={{ margin: 0, fontSize: 17, color: "#4a5260", maxWidth: 460, lineHeight: 1.55 }}>
            Find your product. Get an offer in seconds. Cash out automatically upon review &amp; arrival.
          </p>

          {/* CTA */}
          <button
            onClick={handleLogin}
            disabled={status !== "idle"}
            aria-label="Login via Discord"
            style={{
              marginTop: 8,
              display: "inline-flex", alignItems: "center", gap: 14,
              padding: "15px 22px 15px 18px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.06)",
              background: status !== "idle" ? "#4448c4" : "#5457d9",
              color: "white",
              fontFamily: "'Geist', system-ui, sans-serif",
              fontSize: 16, fontWeight: 600,
              cursor: status !== "idle" ? "wait" : "pointer",
              boxShadow: "0 10px 30px rgba(84,87,217,0.28), 0 2px 6px rgba(15,20,25,0.08), inset 0 1px 0 rgba(255,255,255,0.18)",
              transition: "background .15s ease",
              minWidth: 280, justifyContent: "center"
            }}
            onMouseEnter={(e) => { if (status === "idle") (e.currentTarget as HTMLButtonElement).style.background = "#6366ec"; }}
            onMouseLeave={(e) => { if (status === "idle") (e.currentTarget as HTMLButtonElement).style.background = "#5457d9"; }}
            onMouseDown={(e) => { if (status === "idle") (e.currentTarget as HTMLButtonElement).style.background = "#4448c4"; }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, color: "white" }}>
              {status === "loading" ? <Spinner/> : <DiscordGlyph size={20}/>}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>
              {status === "idle" && "Login via Discord"}
              {status === "loading" && "Connecting…"}
              {status === "redirecting" && "Redirecting to Discord…"}
            </span>
            <span style={{ opacity: 0.7, fontSize: 18, marginLeft: 2 }} aria-hidden="true">→</span>
          </button>

          {/* Fine print */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "#8a93a1", marginTop: 4 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 10.5,
              padding: "3px 7px", borderRadius: 4,
              background: "rgba(15,20,25,0.04)", color: "#4a5260",
              border: "1px solid rgba(15,20,25,0.10)", letterSpacing: 1
            }}>OAuth</span>
            <span>We only request your Discord identity. No DMs, no friends.</span>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "20px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontSize: 11,
        color: "#8a93a1", letterSpacing: 0.8,
        zIndex: 11, pointerEvents: "none"
      }}>
        <span>v0.1 · MVP</span>
        <span>SOC2 in progress</span>
        <span>support@cashout.bot</span>
      </footer>

      {/* ── Global keyframes & belt/box CSS ── */}
      <style>{`
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        @keyframes lp-beltMove {
          from { background-position-x: 0; }
          to   { background-position-x: 76px; }
        }
        @keyframes lp-pkgTravel {
          from { transform: translate3d(-15vw, 0, 0); }
          to   { transform: translate3d(115vw, 0, 0); }
        }
        @keyframes lp-pkgBob {
          0%, 100% { transform: translateY(0) translateZ(0); }
          50%      { transform: translateY(-2px) translateZ(0); }
        }

        .lp-belt-stage {
          position: absolute;
          left: 0; right: 0;
          bottom: 8%;
          height: 360px;
          perspective: 1400px;
          perspective-origin: 50% 30%;
          pointer-events: none;
          z-index: 1;
        }
        .lp-belt-scene {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        .lp-belt-top {
          position: absolute;
          left: -4%; right: -4%;
          top: var(--belt-y, 36%);
          height: 220px;
          transform: rotateX(var(--belt-tilt, 0deg));
          transform-origin: 50% 0%;
          transform-style: preserve-3d;
          background: #d8dde6;
          border-top: 2px solid #aab3c0;
          border-bottom: 2px solid #aab3c0;
          box-shadow: inset 0 0 80px rgba(15,20,25,0.12), 0 8px 24px rgba(15,20,25,0.08);
        }
        .lp-belt-tread {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            90deg,
            #c4ccd8 0 36px,
            #b6bfcd 36px 38px,
            #c4ccd8 38px 74px,
            #9aa4b3 74px 76px
          );
          background-size: 76px 100%;
          animation: lp-beltMove 1.4s linear infinite;
          opacity: 0.95;
        }
        .lp-belt-edge {
          position: absolute;
          left: 0; right: 0;
          height: 6px;
          background: repeating-linear-gradient(90deg, #f5c842 0 14px, #2a3548 14px 22px);
          opacity: 0.85;
        }
        .lp-belt-edge-near { top: -6px; }
        .lp-belt-edge-far  { bottom: -6px; }
        .lp-belt-side {
          position: absolute;
          left: -4%; right: -4%;
          top: calc(var(--belt-y, 36%) - 2px);
          height: 22px;
          background: linear-gradient(180deg, #8590a3 0%, #6a7588 60%, #4f5868 100%);
          border-top: 1.5px solid #4a5364;
          border-bottom: 1.5px solid #3a4252;
          box-shadow: 0 6px 18px rgba(15,20,25,0.18);
        }
        .lp-belt-side-stripe {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          left: 0; right: 0; height: 4px;
          background: repeating-linear-gradient(90deg, #f5c842 0 16px, #2a3548 16px 26px);
          opacity: 0.75;
        }
        .lp-belt-side-bolt {
          position: absolute;
          top: 50%; transform: translate(-50%, -50%);
          width: 6px; height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #c0c8d4 0%, #4a5364 70%);
          box-shadow: inset 0 0 2px rgba(15,20,25,0.4);
        }
        .lp-roller {
          position: absolute;
          top: calc(var(--belt-y, 36%) - 14px);
          width: 28px; height: 32px;
          border-radius: 14px;
          background: radial-gradient(ellipse at 35% 35%, #c0c8d4 0%, #5a6478 70%);
          border: 2px solid #4a5364;
          z-index: 3;
          box-shadow: 0 4px 12px rgba(15,20,25,0.2);
        }
        .lp-roller-l { left: -28px; }
        .lp-roller-r { right: -28px; }
        .lp-leg {
          position: absolute;
          top: calc(var(--belt-y, 36%) + 18px);
          width: 14px; height: 200px;
          background: linear-gradient(180deg, #8590a3, #6a7588 60%, #4f5868);
          border-left: 1px solid #4a5364;
          border-right: 1px solid #4a5364;
        }
        .lp-leg::after {
          content: '';
          position: absolute; bottom: -8px; left: -10px;
          width: 34px; height: 10px;
          background: #4f5868;
          border: 1px solid #3a4252;
          border-radius: 2px;
        }
        .lp-leg-l { left: 8%; }
        .lp-leg-r { right: 8%; }
        .lp-pkg-track {
          position: absolute;
          left: 0; right: 0;
          top: calc(var(--belt-y, 36%) + var(--pkg-y, 152px));
          height: 0;
          transform-style: preserve-3d;
          z-index: 5;
        }
        .lp-pkg-3d {
          position: absolute;
          left: 0; bottom: 0;
          width: var(--s);
          height: 0;
          transform-style: preserve-3d;
          animation: lp-pkgTravel var(--dur) linear infinite;
          animation-delay: var(--delay, 0s);
          will-change: transform;
        }
        .lp-pkg-cube {
          position: absolute;
          left: 0; bottom: 0;
          width: var(--s); height: var(--s);
          transform-style: preserve-3d;
          animation: lp-pkgBob 0.9s ease-in-out infinite;
        }
        .lp-face {
          position: absolute;
          width: var(--s); height: var(--s);
          border: 1.5px solid #3a2412;
          box-shadow: inset 0 0 18px rgba(0,0,0,0.25);
        }
        .lp-face-front  { transform: translateZ(var(--half)); }
        .lp-face-back   { transform: rotateY(180deg) translateZ(var(--half)); }
        .lp-face-right  { transform: rotateY(90deg)  translateZ(var(--half)); }
        .lp-face-left   { transform: rotateY(-90deg) translateZ(var(--half)); }
        .lp-face-top    { transform: rotateX(90deg)  translateZ(var(--half)); }
        .lp-face-bottom { transform: rotateX(-90deg) translateZ(var(--half)); }
        .lp-tape {
          position: absolute;
          border: 1px solid;
          opacity: 0.9;
        }
        .lp-tape-v {
          left: 38%; top: -2px;
          width: 24%; height: calc(100% + 4px);
        }
        .lp-tape-h {
          top: 38%; left: -2px;
          height: 24%; width: calc(100% + 4px);
        }
        .lp-flap-seam {
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: rgba(0,0,0,0.35);
        }
        .lp-label {
          position: absolute;
          left: 10%; top: 55%;
          width: 28%; height: 30%;
          background: #f3ead4;
          border: 1px solid #3a2412;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 3px;
          padding: 4px;
          box-sizing: border-box;
        }
        .lp-label-line {
          width: 100%; height: 2px;
          background: #3a2412;
          opacity: 0.65;
        }
        .lp-label-line.lp-short { width: 55%; }
        .lp-pkg-shadow {
          position: absolute;
          left: -10%; bottom: -8px;
          width: 120%; height: 14px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, transparent 70%);
          transform: rotateX(68deg) translateZ(0);
          transform-origin: 50% 50%;
          filter: blur(2px);
          opacity: 0.7;
        }
        button:focus-visible {
          outline: 2px solid #5457d9;
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}
