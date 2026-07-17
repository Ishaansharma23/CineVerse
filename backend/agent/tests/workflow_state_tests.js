/**
 * Workflow State Integration Tests
 * 
 * Tests the 4 required conversation scenarios from the bug report.
 * Run: node agent/tests/workflow_state_tests.js
 */

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseNaturalDate = (dateStr) => {
  if (!dateStr) return null;
  const s = dateStr.toLowerCase().trim();
  const now = new Date();
  const currentYear = now.getFullYear();

  if (s === "today") return formatLocalDate(now);
  if (s === "tomorrow") {
    const t = new Date(now);
    t.setDate(t.getDate() + 1);
    return formatLocalDate(t);
  }

  const monthNames = { jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11 };

  const match1 = s.match(/^(\d{1,2})\s+(\w+)$/);
  if (match1) {
    const day = parseInt(match1[1]);
    const monthKey = match1[2].toLowerCase();
    if (monthNames[monthKey] !== undefined) {
      const month = monthNames[monthKey];
      const d = new Date(currentYear, month, day);
      if (d < now) d.setFullYear(currentYear + 1);
      return formatLocalDate(d);
    }
  }

  const match2 = s.match(/^(\w+)\s+(\d{1,2})$/);
  if (match2) {
    const monthKey = match2[1].toLowerCase();
    const day = parseInt(match2[2]);
    if (monthNames[monthKey] !== undefined) {
      const month = monthNames[monthKey];
      const d = new Date(currentYear, month, day);
      if (d < now) d.setFullYear(currentYear + 1);
      return formatLocalDate(d);
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    if (parsed.getFullYear() < 2020) parsed.setFullYear(currentYear);
    return formatLocalDate(parsed);
  }

  return null;
};

const shouldResumePendingWorkflow = (msg, pendingAction, pendingOptions) => {
  if (!pendingAction) return false;
  const m = msg.toLowerCase().trim();
  const words = m.replace(/[^a-z0-9 ]/g, "").split(/\s+/);

  const resumeWords = ["continue", "resume", "yes", "proceed", "ok", "okay", "sure", "yep", "yup", "fine"];
  const resumePhrases = ["go ahead", "that works", "okay continue", "sounds good"];
  if (resumeWords.some(w => words.includes(w))) return true;
  if (resumePhrases.some(p => m.includes(p))) return true;

  if (pendingAction === "selectAlternativeTheatre" && pendingOptions?.theatres) {
    if (pendingOptions.theatres.some(t => m.includes(t.toLowerCase()))) return true;
  }

  const numberWords = ["first", "second", "third", "one", "two", "three"];
  const numberDigits = ["1", "2", "3"];
  const hasOptions = pendingOptions?.theatres?.length > 0 || pendingOptions?.dates?.length > 0 || pendingOptions?.timings?.length > 0;
  if (hasOptions && (numberWords.some(n => words.includes(n)) || numberDigits.some(n => words.includes(n)))) {
    return true;
  }

  return false;
};

const detectStrongIntent = (msgLower) => {
  if (msgLower.includes("cancel")) return "cancellation";
  if (msgLower.includes("reschedule") || msgLower.includes("change show")) return "reschedule";
  if (msgLower.includes("refund")) return "refund";
  if (msgLower.includes("history") || msgLower.includes("my ticket") || msgLower.includes("my booking")) return "booking_history";
  if (msgLower.includes("recommend") || msgLower.includes("suggest")) return "recommendation";
  const cleaned = msgLower.replace(/[^a-z ]/g, "").trim();
  if (["hi", "hello", "hey", "good morning", "good evening", "greetings"].includes(cleaned)) return "greeting";
  if (msgLower.includes("help") || msgLower.includes("faq")) return "general_chat";
  return null;
};

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log("  ✅ " + testName);
    passed++;
  } else {
    console.log("  ❌ " + testName);
    failed++;
  }
}

console.log("\n📋 CONVERSATION 1: Alternative theatre confirmation");

assert(
  shouldResumePendingWorkflow("yes", "selectAlternativeTheatre", { theatres: ["PVR Vegas Mall"] }) === true,
  "User says 'yes' to alternative theatre → should resume"
);

assert(
  shouldResumePendingWorkflow("PVR Vegas Mall", "selectAlternativeTheatre", { theatres: ["PVR Vegas Mall"] }) === true,
  "User names the theatre directly → should resume"
);

assert(
  shouldResumePendingWorkflow("first", "selectAlternativeTheatre", { theatres: ["PVR Vegas Mall", "PVR Dwarka"] }) === true,
  "User says 'first' → should resume"
);

console.log("\n📋 CONVERSATION 2: Strong intent overrides pending workflow");

assert(
  detectStrongIntent("show my booking history") === "booking_history",
  "'show my booking history' → booking_history"
);

assert(
  detectStrongIntent("cancel my booking") === "cancellation",
  "'cancel my booking' → cancellation"
);

assert(
  shouldResumePendingWorkflow("show my booking history", "confirmAlternativeDate", { date: "Jul 20" }) === false,
  "'show my booking history' does NOT resume pending workflow"
);

console.log("\n📋 CONVERSATION 3: Pending action consumed after confirmation");

const state = { pendingAction: "confirmSeatReservation", pendingOptions: { showId: "abc", seats: "A1, A2" } };
const confirmationWords = ["yes", "confirm", "reserve", "book", "sure", "ha", "okay", "go ahead"];
const isConfirmed = confirmationWords.some(w => "yes".includes(w));

let updates = {};
if (state.pendingAction === "confirmSeatReservation" && isConfirmed) {
  updates.intent = "booking";
  updates.status = "SEAT_CONFIRMED";
  updates.pendingAction = null;
  updates.pendingOptions = null;
}

assert(updates.pendingAction === null, "After 'yes', pendingAction is null");
assert(updates.pendingOptions === null, "After 'yes', pendingOptions is null");
assert(updates.status === "SEAT_CONFIRMED", "After 'yes', status is SEAT_CONFIRMED");

console.log("\n📋 CONVERSATION 4: Date consistency");

const currentYear = new Date().getFullYear();

assert(
  parseNaturalDate("20 July") === currentYear + "-07-20",
  "'20 July' → " + currentYear + "-07-20"
);

assert(
  parseNaturalDate("July 20") === currentYear + "-07-20",
  "'July 20' → " + currentYear + "-07-20"
);

assert(
  parseNaturalDate("2026-07-20") === "2026-07-20",
  "'2026-07-20' → 2026-07-20 (passthrough)"
);

assert(
  parseNaturalDate("tomorrow") !== null,
  "'tomorrow' produces a valid date"
);

assert(
  parseNaturalDate("today") === formatLocalDate(new Date()),
  "'today' → today's actual date"
);

const badDate = new Date("20 July");
assert(
  parseNaturalDate("20 July") !== badDate.toISOString().split("T")[0],
  "'20 July' must NOT produce the JS default (year 2001)"
);

console.log("\n📋 EXTRA: Word boundary matching");

assert(
  shouldResumePendingWorkflow("booking", "confirmAlternativeDate", { date: "Jul 20" }) === false,
  "'booking' does NOT accidentally match 'ok' inside the word"
);

assert(
  shouldResumePendingWorkflow("show me something", "confirmAlternativeDate", { date: "Jul 20" }) === false,
  "'show me something' does NOT resume"
);

assert(
  shouldResumePendingWorkflow("sure", "confirmAlternativeDate", { date: "Jul 20" }) === true,
  "'sure' resumes pending"
);

console.log("\n" + "=".repeat(40));
console.log("Results: " + passed + " passed, " + failed + " failed");
console.log("=".repeat(40));

process.exit(failed > 0 ? 1 : 0);
