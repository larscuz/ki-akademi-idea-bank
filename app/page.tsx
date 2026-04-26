"use client";

import type React from "react";
import { useEffect, useState } from "react";

type Idea = {
  id: string;
  client: string;
  title: string;
  status: string;
  order?: number;
  category?: string;
  premise: string;
  twist: string;
  tags?: string[];
  sections?: {
    coreIdea?: {
      premise?: string;
      twist?: string;
    };
    logicalSynopsis?: string;
    suggestedVisuals?: string[];
    multiShotSequence?: string[];
    imagePrompt?: string;
    videoPrompt?: string;
    notes?: string;
  };
};

type Client = {
  id: string;
  name: string;
  order?: number;
};

export default function Home() {
  const [typedIdeas, setTypedIdeas] = useState<Idea[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("Arctic Trucks");
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [layoutMode, setLayoutMode] = useState(false);

  useEffect(() => {
    fetch("/api/read-ideas")
      .then((res) => res.json())
      .then((data) => setTypedIdeas(data));

    fetch("/api/read-clients")
      .then((res) => res.json())
      .then((data) => setClients(data));
  }, []);

  const sortedClients = [...clients].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );

  const filteredIdeas = typedIdeas.filter((idea) => {
    const matchesClient = idea.client === selectedClient;

    const matchesSearch =
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.twist.toLowerCase().includes(search.toLowerCase()) ||
      idea.tags?.some((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
      );

    return matchesClient && matchesSearch;
  });

  const sortedIdeas = [...filteredIdeas].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999)
  );

  const selected =
    sortedIdeas.find((idea) => idea.id === selectedIdeaId) ??
    sortedIdeas[0] ??
    typedIdeas[0];

  function showSaveMessage(text: string) {
    setSaveMessage(text);
    setTimeout(() => setSaveMessage(""), 1500);
  }

  function handleClientClick(client: string) {
    setSelectedClient(client);
    setSelectedIdeaId(null);
    setEditingSection(null);
    setDraftText("");
  }

  function startEditing(sectionKey: string, currentValue: string) {
    setEditingSection(sectionKey);
    setDraftText(currentValue || "");
  }

  async function moveClient(clientId: string, direction: "up" | "down") {
    const currentClients = [...clients].sort(
      (a, b) => (a.order ?? 999) - (b.order ?? 999)
    );

    const index = currentClients.findIndex((client) => client.id === clientId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentClients.length) return;

    const reordered = [...currentClients];
    const [movedClient] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedClient);

    const withNewOrder = reordered.map((client, newIndex) => ({
      ...client,
      order: newIndex + 1,
    }));

    setClients(withNewOrder);

    const res = await fetch("/api/update-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withNewOrder),
    });

    if (res.ok) {
      showSaveMessage("Layout saved");
    } else {
      showSaveMessage("Layout save failed");
    }
  }

  async function moveIdea(ideaId: string, direction: "up" | "down") {
    const clientIdeas = typedIdeas
      .filter((idea) => idea.client === selectedClient)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const index = clientIdeas.findIndex((idea) => idea.id === ideaId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clientIdeas.length) return;

    const reorderedClientIdeas = [...clientIdeas];
    const [movedIdea] = reorderedClientIdeas.splice(index, 1);
    reorderedClientIdeas.splice(targetIndex, 0, movedIdea);

    const withNewOrder = reorderedClientIdeas.map((idea, newIndex) => ({
      ...idea,
      order: newIndex + 1,
    }));

    const updatedMap = new Map(withNewOrder.map((idea) => [idea.id, idea]));

    const nextIdeas = typedIdeas.map((idea) => updatedMap.get(idea.id) ?? idea);

    setTypedIdeas(nextIdeas);

    const results = await Promise.all(
      withNewOrder.map((idea) =>
        fetch("/api/update-idea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(idea),
        })
      )
    );

    if (results.every((res) => res.ok)) {
      showSaveMessage("Idea order saved");
    } else {
      showSaveMessage("Idea order save failed");
    }
  }

  async function saveSection(sectionKey: string) {
    if (!selected) return;

    const updatedIdea = structuredClone(selected);

    if (!updatedIdea.sections) {
      updatedIdea.sections = {};
    }

    if (sectionKey === "logicalSynopsis") {
      updatedIdea.sections.logicalSynopsis = draftText;
    }

    if (sectionKey === "suggestedVisuals") {
      updatedIdea.sections.suggestedVisuals = draftText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }

    if (sectionKey === "multiShotSequence") {
      updatedIdea.sections.multiShotSequence = draftText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }

    if (sectionKey === "imagePrompt") {
      updatedIdea.sections.imagePrompt = draftText;
    }

    if (sectionKey === "videoPrompt") {
      updatedIdea.sections.videoPrompt = draftText;
    }

    if (sectionKey === "notes") {
      updatedIdea.sections.notes = draftText;
    }

    const res = await fetch("/api/update-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedIdea),
    });

    if (res.ok) {
      setTypedIdeas((prev) =>
        prev.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea))
      );

      setEditingSection(null);
      setDraftText("");
      showSaveMessage("Saved");
    } else {
      showSaveMessage("Save failed");
    }
  }

  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <h1 style={styles.logo}>Idea Bank</h1>
        <p style={styles.small}>KI-Akademi / Cuz Media</p>

        <h3 style={styles.sectionTitle}>Kunder</h3>

        {sortedClients.map((client) => (
          <div key={client.id} style={styles.clientRow}>
            <button
              onClick={() => handleClientClick(client.name)}
              style={{
                ...styles.client,
                background:
                  client.name === selectedClient ? "#111" : "#f2f2f2",
                color: client.name === selectedClient ? "#fff" : "#111",
              }}
            >
              {client.name}
            </button>

            {layoutMode && (
              <div style={styles.moveControls}>
                <button
                  style={styles.moveButton}
                  onClick={() => moveClient(client.id, "up")}
                >
                  ↑
                </button>
                <button
                  style={styles.moveButton}
                  onClick={() => moveClient(client.id, "down")}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={() => setLayoutMode(!layoutMode)}
          style={layoutMode ? styles.layoutButtonActive : styles.layoutButton}
        >
          {layoutMode ? "Done layout" : "Edit layout"}
        </button>

        <a href="/admin" style={styles.adminButton}>
          Admin
        </a>
      </aside>

      <section style={styles.list}>
        <div style={styles.topbar}>
          <div>
            <h2 style={styles.heading}>{selectedClient}</h2>
            <p style={styles.small}>
              {filteredIdeas.length} ideer i denne kategorien
            </p>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            style={styles.search}
          />

          <a href="/admin" style={styles.buttonLink}>
            + Ny idé
          </a>
        </div>

        {layoutMode && search && (
          <div style={styles.layoutWarning}>
            Clear search before moving ideas. Reordering works best on the full
            list.
          </div>
        )}

        <div style={styles.grid}>
          {sortedIdeas.map((idea, index) => (
            <article
              key={idea.id}
              style={{
                ...styles.card,
                border:
                  selected?.id === idea.id
                    ? "2px solid #111"
                    : "1px solid #e5e0d8",
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedIdeaId(idea.id);
                  setEditingSection(null);
                  setDraftText("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSelectedIdeaId(idea.id);
                    setEditingSection(null);
                    setDraftText("");
                  }
                }}
                style={styles.cardClickArea}
              >
                <div style={styles.number}>{index + 1}</div>

                <h3 style={styles.cardTitle}>{idea.title}</h3>
                <p style={styles.text}>{idea.twist}</p>

                <div style={styles.meta}>
                  <span style={styles.badge}>{idea.status}</span>

                  {idea.tags?.map((tag) => (
                    <span key={tag} style={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {layoutMode && !search && (
                <div style={styles.cardMoveControls}>
                  <button
                    style={styles.moveButton}
                    onClick={() => moveIdea(idea.id, "up")}
                  >
                    ↑
                  </button>
                  <button
                    style={styles.moveButton}
                    onClick={() => moveIdea(idea.id, "down")}
                  >
                    ↓
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <aside style={styles.detail}>
        <p style={styles.small}>Valgt idé</p>

        {saveMessage && <div style={styles.saveMessage}>{saveMessage}</div>}

        {selected ? (
          <>
            <h2 style={styles.detailTitle}>{selected.title}</h2>

            <div style={styles.detailBlock}>
              <h4>Core idea</h4>
              <p>
                <strong>Premiss:</strong>{" "}
                {selected.sections?.coreIdea?.premise || selected.premise}
              </p>
              <p>
                <strong>Twist:</strong>{" "}
                {selected.sections?.coreIdea?.twist || selected.twist}
              </p>
            </div>

            <EditableTextBlock
              title="Logical synopsis"
              sectionKey="logicalSynopsis"
              value={selected.sections?.logicalSynopsis || ""}
              fallback="Ikke fylt inn ennå."
              editingSection={editingSection}
              draftText={draftText}
              setDraftText={setDraftText}
              startEditing={startEditing}
              saveSection={saveSection}
            />

            <EditableListBlock
              title="Suggested visuals"
              sectionKey="suggestedVisuals"
              items={selected.sections?.suggestedVisuals || []}
              ordered={false}
              editingSection={editingSection}
              draftText={draftText}
              setDraftText={setDraftText}
              startEditing={startEditing}
              saveSection={saveSection}
            />

            <EditableListBlock
              title="Multi-shot sequence"
              sectionKey="multiShotSequence"
              items={selected.sections?.multiShotSequence || []}
              ordered
              editingSection={editingSection}
              draftText={draftText}
              setDraftText={setDraftText}
              startEditing={startEditing}
              saveSection={saveSection}
            />

            <EditableTextBlock
              title="AI image prompt"
              sectionKey="imagePrompt"
              value={selected.sections?.imagePrompt || ""}
              fallback="Ikke fylt inn ennå."
              dark
              editingSection={editingSection}
              draftText={draftText}
              setDraftText={setDraftText}
              startEditing={startEditing}
              saveSection={saveSection}
            />

            <EditableTextBlock
              title="AI video prompt"
              sectionKey="videoPrompt"
              value={selected.sections?.videoPrompt || ""}
              fallback="Ikke fylt inn ennå."
              dark
              editingSection={editingSection}
              draftText={draftText}
              setDraftText={setDraftText}
              startEditing={startEditing}
              saveSection={saveSection}
            />

            <EditableTextBlock
              title="Notes"
              sectionKey="notes"
              value={selected.sections?.notes || ""}
              fallback="Ingen notater."
              editingSection={editingSection}
              draftText={draftText}
              setDraftText={setDraftText}
              startEditing={startEditing}
              saveSection={saveSection}
            />
          </>
        ) : (
          <p>Ingen idé valgt.</p>
        )}
      </aside>
    </main>
  );
}

function EditableTextBlock({
  title,
  sectionKey,
  value,
  fallback,
  dark = false,
  editingSection,
  draftText,
  setDraftText,
  startEditing,
  saveSection,
}: {
  title: string;
  sectionKey: string;
  value: string;
  fallback: string;
  dark?: boolean;
  editingSection: string | null;
  draftText: string;
  setDraftText: (value: string) => void;
  startEditing: (sectionKey: string, currentValue: string) => void;
  saveSection: (sectionKey: string) => void;
}) {
  const isEditing = editingSection === sectionKey;

  return (
    <div style={dark ? styles.promptBlock : styles.detailBlock}>
      <div style={styles.blockHeader}>
        <h4>{title}</h4>

        <button
          style={dark ? styles.smallButtonDark : styles.smallButton}
          onClick={() => startEditing(sectionKey, value)}
        >
          Edit
        </button>
      </div>

      {isEditing ? (
        <>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            style={styles.inlineTextarea}
          />

          <button
            style={dark ? styles.saveButtonLight : styles.saveButton}
            onClick={() => saveSection(sectionKey)}
          >
            Save
          </button>
        </>
      ) : (
        <p>{value || fallback}</p>
      )}
    </div>
  );
}

function EditableListBlock({
  title,
  sectionKey,
  items,
  ordered = false,
  editingSection,
  draftText,
  setDraftText,
  startEditing,
  saveSection,
}: {
  title: string;
  sectionKey: string;
  items: string[];
  ordered?: boolean;
  editingSection: string | null;
  draftText: string;
  setDraftText: (value: string) => void;
  startEditing: (sectionKey: string, currentValue: string) => void;
  saveSection: (sectionKey: string) => void;
}) {
  const isEditing = editingSection === sectionKey;
  const currentValue = items.join("\n");
  const ListTag = ordered ? "ol" : "ul";

  return (
    <div style={styles.detailBlock}>
      <div style={styles.blockHeader}>
        <h4>{title}</h4>

        <button
          style={styles.smallButton}
          onClick={() => startEditing(sectionKey, currentValue)}
        >
          Edit
        </button>
      </div>

      {isEditing ? (
        <>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            style={styles.inlineTextarea}
            placeholder="One item per line"
          />

          <button
            style={styles.saveButton}
            onClick={() => saveSection(sectionKey)}
          >
            Save
          </button>
        </>
      ) : items.length > 0 ? (
        <ListTag style={styles.listItems}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ListTag>
      ) : (
        <p>Ikke fylt inn ennå.</p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    gridTemplateColumns: "260px 1fr 420px",
    height: "100vh",
    overflow: "hidden",
    background: "#faf7f0",
    color: "#111",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    padding: 24,
    borderRight: "1px solid #ddd",
    background: "#fff",
    overflowY: "auto",
    height: "100vh",
  },
  logo: {
    margin: 0,
    fontSize: 28,
  },
  small: {
    color: "#777",
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 32,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#777",
  },
  clientRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  client: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 12,
    fontWeight: 700,
    border: 0,
    cursor: "pointer",
  },
  list: {
    padding: 32,
    overflowY: "auto",
    height: "100vh",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    gap: 16,
  },
  heading: {
    fontSize: 36,
    margin: 0,
  },
  buttonLink: {
    background: "#111",
    color: "#fff",
    border: 0,
    borderRadius: 999,
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
    textAlign: "left",
  },
  cardClickArea: {
    cursor: "pointer",
  },
  cardMoveControls: {
    display: "flex",
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #eee",
  },
  number: {
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
  },
  cardTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  text: {
    color: "#444",
    lineHeight: 1.45,
  },
  meta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 16,
  },
  badge: {
    background: "#d7ffd9",
    color: "#0b5c16",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  tag: {
    background: "#f0f0f0",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
  },
  detail: {
    padding: 24,
    background: "#fff",
    borderLeft: "1px solid #ddd",
    overflowY: "auto",
    height: "100vh",
  },
  detailTitle: {
    marginTop: 0,
    fontSize: 24,
  },
  detailBlock: {
    background: "#faf7f0",
    border: "1px solid #e5e0d8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    lineHeight: 1.45,
  },
  promptBlock: {
    background: "#111",
    color: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    lineHeight: 1.45,
    fontSize: 14,
  },
  listItems: {
    paddingLeft: 20,
    margin: 0,
    lineHeight: 1.45,
  },
  adminButton: {
    display: "block",
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#eaeaea",
    textDecoration: "none",
    color: "#111",
    fontWeight: 700,
    textAlign: "center",
  },
  search: {
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid #ddd",
    width: 240,
  },
  saveMessage: {
    background: "#d7ffd9",
    color: "#0b5c16",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
  },
  layoutWarning: {
    background: "#fff4cc",
    color: "#6b4c00",
    padding: "10px 14px",
    borderRadius: 12,
    marginBottom: 16,
    fontWeight: 700,
    fontSize: 13,
  },
  blockHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  smallButton: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  smallButtonDark: {
    border: "1px solid #444",
    background: "#222",
    color: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  inlineTextarea: {
    width: "100%",
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    marginBottom: 10,
    fontFamily: "Arial, sans-serif",
    lineHeight: 1.45,
  },
  saveButton: {
    background: "#111",
    color: "#fff",
    border: 0,
    borderRadius: 999,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  saveButtonLight: {
    background: "#fff",
    color: "#111",
    border: 0,
    borderRadius: 999,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  layoutButton: {
    display: "block",
    width: "100%",
    marginTop: 30,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#f2f2f2",
    color: "#111",
    fontWeight: 700,
    textAlign: "center",
    border: 0,
    cursor: "pointer",
  },
  layoutButtonActive: {
    display: "block",
    width: "100%",
    marginTop: 30,
    padding: "12px 14px",
    borderRadius: 12,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    textAlign: "center",
    border: 0,
    cursor: "pointer",
  },
  moveControls: {
    display: "flex",
    gap: 4,
  },
  moveButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};