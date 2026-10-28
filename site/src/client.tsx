import { hydrateRoot } from "react-dom/client";
import Home from "./page";
import "./styles.css";
import "./components/launcher-preview.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing page root");
const brandMarkUrl = root.dataset.brandMarkUrl;
if (!brandMarkUrl) throw new Error("Missing brand mark URL");
hydrateRoot(root, <Home brandMarkUrl={brandMarkUrl} />);
