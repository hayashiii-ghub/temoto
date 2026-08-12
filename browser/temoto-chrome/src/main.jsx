import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "@fontsource-variable/geist";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

const surface = document.body.dataset.surface || "popup";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App surface={surface} />
  </React.StrictMode>,
);
