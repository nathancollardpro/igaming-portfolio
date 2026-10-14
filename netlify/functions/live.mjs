// Compteur en direct du portfolio : visiteurs présents et parties jouées.
// Chaque page envoie un battement toutes les 25 s ; un visiteur sans battement depuis 70 s n'est plus compté.
import { getStore } from "@netlify/blobs";

const GAMES = ["ricochet", "candy", "corsair"];
const TTL = 70_000;          // délai avant qu'un visiteur ne soit plus « en ligne »
const MAX_SPINS = 40;        // plafond de parties déclarées par battement (anti-abus)

export default async (req) => {
  const store = getStore({ name: "kaching-live", consistency: "strong" });
  const now = Date.now();
  let body = {};
  if (req.method === "POST") {
    try { body = JSON.parse((await req.text()) || "{}"); } catch { body = {}; }
  }
  const id = typeof body.id === "string" && /^[a-z0-9]{8,40}$/i.test(body.id) ? body.id : null;
  const game = GAMES.includes(body.game) ? body.game : null;
  const spins = Math.max(0, Math.min(MAX_SPINS, Number.parseInt(body.spins, 10) || 0));

  // présence
  const presence = (await store.get("presence", { type: "json" })) || {};
  let dirty = false;
  for (const k of Object.keys(presence)) if (now - presence[k].t > TTL) { delete presence[k]; dirty = true; }
  if (id) {
    if (body.leave) delete presence[id];
    else presence[id] = { t: now, g: game };
    dirty = true;
  }
  if (dirty) await store.setJSON("presence", presence);

  // parties jouées (cumul)
  const totals = (await store.get("totals", { type: "json" })) || { all: 0, ricochet: 0, candy: 0, corsair: 0 };
  if (id && game && spins) {
    totals.all = (totals.all || 0) + spins;
    totals[game] = (totals[game] || 0) + spins;
    await store.setJSON("totals", totals);
  }

  const online = Object.keys(presence).length;
  const playing = Object.fromEntries(GAMES.map((g) => [g, Object.values(presence).filter((p) => p.g === g).length]));
  return Response.json({ online, playing, totals }, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/api/live" };
