"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface SwitcherServer {
  id: string;
  name: string;
  iconUrl?: string | null;
  sub?: string | null;   // member count (seller) or role string (buyer)
  badge?: string | null; // e.g. "View only" — when present the checkmark is hidden
}

interface Props {
  eyebrow: string;      // trigger label, e.g. "Selling into" | "Viewing"
  menuHeading: string;  // menu header, e.g. "Your servers" | "Servers you manage"
  servers: SwitcherServer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  addBotUrl?: string;
  busy?: boolean;
}

// Deterministic gradient + initial fallback when a server has no Discord icon.
function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h},58%,52%), hsl(${(h + 22) % 360},55%,38%))`;
}

function ServerIcon({ server, size, font }: { server: SwitcherServer; size: number; font: number }) {
  const style: React.CSSProperties = { width: size, height: size, fontSize: font };
  if (server.iconUrl) {
    return (
      <span className="sw-ico" style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={server.iconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
      </span>
    );
  }
  return (
    <span className="sw-ico" style={{ ...style, background: gradientFor(server.id || server.name) }}>
      {(server.name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function ServerSwitcher({ eyebrow, menuHeading, servers, selectedId, onSelect, addBotUrl, busy }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = servers.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    setOpen(false);
    if (id !== selectedId) onSelect(id);
  }

  return (
    <div className={`sw theme-light ${open ? "is-open" : ""}`} ref={rootRef}>
      <style>{swCss}</style>
      <button
        type="button"
        className="sw-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {selected ? (
          <ServerIcon server={selected} size={32} font={14} />
        ) : (
          <span className="sw-ico" style={{ width: 32, height: 32, fontSize: 14, background: gradientFor("none") }}>?</span>
        )}
        <span className="sw-tx">
          <span className="sw-eyebrow">{eyebrow}</span>
          <span className="sw-name">{selected?.name ?? "Select server"}</span>
        </span>
        <svg className="sw-chev" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="sw-menu" role="listbox" id={listId}>
        <div className="sw-menu-head">
          {menuHeading} <span className="cnt">{servers.length}</span>
        </div>
        {servers.map((s) => {
          const isSel = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={isSel}
              className={`sw-opt ${isSel ? "is-selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                choose(s.id);
              }}
            >
              <ServerIcon server={s} size={36} font={15} />
              <span className="sw-opt-tx">
                <span className="sw-opt-name">{s.name}</span>
                {s.sub ? <span className="sw-opt-sub">{s.sub}</span> : null}
              </span>
              {s.badge ? (
                <span className="sw-role view">{s.badge}</span>
              ) : (
                <svg className="sw-check" viewBox="0 0 18 18" fill="none">
                  <path d="M3.5 9.5l3.5 3.5 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
        {servers.length === 0 ? (
          <div className="sw-opt" style={{ cursor: "default" }}>
            <span className="sw-opt-tx">
              <span className="sw-opt-sub">No servers available</span>
            </span>
          </div>
        ) : null}
        {addBotUrl ? (
          <>
            <div className="sw-sep" />
            <a className="sw-add" href={addBotUrl} target="_blank" rel="noopener noreferrer">
              <span className="plus">+</span>Add the bot to another server
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}

const swCss = `
  .sw { position: relative; display: inline-block; font-family: 'Geist', system-ui, -apple-system, sans-serif; }
  .sw-ico {
    flex-shrink: 0; overflow: hidden;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-family: 'Geist', sans-serif;
    border-radius: 8px; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
  }
  .sw-trigger {
    display: inline-flex; align-items: center; gap: 11px;
    padding: 7px 12px 7px 8px; border-radius: 13px;
    border: 1px solid rgba(15,20,25,0.10);
    background: rgba(255,255,255,0.9);
    box-shadow: 0 1px 2px rgba(15,20,25,0.04);
    font-family: inherit; cursor: pointer; text-align: left;
    transition: border-color .15s, background .15s, box-shadow .15s;
  }
  .sw-trigger:hover { border-color: rgba(84,87,217,0.4); box-shadow: 0 2px 10px rgba(15,20,25,0.06); }
  .sw-trigger:disabled { opacity: 0.6; cursor: default; }
  .sw.is-open .sw-trigger { border-color: rgba(84,87,217,0.55); box-shadow: 0 2px 12px rgba(84,87,217,0.12); }
  .sw-tx { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
  .sw-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 1.3px; font-weight: 600;
    text-transform: uppercase; color: #9aa1ad;
  }
  .sw-name {
    font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: #0f1419;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;
  }
  .sw-chev { width: 16px; height: 16px; flex-shrink: 0; color: #8a93a1; transition: transform .2s ease; margin-left: 2px; }
  .sw.is-open .sw-chev { transform: rotate(180deg); }

  .sw-menu {
    position: absolute; top: calc(100% + 8px); left: 0;
    width: 340px; z-index: 100; border-radius: 16px; padding: 7px;
    background: rgba(255,255,255,0.98);
    border: 1px solid rgba(15,20,25,0.08);
    box-shadow: 0 14px 44px rgba(15,20,25,0.16), 0 2px 6px rgba(15,20,25,0.06);
    backdrop-filter: blur(8px);
    opacity: 0; transform: translateY(-6px) scale(0.985); transform-origin: top left;
    pointer-events: none; transition: opacity .16s ease, transform .16s ease;
  }
  .sw.is-open .sw-menu { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
  .sw-menu-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 7px 10px 9px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px; letter-spacing: 1.4px; font-weight: 600; color: #9aa1ad;
  }
  .sw-menu-head .cnt {
    font-size: 9.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
    background: rgba(84,87,217,0.10); color: #5457d9;
  }
  .sw-opt {
    display: flex; align-items: center; gap: 11px; width: 100%;
    padding: 9px 10px; border: 0; border-radius: 11px;
    background: transparent; cursor: pointer; text-align: left;
    font-family: inherit; transition: background .12s;
  }
  .sw-opt:hover { background: rgba(15,20,25,0.04); }
  .sw-opt.is-selected { background: rgba(84,87,217,0.07); }
  .sw-opt-tx { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
  .sw-opt-name {
    font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: #0f1419;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sw-opt-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.2px; color: #9aa1ad; }
  .sw-opt.is-selected .sw-opt-sub { color: #5457d9; }
  .sw-check { width: 17px; height: 17px; flex-shrink: 0; color: #5457d9; opacity: 0; transition: opacity .12s; }
  .sw-opt.is-selected .sw-check { opacity: 1; }
  .sw-sep { height: 1px; margin: 6px 8px; background: rgba(15,20,25,0.08); }
  .sw-add {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 9px 12px; border: 0; border-radius: 11px;
    background: transparent; cursor: pointer; text-align: left; text-decoration: none;
    font-family: inherit; font-size: 13px; font-weight: 500; color: #4a5260;
    transition: background .12s;
  }
  .sw-add:hover { background: rgba(15,20,25,0.04); }
  .sw-add .plus {
    width: 26px; height: 26px; border-radius: 8px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 17px; line-height: 1; font-family: 'JetBrains Mono', monospace;
    background: rgba(15,20,25,0.06); color: #4a5260;
  }
  .sw-role {
    margin-left: auto; flex-shrink: 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 0.4px; font-weight: 600;
    padding: 2px 7px; border-radius: 999px; text-transform: uppercase;
    background: rgba(15,20,25,0.06); color: #8a93a1;
  }
`;
