import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css'; // Si vous avez un fichier CSS pour les styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
