import { useEffect, useRef } from "react";

const COPY = {
  support: {
    title: "Franchise Support",
    body: "For restock timing, a missing approval, or a custom order, contact the Daykodee supply desk using the channel on your franchise agreement. This portal does not open the public store.",
  },
  terms: {
    title: "Portal Terms",
    body: "Daykodee Supplies is for approved Family Affair franchise owners. Catalog prices are franchise rates. Payment is completed on the secure Wix checkout, which blocks anyone who is not a labeled franchisee. New accounts stay pending until Daykodee approves them.",
  },
  privacy: {
    title: "Privacy",
    body: "Sign-in is handled by Wix Members. This site stores your member session in this browser so the franchise catalog can be requested with your access token. It does not put client secrets or personal records in the repository.",
  },
};

export function LegalDialog({ kind, onClose }) {
  const closeRef = useRef(null);
  const entry = kind ? COPY[kind] : null;

  useEffect(() => {
    if (!entry) return undefined;
    closeRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entry, onClose]);

  if (!entry) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="legal-title">{entry.title}</h2>
        <p>{entry.body}</p>
        <button type="button" className="button button-blue" ref={closeRef} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
