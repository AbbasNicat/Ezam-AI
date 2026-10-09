import { t } from "@/lib/agent/i18n";
import type { AgentInterpretation, AgentLanguage, RegenerationIntent, TravelIntent } from "@/lib/agent/schemas";
import type { TravelRequest } from "@/types/travel";

const CITIES: Array<[RegExp, string]> = [[/\b(bakı|baki|bakü|baku)\b/i, "Baku"], [/\bistanbul\b/i, "Istanbul"], [/\b(tbilisi|tiflis)\b/i, "Tbilisi"], [/\bdubai\b/i, "Dubai"]];
const SUPPORTED = new Set(["Istanbul", "Tbilisi", "Dubai"]);

export function detectLanguage(text: string, preferred?: AgentLanguage): { language: AgentLanguage; confidence: number } {
  if (preferred) return { language: preferred, confidence: 1 };
  const s = text.toLocaleLowerCase("tr");
  const az = (s.match(/[əq]/g)?.length ?? 0) * 3 + [" istəy", " yaxin", " yaxın", " başqa", " büdcə", " seyahet", " səyahət", " gun qal", " bəyən"].filter((x) => s.includes(x)).length * 2;
  const tr = (s.match(/[ğışçöü]/g)?.length ?? 0) + [" istiyorum", " bütçem", " başka", " dört gün", " seyahat", " yakın", " bul"].filter((x) => s.includes(x)).length * 2;
  if (az > tr && az >= 2) return { language: "az", confidence: Math.min(.95, .55 + az / 20) };
  if (tr > az && tr >= 2) return { language: "tr", confidence: Math.min(.95, .55 + tr / 20) };
  return { language: "en", confidence: .65 };
}

function cityMentions(text: string): string[] { return CITIES.filter(([re]) => re.test(text)).map(([, city]) => city); }
function numberBefore(text: string, word: RegExp): number | undefined { const m = text.match(new RegExp(`(\\d+)\\s*(?:${word.source})`, "i")); return m ? Number(m[1]) : undefined; }

export function fallbackIntent(message: string, preferredLanguage?: AgentLanguage): TravelIntent {
  const { language, confidence } = detectLanguage(message, preferredLanguage);
  const cities = cityMentions(message);
  const budget = message.match(/(\d+(?:[.,]\d+)?)\s*(AZN|USD|EUR|TRY|GEL|AED)/i);
  const isoDates = message.match(/\b20\d{2}-\d{2}-\d{2}\b/g) ?? [];
  const durationDays = numberBefore(message, /days?|gün|gun|günlük|gunluk/);
  const hotelStars = Number(message.match(/([1-5])\s*(?:star|stars|ulduz|ulduzlu|yıldız|yıldızlı)/i)?.[1] ?? 0) || undefined;
  const strictBudget = /do not exceed|must not exceed|maximum|max\.?|keçməsin|cox olmasin|çok olmasın|aşmasın/i.test(message);
  const strictHotel = /must be|yalnız|mutləq|mütləq|olmalı|olmasi gerek|olması gerek/i.test(message);
  const nearAttractions = /near.*attraction|close.*attraction|turistik.*yakın|turistik.*yaxın|yerlərə yaxın/i.test(message);
  const nearCenter = /city cent(?:er|re)|şəhər mərkəzi|seher merkezi|şehir merkezi|merkeze yakın/i.test(message);
  const quiet = /quiet|sakit|sessiz/i.test(message);
  const michelin = /michelin/i.test(message);
  const direct = /only direct|direct flights? only|yalnız birbaşa|sadece direkt/i.test(message);
  const destination = cities.length === 1 ? cities[0] : cities.at(-1);
  const origin = cities.length > 1 ? cities[0] : undefined;
  const attractions = [nearAttractions ? "major attractions" : "", /museum|muzey|müze/i.test(message) ? "museums" : "", /architecture|memarlıq|mimari/i.test(message) ? "architecture" : ""].filter(Boolean);
  const locations = [nearAttractions ? "near major attractions" : "", nearCenter ? "city center" : "", quiet ? "quiet neighborhood" : "", /near.*airport|havaalanına yakın|hava limanına yaxın/i.test(message) ? "near airport" : ""].filter(Boolean);
  const hardConstraints: TravelIntent["hardConstraints"] = [];
  if (strictBudget && budget) hardConstraints.push({ field: "totalBudget", operator: "maximum", value: Number(budget[1].replace(",", ".")), reason: "The user explicitly set a maximum." });
  if (hotelStars && strictHotel) hardConstraints.push({ field: "hotelStars", operator: "equals", value: hotelStars, reason: "The user explicitly required this hotel category." });
  if (direct) hardConstraints.push({ field: "flightStops", operator: "maximum", value: 0, reason: "The user requires direct flights." });
  return {
    originalMessage: message, detectedLanguage: language, responseLanguage: preferredLanguage ?? language, languageConfidence: confidence,
    origin, destination, departureDate: isoDates[0], returnDate: isoDates[1], durationDays, travelerCount: numberBefore(message, /travelers?|people|nəfər|nefer|kişi|kisi/),
    totalBudget: budget ? Number(budget[1].replace(",", ".")) : undefined, currency: budget?.[2]?.toUpperCase() as TravelIntent["currency"],
    purpose: /meeting|görüş|gorus|toplantı|toplanti/i.test(message) ? "Business meeting" : undefined,
    travelStyle: /luxury|lüks|premium|beşulduz|5\s*(?:star|ulduz|yıldız)/i.test(message) ? "luxury" : undefined,
    hotelStars, accommodationType: /apartment|mənzil|daire/i.test(message) ? "apartment" : /hotel|otel/i.test(message) ? "hotel" : undefined,
    accommodationLevel: hotelStars && hotelStars >= 4 ? "premium" : undefined, locationPreferences: locations,
    restaurantPreferences: [michelin ? "Michelin-starred" : "", /good restaurants|yaxşı restoran|yaxshi restoran|güzel restoran/i.test(message) ? "well-regarded restaurants" : ""].filter(Boolean),
    cuisinePreferences: [], attractionPreferences: attractions, transportPreferences: direct ? ["direct flights"] : [], flightCabin: /business class|biznes klass/i.test(message) ? "business" : /premium economy/i.test(message) ? "premium_economy" : /economy|ekonom/i.test(message) ? "economy" : undefined,
    directFlightsOnly: direct || undefined, accessibilityNeeds: [], hardConstraints,
    softPreferences: [...locations, ...(quiet ? ["quiet accommodation"] : []), ...(hotelStars && !strictHotel ? [`${hotelStars}-star hotel`] : [])],
    specialRequests: michelin ? ["Verify Michelin recognition independently"] : [], requiresMichelinVerification: michelin,
  };
}

export function toPlannerInput(intent: TravelIntent): Partial<TravelRequest> {
  const interests = intent.attractionPreferences.map((x) => x === "major attractions" ? "architecture" : x).filter((x) => ["museums", "architecture", "history", "food", "shopping", "nature"].includes(x));
  return {
    origin: intent.origin, destination: intent.destination, departureDate: intent.departureDate, returnDate: intent.returnDate,
    travelerCount: intent.travelerCount, corporateBudget: intent.totalBudget, currency: intent.currency, purpose: intent.purpose,
    cabinPreference: intent.flightCabin, accommodationPreference: intent.accommodationType, accommodationLevel: intent.accommodationLevel,
    leisureEnabled: interests.length > 0 || undefined, interests: interests.length ? interests : undefined,
    specialRequirements: [...intent.locationPreferences, ...intent.restaurantPreferences, ...intent.softPreferences, ...intent.specialRequests].join(". ") || undefined,
  };
}

export function buildInterpretation(intent: TravelIntent, source: "openai" | "fallback", model?: string): AgentInterpretation {
  const lang = intent.responseLanguage;
  const clarificationQuestions = [!intent.destination ? t(lang, "clarifyDestination") : "", !intent.origin ? t(lang, "clarifyOrigin") : "", (!intent.departureDate || !intent.returnDate) ? t(lang, "clarifyDates") : ""].filter(Boolean);
  const warnings = [intent.destination && !SUPPORTED.has(intent.destination) ? t(lang, "unsupported") : "", intent.requiresMichelinVerification ? t(lang, "michelin") : ""].filter(Boolean);
  return { source, model, intent, plannerInput: toPlannerInput(intent), clarificationQuestions, warnings, response: clarificationQuestions.length ? clarificationQuestions[0] : t(lang, "ready") };
}

export function fallbackRegeneration(instruction: string, preferred?: AgentLanguage, hotelId?: string): RegenerationIntent {
  const language = detectLanguage(instruction, preferred).language;
  const replace = /another hotel|başqa otel|basqa otel|başka bir otel|change.*hotel|otel.*dəyiş|otel.*değiş/i.test(instruction);
  return { language, action: /cheaper|ucuz|daha ucuz/i.test(instruction) ? "cheaper" : /luxur|lüks/i.test(instruction) ? "more_luxurious" : /reset|sıfırla|sifirla/i.test(instruction) ? "reset_exclusions" : replace ? "replace_hotel" : /center|mərkəz|merkez/i.test(instruction) ? "closer_to_center" : "change_restaurants", preserveFlight: /keep the flight|uçuşu saxla|ucusu saxla|uçuşu koru/i.test(instruction) || replace, rejectedHotelId: replace ? hotelId : undefined, addedHardConstraints: [], addedSoftPreferences: [] };
}
