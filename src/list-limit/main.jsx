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