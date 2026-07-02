import { useEffect, useState } from "react";
import { getLimits, setLimitForList } from "../lib/limits.js";

export default function ListLimitPopup({ t }) {
  const [listId, setListId] = useState(null);
  const [value, setValue] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { listId: id } = t.getContext().arguments || {};
      setListId(id);
      const limits = await getLimits(t);
      if (id && limits[id] !== undefined) {
        setValue(String(limits[id]));
      }
    }
    load();
  }, [t]);

  async function handleSave() {
    try {
      await setLimitForList(t, listId, value.trim());
      setSaveMsg("Saved!");
      setTimeout(() => t.closePopup(), 400);
    } catch (e) {
      setSaveMsg("Failed to save.");
    }
  }

  return (
    <div style={{ fontFamily: "-apple-system, Helvetica, Arial, sans-serif", padding: 12 }}>
      <label htmlFor="limitInput">Max cards for this list:</label>
      <br />
      <input
        id="limitInput"
        type="number"
        min="0"
        style={{ width: 80, fontSize: 16, padding: 4 }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={handleSave}
        style={{ display: "block", marginTop: 12, padding: "6px 14px", cursor: "pointer" }}
      >
        Save
      </button>
      <p>{saveMsg}</p>
    </div>
  );
}
