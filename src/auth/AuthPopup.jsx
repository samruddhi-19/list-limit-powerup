import { useEffect, useState } from "react";

// Get this from https://trello.com/power-ups/admin -> your Power-Up -> API Key
const TRELLO_APP_KEY = "9d5e0c1473b99cfbb95fd63eba48cb3e";
const APP_NAME = "List Limiter";

export default function AuthPopup({ t }) {
  const [status, setStatus] = useState("idle"); // idle | waiting | success | error

  // Listen for the token posted back by authorized.html once the member
  // approves access in the trello.com/1/authorize popup window.
  useEffect(() => {
    function handleMessage(event) {
      if (!event.data || event.data.source !== "list-limiter-auth") return;
      if (!event.data.token) {
        setStatus("error");
        return;
      }
      finishAuth(event.data.token);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finishAuth(token) {
    try {
      // "private" scope: this token must never be readable by other members.
      await t.set("member", "private", "token", token);
      setStatus("success");
      setTimeout(() => t.closePopup(), 600);
    } catch (e) {
      setStatus("error");
    }
  }

  function handleAuthorize() {
    setStatus("waiting");
    const returnUrl = `${window.location.origin}/authorized.html`;
    const authUrl =
      "https://trello.com/1/authorize" +
      `?expiration=never` +
      `&name=${encodeURIComponent(APP_NAME)}` +
      `&scope=read,write` +
      `&response_type=token` +
      `&key=${TRELLO_APP_KEY}` +
      `&return_url=${encodeURIComponent(returnUrl)}`;

    window.open(authUrl, "trelloAuth", "width=520,height=720");
  }

  const copy = {
    idle: "Connect your Trello account so List Limiter can read and write card counts on this board.",
    waiting: "Waiting for you to approve access in the popup window…",
    success: "Connected. Closing…",
    error: "Something went wrong. Please try again.",
  };

  return (
    <div style={styles.wrapper}>
      <p style={styles.body}>{copy[status]}</p>
      <button
        type="button"
        onClick={handleAuthorize}
        disabled={status === "waiting" || status === "success"}
        style={{ ...styles.button, ...(status === "waiting" ? styles.buttonBusy : {}) }}
      >
        {status === "success" ? "Connected ✓" : "Connect Trello Account"}
      </button>
      {status === "error" && (
        <button type="button" onClick={handleAuthorize} style={styles.retry}>
          Try again
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    fontFamily: "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif",
    padding: "16px",
    boxSizing: "border-box",
  },
  body: { fontSize: 13.5, color: "#44546F", marginBottom: 14, lineHeight: 1.45 },
  button: {
    width: "100%",
    padding: "9px 14px",
    borderRadius: 6,
    border: "none",
    background: "#0C66E4",
    color: "#fff",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  buttonBusy: { opacity: 0.7, cursor: "default" },
  retry: {
    marginTop: 10,
    background: "none",
    border: "none",
    color: "#44546F",
    fontSize: 12,
    textDecoration: "underline",
    cursor: "pointer",
    padding: 0,
  },
};