import { useEffect, useRef, useState } from "react";
import { getLimits, setLimitForList, getCardCount } from "../lib/limits.js";

const MIN_LIMIT = 1;

export default function ListLimitPopup({ t }) {
  const [listId, setListId] = useState(null);
  const [listName, setListName] = useState("");
  const [value, setValue] = useState(""); // "" = no limit set yet
  const [hadExistingLimit, setHadExistingLimit] = useState(false);
  const [cardCount, setCardCount] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
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
      t.closePopup();
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
  const remaining = limitNum > 0 ? limitNum - count : null;
  const progressPct =
    limitNum > 0 ? Math.min(100, Math.round((count / limitNum) * 100)) : 0;
  const progressColor = overLimit ? "#C9372C" : "#57A55A";
  const remainingColor = overLimit ? "#C9372C" : "#3B6D11";

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <div style={styles.title}>
            {hadExistingLimit ? "Edit list limit" : "Set list limit"}
          </div>
          {listName ? <div style={styles.subtitle}>{listName}</div> : null}
        </div>
        <button
          type="button"
          aria-label="Close"
          style={styles.closeBtn}
          onClick={() => t.closePopup()}
        >
          ×
        </button>
      </div>

      <div style={styles.divider} />

      <div style={styles.body}>
        <div style={styles.sectionLabel}>Card limit</div>

        <div style={styles.stepperRow}>
          <div style={styles.stepperGroup}>
            <button
              type="button"
              aria-label="Decrease"
              style={{ ...styles.stepperBtn, ...styles.stepperBtnLeft }}
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
              aria-label="Increase"
              style={{ ...styles.stepperBtn, ...styles.stepperBtnRight }}
              onClick={() => step(1)}
              disabled={saving}
            >
              +
            </button>
          </div>
        </div>

        <div style={styles.progressLabelRow}>
          <span style={styles.progressLabel}>
            {cardCount === null
              ? "Loading cards…"
              : `${count} of ${limitNum || "–"} cards`}
          </span>
          {limitNum > 0 && cardCount !== null ? (
            <span style={{ ...styles.progressRight, color: remainingColor }}>
              {overLimit ? `${count - limitNum} over` : `${remaining} left`}
            </span>
          ) : null}
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPct}%`,
              background: progressColor,
            }}
          />
        </div>

        {error ? <div style={styles.error}>{error}</div> : null}

        <button
          type="button"
          style={{ ...styles.saveBtn, ...(saving ? styles.disabled : {}) }}
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save limit"}
        </button>

        {hadExistingLimit ? (
          <div style={styles.removeRow}>
            <button
              type="button"
              style={styles.removeLink}
              onClick={handleRemoveLimit}
              disabled={saving}
            >
              Remove limit
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
    background: "#FFFFFF",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 12px",
  },
  headerText: { minWidth: 0 },
  title: { fontSize: 14, fontWeight: 600, color: "#172B4D" },
  subtitle: {
    fontSize: 12,
    color: "#8590A2",
    marginTop: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: 20,
    lineHeight: 1,
    color: "#8590A2",
    cursor: "pointer",
    flexShrink: 0,
    padding: 0,
  },
  divider: { height: 1, background: "#EBECF0" },
  body: { padding: "18px 16px 16px" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#8590A2",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 10,
    textAlign: "center",
  },
  stepperRow: {
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepperGroup: {
    display: "flex",
    border: "1px solid #DFE1E6",
    borderRadius: 8,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 38,
    border: "none",
    background: "#FAFBFC",
    fontSize: 16,
    color: "#44546F",
    cursor: "pointer",
  },
  stepperBtnLeft: { borderRight: "1px solid #DFE1E6" },
  stepperBtnRight: { borderLeft: "1px solid #DFE1E6" },
  input: {
    width: 64,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 600,
    color: "#172B4D",
    background: "#FFFFFF",
    border: "none",
    outline: "none",
  },
  progressLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: "#44546F", fontWeight: 500 },
  progressRight: { fontSize: 12, fontWeight: 600 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    background: "#EBECF0",
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.2s ease",
  },
  saveBtn: {
    width: "100%",
    height: 36,
    borderRadius: 8,
    border: "none",
    background: "#172B4D",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  disabled: { opacity: 0.6, cursor: "default" },
  error: { marginBottom: 10, fontSize: 12, color: "#C9372C" },
  removeRow: { display: "flex", justifyContent: "center", marginTop: 10 },
  removeLink: {
    background: "none",
    border: "none",
    color: "#8590A2",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
  },
};