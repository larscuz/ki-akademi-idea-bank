"use client";

import type React from "react";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [clientName, setClientName] = useState("");
  const [ideaJson, setIdeaJson] = useState("");
  const [message, setMessage] = useState("");

  const [ideas, setIdeas] = useState<any[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [editJson, setEditJson] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
 

  useEffect(() => {
  fetch("/api/read-ideas")
    .then((res) => res.json())
    .then((data) => setIdeas(data));

  fetch("/api/read-clients")
    .then((res) => res.json())
    .then((data) => {
      setClients(data);
      if (data[0]) setSelectedClient(data[0].name);
    });
}, []);

  function showMessage(text: string) {
    setMessage(text);
    setTimeout(() => setMessage(""), 1800);
  }

  async function addClient() {
    if (!clientName.trim()) return;

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clientName }),
    });

    if (res.ok) {
      showMessage("✅ Client saved");
      setClientName("");
    } else {
      showMessage("❌ Something went wrong adding client");
    }
  }

  async function addApprovedIdea() {
    if (!ideaJson.trim()) return;

    let parsed;

    try {
  parsed = JSON.parse(ideaJson);
  parsed.client = selectedClient;
} catch {
  showMessage("❌ Invalid JSON");
  return;
}

    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    if (res.ok) {
      showMessage("✅ Approved idea saved");
      setIdeaJson("");
      setIdeas((prev) => [...prev, parsed]);
    } else {
      showMessage("❌ Something went wrong adding idea");
    }
  }

  async function saveEditedIdea() {
    if (!editJson.trim()) return;

    let parsed;

    try {
      parsed = JSON.parse(editJson);
    } catch {
      showMessage("❌ Invalid JSON in edit box");
      return;
    }

    const res = await fetch("/api/update-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    if (res.ok) {
      showMessage("✅ Idea updated");
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === parsed.id ? parsed : idea))
      );
    } else {
      showMessage("❌ Something went wrong updating idea");
    }
  }

  return (
    <main style={styles.page}>
      <h1>Admin</h1>

      <a href="/" style={styles.backButton}>
        ← Back to Idea Bank
      </a>

      <p>Legg til kunder, lim inn godkjente ideer, eller rediger eksisterende ideer.</p>

      <section style={styles.section}>
        <h2>Ny kunde</h2>

        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Kundenavn"
          style={styles.input}
        />

        <button onClick={addClient} style={styles.button}>
          Legg til kunde
        </button>
      </section>

      <section style={styles.section}>
  <h2>Paste approved idea JSON</h2>

  <label>Customer</label>
  <select
    value={selectedClient}
    onChange={(e) => setSelectedClient(e.target.value)}
    style={styles.input}
  >
    {clients.map((client) => (
      <option key={client.id} value={client.name}>
        {client.name}
      </option>
    ))}
  </select>

  <textarea
    value={ideaJson}
    onChange={(e) => setIdeaJson(e.target.value)}
    placeholder='Paste full approved idea JSON here, for example: { "id": "vp-010", "client": "Viking Planet", ... }'
    style={styles.textarea}
  />

        <button onClick={addApprovedIdea} style={styles.button}>
          Save approved idea
        </button>
      </section>

      <section style={styles.section}>
        <h2>Edit existing idea</h2>

        <select
          value={selectedIdeaId}
          onChange={(e) => {
            const id = e.target.value;
            setSelectedIdeaId(id);

            const idea = ideas.find((i) => i.id === id);

            if (idea) {
              setEditJson(JSON.stringify(idea, null, 2));
            } else {
              setEditJson("");
            }
          }}
          style={styles.input}
        >
          <option value="">Select an idea...</option>

          {ideas.map((idea) => (
            <option key={idea.id} value={idea.id}>
              {idea.client} — {idea.title}
            </option>
          ))}
        </select>

        <textarea
          value={editJson}
          onChange={(e) => setEditJson(e.target.value)}
          placeholder="Selected idea JSON will appear here..."
          style={styles.textarea}
        />

        <button onClick={saveEditedIdea} style={styles.button}>
          Save edited idea
        </button>
      </section>

      {message && <div style={styles.toast}>{message}</div>}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 40,
    fontFamily: "Arial, sans-serif",
    maxWidth: 980,
    background: "#faf7f0",
    minHeight: "100vh",
  },
  section: {
    marginTop: 40,
    padding: 24,
    border: "1px solid #ddd",
    borderRadius: 16,
    background: "#fff",
  },
  input: {
    display: "block",
    width: "100%",
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  textarea: {
    display: "block",
    width: "100%",
    minHeight: 420,
    padding: 12,
    marginBottom: 16,
    fontFamily: "monospace",
    fontSize: 14,
    borderRadius: 10,
    border: "1px solid #ddd",
  },
  button: {
    padding: "14px 18px",
    background: "#111",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer",
  },
  backButton: {
    display: "inline-block",
    marginBottom: 24,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#f2f2f2",
    color: "#111",
    textDecoration: "none",
    fontWeight: 700,
  },
  toast: {
    position: "fixed",
    right: 24,
    bottom: 24,
    background: "#d7ffd9",
    color: "#0b5c16",
    padding: "12px 16px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 700,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    zIndex: 100,
  },
  clientList: {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 16,
  alignItems: "center",
},
clientPill: {
  background: "#f2f2f2",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
},
};