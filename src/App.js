import React, { useState } from "react";
import QrScanner from "react-qr-scanner";

function App() {
  const [qrData, setQrData] = useState("");

  const handleScan = (data) => {
    if (data) {
      setQrData(data.text);
    }
  };

  const handleError = (err) => {
    console.error("Erreur de scan QR:", err);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Scanner de QR Code</h1>
      <QrScanner
        delay={300}
        onScan={handleScan}
        onError={handleError}
        style={{ width: "300px" }}
      />
      <p>Données QR scannées : {qrData}</p>
    </div>
  );
}

export default App;
