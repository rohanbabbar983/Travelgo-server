// src/controllers/chatController.js
import { trips } from "../data/trips.js";
import { hotels } from "../data/hotels.js";
import { attractions } from "../data/attractions.js";

const money = (n) => new Intl.NumberFormat("en-IN").format(n);
const normalize = (s = "") => s.trim().toLowerCase();

function detectIntent(text) {
  const t = normalize(text);
  if (/(trip|package|tour|itinerary|plan)/i.test(t)) return "SHOW_TRIPS";
  if (/(hotel|stay|resort|room|best)/i.test(t)) return "SHOW_HOTELS";
  if (/(attraction|visit|see|places|sight)/i.test(t)) return "SHOW_ATTRACTIONS";
  return "UNKNOWN";
}

const knownCities = Array.from(new Set([
  ...trips.map((t) => t.city),
  ...hotels.map((h) => h.city),
  ...attractions.map((a) => a.city),
]));

function extractCity(text) {
  const t = normalize(text);
  return knownCities.find((c) => t.includes(c.toLowerCase()));
}

// Unified response shape so the client can render easily
// { type: 'text', text }
// { type: 'list', header, items:[{title, subtitle}], cta:{label,to} }

export async function askAssistant(req, res, next) {
  try {
    const { message } = req.body || {};
    const input = typeof message === "string" ? message : "";

    if (!input.trim()) {
      return res.json({
        type: "text",
        text: "Ask me about trips, hotels, or attractions. For example: “Show me trips to Manali”.",
      });
    }

    const intent = detectIntent(input);
    const city = extractCity(input);

    if (!city) {
      if (intent === "UNKNOWN") {
        return res.json({
          type: "text",
          text:
            "I can help with trips, hotels, and attractions. Try:\n• Show me trips to Manali\n• What are the best hotels in Goa?\n• What can I visit in Jaipur?",
        });
      }
      return res.json({
        type: "text",
        text: "Which city are you interested in? e.g. “Best hotels in Goa” or “Trips to Manali”.",
      });
    }

    switch (intent) {
      case "SHOW_TRIPS": {
        const list = trips
          .filter((t) => normalize(t.city) === normalize(city))
          .slice(0, 3);

        if (!list.length) return res.json({ type: "text", text: `I couldn't find trips for ${city}.` });

        return res.json({
          type: "list",
          header: `Top trips in ${city}`,
          items: list.map((t) => ({
            title: t.title,
            subtitle: `${t.duration} • ₹${money(t.price)}`,
          })),
          cta: { label: `Open ${city} page`, to: `/city/${encodeURIComponent(city)}` },
        });
      }

      case "SHOW_HOTELS": {
        const list = hotels
          .filter((h) => normalize(h.city) === normalize(city))
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (a.pricePerNight ?? 0) - (b.pricePerNight ?? 0))
          .slice(0, 3);

        if (!list.length) return res.json({ type: "text", text: `No hotels found for ${city}.` });

        return res.json({
          type: "list",
          header: `Best-rated stays in ${city}`,
          items: list.map((h) => ({
            title: h.name,
            subtitle: `⭐ ${h.rating} • ₹${money(h.pricePerNight)}/night`,
          })),
          cta: { label: `See all in ${city}`, to: `/city/${encodeURIComponent(city)}` },
        });
      }

      case "SHOW_ATTRACTIONS": {
        const list = attractions
          .filter((a) => normalize(a.city) === normalize(city))
          .slice(0, 3);

        if (!list.length) return res.json({ type: "text", text: `No attractions found for ${city}.` });

        return res.json({
          type: "list",
          header: `Places to visit in ${city}`,
          items: list.map((a) => ({ title: a.name, subtitle: a.description })),
          cta: { label: `Open ${city} page`, to: `/city/${encodeURIComponent(city)}` },
        });
      }

      default:
        return res.json({
          type: "text",
          text:
            "I can fetch trips, hotels, and attractions. Try:\n• Show me trips to Manali\n• Best hotels in Goa\n• What can I visit in Jaipur?",
        });
    }
  } catch (err) {
    next(err);
  }
}
