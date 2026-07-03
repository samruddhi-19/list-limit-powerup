/* global TrelloPowerUp */
import React from "react";
import ReactDOM from "react-dom/client";
import ListLimitPopup from "./ListLimitPopup.jsx";

const t = TrelloPowerUp.iframe();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ListLimitPopup t={t} />
  </React.StrictMode>
);

// Let Trello resize the popup iframe to fit actual content
requestAnimationFrame(() => t.sizeTo(document.body));