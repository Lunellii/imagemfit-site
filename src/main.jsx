import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";

const hiddenQuotePaths = new Set(["/orcamento", "/orcamento/", "/ocamento", "/ocamento/"]);

if (hiddenQuotePaths.has(window.location.pathname)) {
  window.location.replace("/orcamento/index.html");
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
}
