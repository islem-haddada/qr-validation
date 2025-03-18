import React, { useState, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import * as XLSX from "xlsx";

function App() {
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  const startScanning = async () => {
    try {
      if (isScanning) {
        await html5QrCode?.stop();
        setIsScanning(false);
        setShowScanner(false);
        return;
      }

      setShowScanner(true);
      
      // Wait for the DOM element to be available
      setTimeout(async () => {
        try {
          const newHtml5QrCode = new Html5Qrcode("reader");
          setHtml5QrCode(newHtml5QrCode);

          await newHtml5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 100,
              qrbox: {
                width: 450,
                height: 450,
              },
              aspectRatio: 4/3,
              qrboxFunction: (viewfinderWidth, viewfinderHeight) => {
                let minEdgePercentage = 0.7; // Percentage of view finder width
                let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                  width: qrboxSize,
                  height: qrboxSize
                };
              }
            },
            (decodedText) => {
              setQrData(decodedText);
              validateQRCode(decodedText);
            },
            (error) => {
              console.error("QR Code scanning error:", error);
            }
          );

          setIsScanning(true);
        } catch (err) {
          console.error("Error in setTimeout:", err);
          setIsScanning(false);
          setShowScanner(false);
        }
      }, 100);

    } catch (err) {
      console.error("Error starting scanner:", err);
      setIsScanning(false);
      setShowScanner(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        html5QrCode.clear();
        setHtml5QrCode(null);
        setIsScanning(false);
        setShowScanner(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" });

      if (jsonData.length === 0) {
        setValidationMessage("⚠️ Le fichier Excel est vide");
        return;
      }

      if (jsonData.length > 0) {
        jsonData.shift();
      }

      const transformedData = jsonData.map((row) => ({
        code: row.A || "",
        name: row.A || "",
      }));

      setExcelData(transformedData);
      setValidationMessage("✅ Fichier Excel chargé avec succès");
      setIsValid(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const validateQRCode = (scannedData) => {
    if (excelData.length === 0) {
      setValidationMessage("⚠️ Veuillez d'abord charger un fichier Excel");
      setIsValid(false);
      return;
    }

    const match = excelData.find((row) => {
      return row.code.toString().trim() === scannedData.trim();
    });

    const isValidCode = Boolean(match);
    setIsValid(isValidCode);
    setValidationMessage(
      isValidCode
        ? `✅ Code valide : ${match.code}`
        : "❌ Code non trouvé dans le fichier Excel"
    );

    const timestamp = new Date().toLocaleString();
    const newScan = {
      name: match ? match.code : scannedData,
      code: scannedData,
      timestamp,
      isValid: isValidCode,
    };

    setScanHistory((prev) => {
      // Check if name already exists in history
      const existingIndex = prev.findIndex(
        (scan) => scan.name === newScan.name
      );

      if (existingIndex !== -1) {
        // Update existing entry
        const updatedHistory = [...prev];
        updatedHistory[existingIndex] = newScan;
        return updatedHistory;
      }

      // Add new entry if name doesn't exist
      return [newScan, ...prev];
    });
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  const downloadHistory = () => {
    const historyData = scanHistory.map(scan => ({
      Nom: scan.name,
      Code: scan.code,
      'Date et Heure': scan.timestamp,
      Statut: scan.isValid ? 'Validé' : 'Non validé'
    }));

    const ws = XLSX.utils.json_to_sheet(historyData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historique des scans");
    XLSX.writeFile(wb, `historique_scans_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const deleteHistoryItem = (index) => {
    setScanHistory((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const fileInput = document.getElementById("excel-file");
    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        readExcelFile(file);
        setValidationMessage("");
        setIsValid(null);
      }
    };

    fileInput.addEventListener("change", handleFileChange);
    return () => {
      fileInput.removeEventListener("change", handleFileChange);
      stopScanning();
    };
  }, []);

  return (
    <div
      className="App"
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 20px",
        backgroundColor: "#1A1B26",
        color: "#E4E6F0",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          fontSize: "3.2em",
          fontWeight: "700",
          marginBottom: "40px",
          background: "linear-gradient(45deg, #4CAF50, #2196F3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
          letterSpacing: "-1px",
        }}
      >
        🎯 Validation QR Code
      </h1>

      <div style={{ 
        marginBottom: "30px", 
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        flexWrap: "wrap"
      }}>
        <button
          onClick={startScanning}
          style={{
            padding: "15px 35px",
            fontSize: "18px",
            backgroundColor: isScanning ? "#FF5252" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
            marginRight: "15px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: "500",
          }}
        >
          {isScanning ? "🛑 Arrêter" : "📷 Scanner"}
        </button>

        <button onClick={clearHistory} style={{ /* ... existing styles ... */ }}>
          🗑️ Effacer l'historique
        </button>

        <button
          onClick={downloadHistory}
          style={{
            padding: "15px 35px",
            fontSize: "18px",
            backgroundColor: "#9C27B0",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            marginLeft: "15px",
          }}
        >
          📥 Télécharger l'historique
        </button>
      </div>

      <div
        style={{
          marginBottom: "30px",
          textAlign: "center",
          padding: "30px",
          backgroundColor: "#282838",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <label
          htmlFor="excel-file"
          style={{
            display: "block",
            marginBottom: "15px",
            fontSize: "20px",
            color: "#4CAF50",
            fontWeight: "500",
          }}
        >
          📊 Charger le fichier Excel
        </label>
        <input
          type="file"
          id="excel-file"
          accept=".xlsx, .xls"
          style={{
            padding: "12px",
            width: "80%",
            maxWidth: "400px",
            backgroundColor: "#1E1E2E",
            border: "2px dashed #4CAF50",
            borderRadius: "12px",
            color: "#E4E6F0",
            cursor: "pointer",
          }}
        />
      </div>

      {showScanner && (
        <div
          id="reader"
          style={{
            width: "100%",
            maxWidth: "900px",
            margin: "0 auto",
            backgroundColor: "#282838",
            borderRadius: "20px",
            overflow: "hidden",
            marginBottom: "30px",
            height: "600px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        ></div>
      )}

      {/* Update the scan history section */}
      <div
        style={{
          marginTop: "40px",
          backgroundColor: "#282838",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            marginBottom: "30px",
            fontSize: "28px",
            color: "#4CAF50",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "2px solid rgba(76, 175, 80, 0.3)",
            paddingBottom: "15px",
          }}
        >
          📋 Historique des scans
        </h2>
        
        {/* Update the scan history items */}
        <div
          style={{
            maxHeight: "500px",
            overflowY: "auto",
            padding: "15px",
            scrollBehavior: "smooth",
          }}
        >
          {scanHistory.map((scan, index) => (
            <div
              key={index}
              style={{
                padding: "25px",
                marginBottom: "20px",
                backgroundColor: scan.isValid
                  ? "rgba(76, 175, 80, 0.15)"
                  : "rgba(244, 67, 54, 0.15)",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: `1px solid ${
                  scan.isValid
                    ? "rgba(76, 175, 80, 0.4)"
                    : "rgba(244, 67, 54, 0.4)"
                }`,
                transition: "transform 0.2s ease",
                cursor: "default",
                "&:hover": {
                  transform: "translateY(-2px)",
                },
              }}
            >
              <div>
                <strong style={{ fontSize: "18px" }}>{scan.name}</strong>
                <div
                  style={{
                    fontSize: "14px",
                    opacity: "0.8",
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  🕒 {scan.timestamp}
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    backgroundColor: scan.isValid
                      ? "rgba(76, 175, 80, 0.2)"
                      : "rgba(244, 67, 54, 0.2)",
                  }}
                >
                  {scan.isValid ? "✅ Validé" : "❌ Non validé"}
                </div>
                <button
                  onClick={() => deleteHistoryItem(index)}
                  style={{
                    padding: "10px",
                    backgroundColor: "#FF5252",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
