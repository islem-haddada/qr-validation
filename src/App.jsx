import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import * as XLSX from "xlsx";

function App() {
  const [scannerActive, setScannerActive] = useState(false);
  const [qrData, setQrData] = useState(""); // Contient les données scannées du QR code
  const [excelData, setExcelData] = useState([]); // Contient les données du fichier Excel

  // Fonction pour lire le fichier Excel
  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      // Récupère la première feuille du fichier Excel
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setExcelData(jsonData); // Met à jour l'état avec les données du fichier Excel
    };
    reader.readAsBinaryString(file); // Lit le fichier Excel sous forme binaire
  };

  // Fonction pour comparer le nom scanné avec les données du fichier Excel
  const compareNameWithExcel = (scannedName) => {
    const match = excelData.find((row) => {
      // Vérifie si le nom scanné correspond à un nom dans le fichier Excel (sans tenir compte de la casse)
      return row.nom && row.nom.toLowerCase() === scannedName.toLowerCase();
    });

    if (match) {
      alert("Nom validé : " + match.nom); // Affiche le nom trouvé dans le fichier Excel
    } else {
      alert("Nom non validé"); // Si aucun nom ne correspond, afficher "Non validé"
    }
  };

  // Fonction appelée lorsque le QR Code est scanné
  const handleScan = (data) => {
    if (data && data.text) { // Vérifier que data et data.text existent
      setQrData(data.text); // Afficher le texte scanné
      compareNameWithExcel(data.text); // Comparer le texte scanné avec les données Excel
    }
  };

  // Fonction pour gérer les erreurs de scan
  const handleError = (err) => {
    console.error("Erreur de scan : ", err);
  };

  // Fonction pour activer/désactiver le scanner
  const toggleScanner = () => {
    setScannerActive(!scannerActive);
  };

  // Charger le fichier Excel lorsqu'un fichier est sélectionné
  useEffect(() => {
    const fileInput = document.getElementById("excel-file");
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        readExcelFile(file); // Lire et traiter le fichier Excel
      }
    });
  }, []);

  return (
    <div className="App">
      <h1>Scanner QR Code et comparer avec Excel</h1>
      <button onClick={toggleScanner}>
        {scannerActive ? "Arrêter le scanner" : "Démarrer le scanner"}
      </button>

      {/* Affichage du scanner lorsque activé */}
      {scannerActive && (
        <QrScanner
          delay={300}
          style={{ width: "100%" }}
          onError={handleError}
          onScan={handleScan}
        />
      )}

      {/* Input pour télécharger un fichier Excel */}
      <input type="file" id="excel-file" />
      
      {/* Affichage des données scannées */}
      <p>Données scannées : {qrData}</p>
    </div>
  );
}

export default App;
