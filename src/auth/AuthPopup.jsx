import { useState } from "react";

export default function AuthPopup({ t }) {
  const [status, setStatus] = useState("idle"); // idle | authorizing | success | error

  async function handleAuthorize() {
    setStatus("authorizing");
    try {
      await t.set("member", "private", "authorized", true);
      setStatus("success");
      // Reload so Trello re-checks authorization-status, same as original.
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      setStatus("error");
    }
  }

  const messages = {
    authorizing: "Authorizing...",
    success: "Success! Reloading...",
    error: "Failed. Please try again.",
  };

  return (
    <div style={{ fontFamily: "-apple-system, Helvetica, Arial, sans-serif", padding: 16 }}>
      <h3>Authorize List Limit Power-Up</h3>
      <p>Click to enable List Limit features on this board.</p>
      <button
        onClick={handleAuthorize}
        disabled={status === "authorizing" || status === "success"}
        style={{ padding: "8px 16px", cursor: "pointer" }}
      >
        Authorize
      </button>
      <p>{messages[status] || ""}</p>
    </div>
  );
}
