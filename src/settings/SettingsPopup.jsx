import { useEffect, useState } from "react";
import { getLimits, setAllLimits } from "../lib/limits.js";

export default function SettingsPopup({ t }) {
  const [lists, setLists] = useState(null); // null = loading
  const [values, setValues] = useState({}); // listId -> string input value
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      const [fetchedLists, savedLimits] = await Promise.all([
        t.lists("id", "name"),
        getLimits(t),
      ]);
      setLists(fetchedLists);
      const initialValues = {};
      fetchedLists.forEach((list) => {
        if (savedLimits[list.id] !== undefined) {
          initialValues[list.id] = String(savedLimits[list.id]);
        }
      });
      setValues(initialValues);
    }
    load();
  }, [t]);

  function handleChange(listId, value) {
    setValues((prev) => ({ ...prev, [listId]: value }));
  }

  async function handleSave() {
    const limits = {};
    Object.entries(values).forEach(([listId, val]) => {
      const trimmed = (val || "").trim();
      if (trimmed !== "") {
        limits[listId] = Number(trimmed);
      }
    });

    try {
      await setAllLimits(t, limits);
      setSaveMsg("Saved!");
      setTimeout(() => t.closePopup(), 500);
    } catch (e) {
      setSaveMsg("Failed to save. Try again.");
    }
  }

  return (
    <div style={{ fontFamily: "-apple-system, Helvetica, Arial, sans-serif", padding: 12 }}>
      <h4>Set a card limit per list</h4>
      <p style={{ color: "#888", fontSize: 12 }}>Leave blank to remove a limit.</p>

      <div>
        {lists === null && "Loading lists…"}
        {lists?.map((list) => (
          <div
            key={list.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {list.name}
            </span>
            <input
              type="number"
              min="0"
              style={{ width: 60, marginLeft: 8 }}
              value={values[list.id] ?? ""}
              onChange={(e) => handleChange(list.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSave} style={{ marginTop: 12, padding: "6px 14px", cursor: "pointer" }}>
        Save
      </button>
      <p>{saveMsg}</p>
    </div>
  );
}
