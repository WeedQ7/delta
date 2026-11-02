import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

/**
 * HashRouter is used deliberately: the static build can be opened/served from
 * any path (including file:// and simple static hosts) without server rewrites,
 * which matters for desktop shells (Tauri/Electron) planned for later.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
