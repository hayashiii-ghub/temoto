import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { applyDocumentLocale } from "./i18n.ts";
import "./styles.css";
import "@fontsource-variable/geist";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";

const surface = document.body.dataset.surface || "popup";
const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("temoto root element is missing");

applyDocumentLocale();

createRoot(rootElement).render(
  <React.StrictMode>
    <App surface={surface} />
  </React.StrictMode>,
);
