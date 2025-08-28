import { GoogleGenerativeAI } from "@google/generative-ai";
import { trips } from "../data/trips.js";
import { hotels } from "../data/hotels.js";
import { attractions } from "../data/attractions.js";

const money = (n) => new Intl.NumberFormat("en-IN").format(n);
const normalize = (s = "") => s.trim().toLowerCase();

function buildFullContext() {
  const tripsBlock = trips
    .map((t) => `- [${t.city}] ${t.title}, ${t.duration}, ₹${money(t.price)}`)
    .join("\n") || "None";

  const hotelsBlock = hotels
    .map((h) => `- [${h.city}] ${h.name}, ⭐${h.rating}, ₹${money(h.pricePerNight)}/night`)
    .join("\n") || "None";

  const attractionsBlock = attractions
    .map((a) => `- [${a.city}] ${a.name}: ${a.description}`)
    .join("\n") || "None";

  return `
  Here is the available travel dataset (ALL items):

  Trips:
  ${tripsBlock}

  Hotels:
  ${hotelsBlock}

  Attractions:
  ${attractionsBlock}
  `;
}


function buildContext(city) {
  const cityTrips = trips.filter((t) => normalize(t.city) === normalize(city));
  const cityHotels = hotels.filter((h) => normalize(h.city) === normalize(city));
  const cityAttractions = attractions.filter((a) => normalize(a.city) === normalize(city));

  return `
  Here is the available travel data for ${city}:

  Trips:
  ${cityTrips.map((t) => `- ${t.title}, ${t.duration}, ₹${money(t.price)}`).join("\n") || "None"}

  Hotels:
  ${cityHotels.map((h) => `- ${h.name}, ⭐${h.rating}, ₹${money(h.pricePerNight)}/night`).join("\n") || "None"}

  Attractions:
  ${cityAttractions.map((a) => `- ${a.name}: ${a.description}`).join("\n") || "None"}
  `;
}

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return genAI.getGenerativeModel({ model: modelName });
}

function parseLLMJson(raw) {
  if (!raw) return null;

  // 1) Strip markdown fences if present
  let s = raw.trim();
  // ```json ... ``` or ``` ... ```
  const fenceStart = s.indexOf("```");
  if (fenceStart !== -1) {
    // remove leading prose up to first fence
    s = s.slice(fenceStart + 3);
    // remove language tag like "json"
    s = s.replace(/^\s*json\s*/i, "");
    const fenceEnd = s.indexOf("```");
    if (fenceEnd !== -1) s = s.slice(0, fenceEnd);
  }

  // 2) If there’s still prose, grab the first {...} block
  const firstBrace = s.indexOf("{");
  const lastBrace = s.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    s = s.slice(firstBrace, lastBrace + 1);
  }

  // 3) Try strict JSON parse
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function coerceToUIShape(obj, city) {
  if (!obj || typeof obj !== "object") return null;

  if (obj.type !== "list" && obj.type !== "text") obj.type = "text";

  if (obj.type === "list") {
    obj.header = obj.header ?? (city ? `Results in ${city}` : "Results");
    if (!Array.isArray(obj.items)) obj.items = [];
    obj.items = obj.items
      .filter(Boolean)
      .map((it) => ({
        title: String(it?.title ?? "").trim(),
        subtitle: it?.subtitle ? String(it.subtitle) : undefined,
      }))
      .filter((it) => it.title);

    if (!obj.cta && city) {
      obj.cta = { label: `Open ${city} page`, to: `/city/${encodeURIComponent(city)}` };
    }
  } else {
    obj.text = String(obj.text ?? "").trim() || "Sorry, I couldn’t find anything relevant.";
  }
  return obj;
}

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

    const allCities = [...new Set([...trips, ...hotels, ...attractions].map((d) => d.city))];
    const city = allCities.find((c) => normalize(input).includes(normalize(c)));

    const context = city ? buildContext(city) : buildFullContext();


    const prompt = `
You are a travel assistant. Use ONLY the given dataset context to answer.
NEVER invent cities or items outside the dataset.

Context:
${context}

User asked: "${input}"

Infer constraints from the user text:
- category intent: trips | hotels | attractions (default: trips if unclear)
- season (summer/winter/monsoon/spring) if mentioned
- budget (numbers like 5000, 5k, ₹5,000). 
  • For trips compare "price" to budget.
  • For hotels compare "pricePerNight" to budget.
- region cues like "south india", "north india", etc. Prefer cities that match those regions 
  (e.g., Bengaluru/Chennai = south india; Delhi/Agra/Jaipur/Manali = north india; Mumbai/Goa = west india).
- season cues like "summer", "monsoon" , "spring" etc. Prefer cities that are best suited in that weather.
  (e.g., Manali/Goa/London/Paris = summer , Jaipur/Delhi/Dubai= winter, Paris/London/Manali=spring, Goa/Mumbai/Manali=monsoon).
- if user mentions a city, prefer that city.

Select items ONLY from the Context lists above that best satisfy the inferred constraints.
Rank by best match (season fit > city/region match > budget fit > rating/price).

Return ONLY raw JSON (no prose, no markdown, no code fences) with this schema:
{
  "type": "list" | "text",
  "header"?: string,
  "items"?: [{ "title": string, "subtitle"?: string }],
  "cta"?: { "label": string, "to": string },
  "text"?: string
}

Rules:
- Prefer "list" when you can suggest items.
- Subtitles may include duration, rating, and price like "5 Days · ₹12,000" or "⭐4.6 · ₹4,200/night".
- If nothing matches, use type "text" and briefly say filters were too strict.
- If a city is known (${city ? `"${city}"` : "unknown"}), CTA.to should be "/city/${encodeURIComponent(city || "")}".
- Output at most 12 items to keep the UI tidy.

Examples:
- If user says "best trips for summer", favor cities like Goa, Bengaluru, London, Paris (from context), but list ONLY trips present in the dataset.
- If user says "budget 5000 hotel in south india", pick hotels whose pricePerNight ≤ 5000 in Bengaluru or Chennai (if present in the dataset).
`;


    const model = getGeminiModel();
    if (!model) {
      return res.json({
        type: "text",
        text:
          "AI suggestions are offline until the API key is configured. Meanwhile, try: “Show me trips to Manali”, “Best hotels in Goa”, or “What can I visit in Jaipur?”.",
      });
    }

    let rawText = "";
    try {
      const result = await model.generateContent(prompt);
      rawText = result.response.text();
    } catch (e) {
      console.error("Gemini call failed:", e?.message || e);
      return res.json({
        type: "text",
        text:
          "I couldn’t reach my AI brain right now. You can still ask:\n• Show me trips to Manali\n• Best hotels in Goa\n• What can I visit in Jaipur?",
      });
    }

    const parsed = parseLLMJson(rawText) ?? { type: "text", text: rawText };
    const safe = coerceToUIShape(parsed, city);

    return res.json(safe || { type: "text", text: "Sorry, I couldn’t understand that." });
  } catch (err) {
    next(err);
  }
}
