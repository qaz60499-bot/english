import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/map.css";
import "./styles/lesson.css";
import "./styles/english-shell.css";
import "./styles/english-today.css";
import "./styles/english-route.css";
import "./styles/english-lesson.css";
import "./styles/english-content.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
