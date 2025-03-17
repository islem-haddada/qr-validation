import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import * as XLSX from "xlsx";

function App() {
  const [scannerActive, setScannerActive] = useState(false);
  const [qrData, setQrData] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [isValid, setIsValid] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
        const firstCell = worksheet[cellRef];

        if (firstCell && firstCell.v) {
          setExcelData([{ nom: firstCell.v.toString() }]);
          console.log("Excel content:", firstCell.v);
        } else {
          console.log("No data found in Excel");
          setExcelData([]);
        }
      } catch (error) {
        console.error("Error reading Excel:", error);
        setValidationMessage("⚠️ Erreur de lecture du fichier Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const compareNameWithExcel = (scannedName) => {
    if (!excelData || excelData.length === 0) {
      setValidationMessage("⚠️ Veuillez charger le fichier Excel");
      return;
    }

    const excelName = excelData[0].nom.toLowerCase().trim();
    const scannedNameTrimmed = scannedName.toLowerCase().trim();

    const isValidScan = excelName === scannedNameTrimmed;

    const newScan = {
      name: scannedName,
      timestamp: new Date().toLocaleString(),
      isValid: isValidScan,
    };
    setScanHistory((prev) => [newScan, ...prev]);

    if (isValidScan) {
      setIsValid(true);
      setValidationMessage(`✅ Nom validé : ${excelData[0].nom}`);
    } else {
      setIsValid(false);
      setValidationMessage("❌ Nom non trouvé dans la liste");
    }
  };

  const handleScan = (data) => {
    if (data && data.text) {
      const scannedText = data.text;
      setQrData(scannedText);
      compareNameWithExcel(scannedText);
    }
  };

  const handleError = (err) => {
    console.error("Erreur de scan : ", err);
    setValidationMessage("⚠️ Erreur lors du scan");
  };

  const toggleScanner = () => {
    setScannerActive(!scannerActive);
    if (!scannerActive) {
      setQrData("");
      setValidationMessage("");
      setIsValid(null);
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
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
    return () => fileInput.removeEventListener("change", handleFileChange);
  }, []);

  return (
    <div
      className="App"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#ffffff",
          marginBottom: "30px",
        }}
      >
        Scanner QR Code et comparer avec Excel
      </h1>

      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <button
          onClick={toggleScanner}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: scannerActive ? "#ff4444" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background-color 0.3s",
            marginRight: "10px",
          }}
        >
          {scannerActive ? "Arrêter le scanner" : "Démarrer le scanner"}
        </button>

        <button
          onClick={clearHistory}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Effacer l'historique
        </button>
      </div>

      <div
        style={{
          marginBottom: "20px",
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#333333",
          borderRadius: "8px",
        }}
      >
        <input
          type="file"
          id="excel-file"
          accept=".xlsx, .xls"
          style={{
            margin: "10px 0",
            color: "#ffffff",
          }}
        />
      </div>

      {scannerActive && (
        <div
          style={{
            marginBottom: "20px",
            backgroundColor: "#333333",
            padding: "20px",
            borderRadius: "8px",
          }}
        >
          <QrScanner
            delay={300}
            style={{
              width: "100%",
              height: "300px",
              borderRadius: "4px",
            }}
            onError={handleError}
            onScan={handleScan}
          />
        </div>
      )}

      {qrData && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#333333",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Données scannées :</strong> {qrData}
          </p>
        </div>
      )}

      {validationMessage && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: isValid
              ? "rgba(76, 175, 80, 0.2)"
              : "rgba(244, 67, 54, 0.2)",
            borderRadius: "8px",
            textAlign: "center",
            fontSize: "18px",
          }}
        >
          {validationMessage}
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          backgroundColor: "#333333",
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "15px" }}>Historique des scans</h2>
        {scanHistory.length === 0 ? (
          <p>Aucun scan effectué</p>
        ) : (
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {scanHistory.map((scan, index) => (
              <div
                key={index}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  backgroundColor: scan.isValid
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(244, 67, 54, 0.2)",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>{scan.name}</strong>
                  <div style={{ fontSize: "0.8em", opacity: "0.8" }}>
                    {scan.timestamp}
                  </div>
                </div>
                <div>{scan.isValid ? "✅ Validé" : "❌ Non validé"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
