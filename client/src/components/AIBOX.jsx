import React, { useState } from "react";
import {
  Card,
  Button,
  Input,
  Spinner,
  Alert,
  Collapse,
  Table,} from "reactstrap";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const AIBox = ({ entity }) => {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [showSPARQL, setShowSPARQL] = useState(false);

  const handleAICommand = async () => {
    if (!command.trim()) return;
    setLoading(true);
    setError("");
    setResponse(null);
    try {
      const res = await axios.post("http://localhost:8000/ai/execute", {
        entity,
        command,
      });
      setResponse(res.data);
    } catch (err) {
      setError("Erreur lors du traitement de la commande AI.");
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!response?.result) return null;
    const bindings = response.result?.results?.bindings || [];

    if (bindings.length === 0)
      return <Alert color="secondary">Aucun résultat trouvé.</Alert>;

    // extraire les clés dynamiquement
    const columns = Object.keys(bindings[0]);

    return (
      <Table striped responsive className="mt-3">
        <thead className="thead-light">
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bindings.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col}>{row[col]?.value || "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <Card className="p-4 shadow-sm mb-4 bg-light">
      <h5 className="mb-3">
        🤖 Assistant AI —{" "}
        {entity === "etat_sante" ? "État de Santé" : "Objectif"}
      </h5>

      <div className="d-flex mb-3">
        <Input
          type="text"
          placeholder={
            entity === "etat_sante"
              ? "Ex : ajoute un état santé avec 75 kg et 37.2°C"
              : "Ex : crée un objectif perte de poids pour 1 mois"
          }
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
        <Button
          color="primary"
          className="ml-2"
          onClick={handleAICommand}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "Envoyer"}
        </Button>
      </div>

      {error && <Alert color="danger">{error}</Alert>}

      {response && (
        <div className="mt-4">
          <h6>
            🧩 <strong>Action détectée :</strong> {response.analysis.action}
          </h6>

          <Button
            color="info"
            size="sm"
            className="mt-2 mb-2"
            onClick={() => setShowSPARQL(!showSPARQL)}
          >
            {showSPARQL ? "Masquer SPARQL" : "Afficher SPARQL"}
          </Button>

          <Collapse isOpen={showSPARQL}>
            <SyntaxHighlighter
              language="sparql"
              style={vscDarkPlus}
              customStyle={{
                borderRadius: "8px",
                padding: "1rem",
                fontSize: "0.85rem",
              }}
            >
              {response.sparql}
            </SyntaxHighlighter>
          </Collapse>

          <h6 className="mt-3">📊 <strong>Résultats :</strong></h6>
          {renderResults()}
        </div>
      )}
    </Card>
  );
};

export default AIBox;
