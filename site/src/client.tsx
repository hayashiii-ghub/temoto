import { hydrateRoot } from "react-dom/client";
import Home from "./page";
import "./styles.css";
import "./components/launcher-preview.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing page root");
hydrateRoot(root, <Home />);
