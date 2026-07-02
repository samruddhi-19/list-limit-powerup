import { useEffect, useRef, useState } from "react";
import { getLimits, setLimitForList } from "../lib/limits.js";

const MIN_LIMIT = 1;

export default function ListLimitPopup({ t }) {
  const [listId, setListId] = useState(null);
  const [listName, setListName] = useState("");
  const [value, setValue] = useState(""); // "" = no limit set yet
  const [hadExistingLimit, setHadExistingLimit] = useState(false);
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

  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>
        {hadExistingLimit ? "Edit max cards" : "Set max cards"}
        {listName ? <span style={styles.listName}> · {listName}</span> : null}
      </div>

      <div style={styles.controlsRow}>
        <button
          type="button"
          aria-label="Decrease"
          style={styles.stepperBtn}
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
          style={styles.stepperBtn}
          onClick={() => step(1)}
          disabled={saving}
        >
          +
        </button>

        <button
          type="button"
          aria-label="Confirm"
          style={{ ...styles.confirmBtn, ...(saving ? styles.disabled : {}) }}
          onClick={handleConfirm}
          disabled={saving}
        >
          ✓
        </button>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      {hadExistingLimit ? (
        <button
          type="button"
          style={styles.removeLink}
          onClick={handleRemoveLimit}
          disabled={saving}
        >
          Remove limit
        </button>
      ) : null}
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    padding: "14px 16px",
    boxSizing: "border-box",
  },
  label: { fontSize: 13, fontWeight: 600, color: "#172b4d", marginBottom: 10 },
  listName: { fontWeight: 400, color: "#6b778c" },
  controlsRow: { display: "flex", alignItems: "center", gap: 6 },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: "1px solid #dfe1e6",
    background: "#f4f5f7",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
    color: "#172b4d",
  },
  input: {
    width: 56,
    height: 30,
    textAlign: "center",
    fontSize: 15,
    borderRadius: 6,
    border: "1px solid #dfe1e6",
    outline: "none",
  },
  confirmBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: "none",
    background: "#0079bf",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
    marginLeft: 4,
  },
  disabled: { opacity: 0.6, cursor: "default" },
  error: { marginTop: 8, fontSize: 12, color: "#c9372c" },
  removeLink: {
    marginTop: 12,
    background: "none",
    border: "none",
    color: "#6b778c",
    fontSize: 12,
    cursor: "pointer",
    padding: 0,
    textDecoration: "underline",
  },
};