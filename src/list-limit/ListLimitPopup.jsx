import { useEffect, useRef, useState } from "react";
import { getLimits, setLimitForList, getCardCount } from "../lib/limits.js";

const MIN_LIMIT = 1;

const STATE = {
  safe: { fg: "#4BCE97", bg: "#1C3829", label: "Within limit" },
  atCap: { fg: "#E2B203", bg: "#3A2E0E", label: "At limit" },
  over: { fg: "#F87168", bg: "#3D1F1F", label: "Over limit" },
};

function GaugeIcon({ color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M13.4 10.6 17 7" />
      <path d="M4.6 15a9 9 0 1 1 14.8 0" />
    </svg>
  );
}

function WarningIcon({ color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.7 3.86a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function AlertIcon({ color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
      <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86Z" />
    </svg>
  );
}

export default function ListLimitPopup({ t }) {
  const [listId, setListId] = useState(null);
  const [listName, setListName] = useState("");
  const [value, setValue] = useState(""); // "" = no limit set yet
  const [hadExistingLimit, setHadExistingLimit] = useState(false);
  const [cardCount, setCardCount] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { listId: id } = t.getContext().arguments || {};
      setListId(id);

      const limits = await getLimits(t);
      if (id && limits[id] !== undefined) {
        setValue(String(limits[id]));
        setHadExistingLimit(true);
      } else {
        setValue(String(MIN_LIMIT));
      }

      try {
        const list = await t.list("name");
        setListName(list.name);
      } catch (e) {
        // t.list() isn't available in every popup context; ignore.
      }

      if (id) {
        try {
          const count = await getCardCount(t, id);
          setCardCount(count);
        } catch (e) {
          setCardCount(0);
        }
      }

      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
    load();
  }, [t]);

   useEffect(() => {
    t.sizeTo(document.body);
  }, [cardCount, error, hadExistingLimit]);

  function clampToMin(n) {
    return Math.max(MIN_LIMIT, n);
  }

  function handleChange(e) {
    const raw = e.target.value;
    if (raw === "") {
      setValue("");
      return;
    }
    if (!/^\d+$/.test(raw)) return; // digits only
    setValue(raw);
    setError("");
  }

  function step(delta) {
    const current = Number(value) || MIN_LIMIT;
    setValue(String(clampToMin(current + delta)));
    setError("");
  }

  async function handleConfirm() {
    const num = Number(value);
    if (!value || Number.isNaN(num) || num < MIN_LIMIT) {
      setError(`Enter a number ${MIN_LIMIT} or greater.`);
      return;
    }
    setSaving(true);
    try {
      await setLimitForList(t, listId, num);
      setSaving(false);
      setSaved(true);
      setTimeout(() => t.closePopup(), 500);
    } catch (e) {
      setSaving(false);
      setError("Failed to save. Try again.");
    }
  }

  async function handleRemoveLimit() {
    setSaving(true);
    try {
      await setLimitForList(t, listId, "");
      t.closePopup();
    } catch (e) {
      setSaving(false);
      setError("Failed to remove limit.");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") t.closePopup();
  }

  const limitNum = Number(value) || 0;
  const count = cardCount ?? 0;
  const overLimit = limitNum > 0 && count > limitNum;
  const atCap = limitNum > 0 && count === limitNum;
  const state = overLimit ? STATE.over : atCap ? STATE.atCap : STATE.safe;
  const progressPct = limitNum > 0 ? Math.min(100, Math.round((count / limitNum) * 100)) : 0;
  const Icon = overLimit ? AlertIcon : atCap ? WarningIcon : GaugeIcon;

  return (
    <div style={styles.wrapper}>
      <div style={styles.body}>
        <div style={styles.statusRow}>
          <div style={{ ...styles.iconBadge, background: state.bg }}>
            <Icon color={state.fg} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={styles.listName}>{listName || "This list"}</div>
            <div style={{ ...styles.statusLabel, color: state.fg }}>
              {cardCount === null ? "Loading cards…" : state.label}
            </div>
          </div>
        </div>

        <div style={styles.progressLabelRow}>
          <span style={styles.progressLabel}>Cards in list</span>
          <span style={{ ...styles.progressCount, color: state.fg }}>
            {cardCount === null ? "…" : `${count} / ${limitNum || "–"}`}
          </span>
        </div>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPct}%`,
              background: state.fg,
            }}
          />
        </div>

        <div style={styles.fieldLabel}>Maximum cards</div>
        <div style={styles.stepperGroup}>
          <button
            type="button"
            aria-label="Decrease limit"
            style={{ ...styles.stepperBtn, borderRight: "1px solid rgba(255,255,255,0.12)" }}
            onClick={() => step(-1)}
            disabled={saving || Number(value) <= MIN_LIMIT}
          >
            −
          </button>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            style={styles.input}
            disabled={saving}
          />
          <button
            type="button"
            aria-label="Increase limit"
            style={{ ...styles.stepperBtn, borderLeft: "1px solid rgba(255,255,255,0.12)" }}
            onClick={() => step(1)}
            disabled={saving}
          >
            +
          </button>
        </div>

        <p style={styles.helperText}>
          The list header turns amber past this limit, and red once it's exceeded.
        </p>

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.buttonRow}>
          {hadExistingLimit ? (
            <button
              type="button"
              style={styles.removeBtn}
              onClick={handleRemoveLimit}
              disabled={saving}
            >
              Remove limit
            </button>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <button
            type="button"
            style={{ ...styles.saveBtn, ...(saving ? styles.disabled : {}) }}
            onClick={handleConfirm}
            disabled={saving}
          >
            {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
    background: "#22272B",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 12px 12px 16px",
    borderBottom: "0.5px solid rgba(255,255,255,0.1)",
  },
  headerTitle: { fontSize: 14, fontWeight: 500, color: "#B6C2CF" },
  closeBtn: {
    border: "none",
    background: "transparent",
    width: 28,
    height: 28,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9FADBC",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  },
  body: { padding: 16 },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#B6C2CF",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statusLabel: { fontSize: 12, marginTop: 1 },
  progressLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, fontWeight: 500, color: "#9FADBC" },
  progressCount: { fontSize: 12, fontWeight: 500 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    background: "#1D2125",
    overflow: "hidden",
    marginBottom: 18,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.15s ease, background 0.15s ease",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#9FADBC",
    marginBottom: 6,
  },
  stepperGroup: {
    display: "flex",
    alignItems: "stretch",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 8,
    overflow: "hidden",
    background: "#1D2125",
  },
  stepperBtn: {
    width: 36,
    border: "none",
    background: "transparent",
    fontSize: 16,
    color: "#B6C2CF",
    cursor: "pointer",
  },
  input: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: 500,
    color: "#B6C2CF",
    background: "transparent",
    border: "none",
    outline: "none",
    height: 38,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: "#8C9BAB",
    margin: "10px 0 0",
  },
  error: { marginTop: 10, fontSize: 12, color: "#F87168" },
  buttonRow: { display: "flex", gap: 8, marginTop: 18 },
  removeBtn: {
    flex: 1,
    height: 36,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 8,
    color: "#9FADBC",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  saveBtn: {
    flex: 1.4,
    height: 36,
    background: "#579DFF",
    border: "none",
    borderRadius: 8,
    color: "#052048",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  disabled: { opacity: 0.6, cursor: "default" },
};