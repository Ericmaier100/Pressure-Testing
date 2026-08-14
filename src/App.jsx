import { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Users, ClipboardList, Inbox, Timer, RotateCcw, Target, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "./supabaseClient";

const TOPICS = [
  "Structural Analysis (Loads & Load Effects)",
  "Reinforced Concrete Design",
  "Steel Design",
  "Foundations & Geotechnical",
  "Lateral Systems (Wind & Seismic)",
];

// Warm "drafting vellum" palette — cream/tan paper tones instead of dark blueprint
const PAPER = "#F3F6F7";    // card/panel background — soft, muted blue-gray, not bright white
const PAPER_2 = "#FAFCFC";  // sheet/panel/card background — gentle off-white
const CANVAS = "#16303F";   // outer page canvas — dark blueprint navy; cards stay light on top of it
const CANVAS_GRID = "rgba(255,255,255,0.07)"; // ruled grid lines etched into the blueprint canvas
const INK = "#3A4750";      // primary text and outlines — softened slate, not near-black
const LINE = INK;           // kept as an alias so no text ends up unreadable
const STEEL = "#8398A6";    // secondary text — soft muted blue-gray
const AMBER = "#C79552";    // accent — muted, desaturated amber
const RED = "#B5514A";      // incorrect / weak — softened terracotta
const GREEN = "#4F8058";    // correct / strong — muted sage green

let idCounter = 300;
function nextId() {
  idCounter += 1;
  return `q${idCounter}`;
}

const SEED_TEAM = [
  { id: "e1", name: "R. Alvarez", role: "EIT, Structural", readiness: 78, topics: { "Structural Analysis (Loads & Load Effects)": 82, "Reinforced Concrete Design": 74, "Steel Design": 80, "Foundations & Geotechnical": 65, "Lateral Systems (Wind & Seismic)": 88 } },
  { id: "e2", name: "M. Okafor", role: "EIT, Structural", readiness: 61, topics: { "Structural Analysis (Loads & Load Effects)": 70, "Reinforced Concrete Design": 55, "Steel Design": 58, "Foundations & Geotechnical": 60, "Lateral Systems (Wind & Seismic)": 62 } },
  { id: "e3", name: "J. Park", role: "EIT, Structural", readiness: 85, topics: { "Structural Analysis (Loads & Load Effects)": 88, "Reinforced Concrete Design": 84, "Steel Design": 90, "Foundations & Geotechnical": 79, "Lateral Systems (Wind & Seismic)": 83 } },
  { id: "e4", name: "S. Whitfield", role: "EIT, Structural", readiness: 54, topics: { "Structural Analysis (Loads & Load Effects)": 62, "Reinforced Concrete Design": 48, "Steel Design": 51, "Foundations & Geotechnical": 45, "Lateral Systems (Wind & Seismic)": 65 } },
  { id: "e5", name: "D. Nasser", role: "EIT, Structural", readiness: 71, topics: { "Structural Analysis (Loads & Load Effects)": 75, "Reinforced Concrete Design": 68, "Steel Design": 72, "Foundations & Geotechnical": 66, "Lateral Systems (Wind & Seismic)": 74 } },
];

const SEED_BANK = {
  // Nothing starts pre-approved — every question waits in the Review Queue until you personally approve it.
  approved: [],
  pending: [
    { id: "q1", topic: TOPICS[0], difficulty: "easy", question: "A simply supported beam carries a uniformly distributed load w over span L. Where does the maximum bending moment occur?", options: ["At the supports", "At the quarter points", "At midspan", "It is constant along the span"], correctIndex: 2, explanation: "For a simply supported beam under UDL, shear is zero (and moment is maximum) at midspan by symmetry." },
    { id: "q2", topic: TOPICS[0], difficulty: "medium", question: "Which load combination typically governs design for a low-rise structure in a region with high seismic risk but low wind speed?", options: ["Dead only", "Dead + Live", "Dead + Seismic", "Dead + Wind"], correctIndex: 2, explanation: "Where seismic demand exceeds wind demand, the seismic load combination controls the governing design case." },
    { id: "q3", topic: TOPICS[0], difficulty: "medium", question: "Increasing a beam's moment of inertia while keeping span and load constant primarily reduces which quantity?", options: ["Applied moment", "Deflection", "Reaction forces", "Applied shear"], correctIndex: 1, explanation: "Deflection is inversely proportional to moment of inertia; applied loads and reactions are unaffected." },
    { id: "q4", topic: TOPICS[0], difficulty: "hard", question: "A cantilever beam is loaded with a point load at its free end. Where is the bending moment greatest?", options: ["At the free end", "At midspan", "At the fixed support", "It is uniform"], correctIndex: 2, explanation: "Moment accumulates along the cantilever and peaks at the fixed support, where the internal resisting moment is largest." },
    { id: "q7", topic: TOPICS[1], difficulty: "easy", question: "In a reinforced concrete beam, what is the primary purpose of shear reinforcement (stirrups)?", options: ["Resist flexural tension", "Resist diagonal tension from shear", "Reduce creep deflection", "Control temperature cracking only"], correctIndex: 1, explanation: "Stirrups resist diagonal tension stresses from shear, which concrete alone cannot adequately carry." },
    { id: "q8", topic: TOPICS[1], difficulty: "medium", question: "As the effective depth of a reinforced concrete beam increases (all else equal), the required flexural steel area generally:", options: ["Increases", "Decreases", "Stays the same", "Becomes zero"], correctIndex: 1, explanation: "A larger internal moment arm from greater effective depth reduces the steel area needed to resist the same moment." },
    { id: "q9", topic: TOPICS[2], difficulty: "medium", question: "For a steel beam governed by lateral-torsional buckling, which change most directly improves capacity?", options: ["Reducing unbraced length", "Increasing beam length", "Removing stiffeners", "Reducing flange width"], correctIndex: 0, explanation: "Lateral-torsional buckling capacity increases as unbraced length decreases, since buckling resistance is length-dependent." },
    { id: "q10", topic: TOPICS[2], difficulty: "hard", question: "In a bolted steel connection, slip-critical bolts are specified primarily to control:", options: ["Corrosion", "Relative slip between plies under service loads", "Weld distortion", "Fatigue in welds"], correctIndex: 1, explanation: "Slip-critical connections rely on friction from bolt clamping force to prevent ply movement under service loads." },
    { id: "q11", topic: TOPICS[3], difficulty: "easy", question: "A spread footing's bearing capacity is most directly limited by which soil property?", options: ["Soil color", "Shear strength", "Thermal conductivity", "Permeability alone"], correctIndex: 1, explanation: "Bearing capacity failure is fundamentally a shear failure mechanism in the soil beneath and around the footing." },
    { id: "q12", topic: TOPICS[3], difficulty: "medium", question: "Increasing footing width, all else equal, generally has what effect on settlement under a given bearing pressure?", options: ["No effect", "Increases settlement depth of influence", "Eliminates settlement", "Always decreases total settlement"], correctIndex: 1, explanation: "Wider footings mobilize soil to greater depth, increasing the zone of influence contributing to settlement." },
    { id: "q13", topic: TOPICS[4], difficulty: "easy", question: "In seismic design, the base shear a structure must resist is most directly a function of:", options: ["Roof color", "Building weight and seismic response coefficients", "Window area only", "HVAC load"], correctIndex: 1, explanation: "Base shear is calculated from the structure's seismic weight combined with response coefficients reflecting site and system." },
    { id: "q14", topic: TOPICS[4], difficulty: "medium", question: "Which lateral system typically provides the stiffest response to wind or seismic load in a mid-rise building?", options: ["Moment frame alone", "Shear walls or braced frames", "Unbraced gravity frame", "Flat slab with no walls"], correctIndex: 1, explanation: "Shear walls and braced frames are substantially stiffer than moment frames, reducing lateral drift under equivalent loads." },
    // Additional original questions — written from general engineering knowledge, not derived from any specific code document or publisher's material
    { id: "q15", topic: TOPICS[0], difficulty: "easy", question: "For a simply supported beam under a single point load at midspan, where does maximum shear occur?", options: ["At midspan", "At the supports", "At the quarter points", "Shear is uniform along the span"], correctIndex: 1, explanation: "Shear is largest nearest the reactions and jumps at the load point; magnitude peaks at the supports." },
    { id: "q16", topic: TOPICS[0], difficulty: "medium", question: "Two identical-span beams carry the same uniform load: Beam A is fixed at both ends, Beam B is simply supported. Which has the lower maximum bending moment?", options: ["Beam A (fixed-fixed)", "Beam B (simply supported)", "They are equal", "Cannot be determined"], correctIndex: 0, explanation: "Fixed-end beams develop end moments that reduce the midspan moment relative to a simply supported beam under the same load." },
    { id: "q17", topic: TOPICS[0], difficulty: "medium", question: "A truss member found to carry zero force under a given load case is called a:", options: ["Redundant member", "Zero-force member", "Compression member", "Tie member"], correctIndex: 1, explanation: "Zero-force members are identified via joint equilibrium, commonly at joints with only two non-collinear members and no external load." },
    { id: "q18", topic: TOPICS[0], difficulty: "hard", question: "For a statically indeterminate beam, which method directly enforces compatibility of deflections to solve for redundant reactions?", options: ["Method of sections", "Force (flexibility) method", "Direct stiffness only", "Tributary area method"], correctIndex: 1, explanation: "The force method releases redundant reactions and enforces deflection compatibility at those points to solve for them." },
    { id: "q19", topic: TOPICS[0], difficulty: "easy", question: "Dead load in structural design primarily represents:", options: ["Wind pressure", "The permanent weight of the structure and fixed elements", "Occupancy load that varies over time", "Seismic ground acceleration"], correctIndex: 1, explanation: "Dead load is the fixed, permanent weight of structural and non-structural components." },
    { id: "q20", topic: TOPICS[0], difficulty: "medium", question: "In load combination design, why are live and wind loads rarely assumed to act at their full magnitude simultaneously?", options: ["Codes ignore wind entirely", "The probability of both peaking at once is low", "Wind load is always larger", "Live load never varies"], correctIndex: 1, explanation: "Load combination factors account for the low joint probability of multiple transient loads reaching their peak at the same time." },
    { id: "q21", topic: TOPICS[1], difficulty: "easy", question: "What is the primary function of concrete cover over reinforcing steel?", options: ["Improve aesthetics", "Protect steel from corrosion and provide fire resistance", "Increase compressive strength of the concrete", "Reduce self-weight"], correctIndex: 1, explanation: "Cover shields reinforcement from moisture and heat, protecting against corrosion and providing fire resistance." },
    { id: "q22", topic: TOPICS[1], difficulty: "medium", question: "As concrete compressive strength increases while other variables are held constant, the depth of the flexural compression block generally:", options: ["Increases", "Decreases", "Stays constant", "Becomes negative"], correctIndex: 1, explanation: "Higher concrete strength allows a shallower stress block to develop the same compressive force." },
    { id: "q23", topic: TOPICS[1], difficulty: "medium", question: "A reinforced concrete column primarily resists axial load through:", options: ["Concrete and steel acting compositely in compression", "Steel alone", "Concrete alone", "Only the outer cover"], correctIndex: 0, explanation: "Column capacity comes from the combined compressive contribution of the concrete and longitudinal steel acting together." },
    { id: "q24", topic: TOPICS[1], difficulty: "hard", question: "In a two-way concrete slab, punching shear failure occurs around:", options: ["The slab edge only", "The perimeter of a column or concentrated load", "The midspan region", "The slab corners exclusively"], correctIndex: 1, explanation: "Punching shear is a localized failure forming a truncated cone around a column or concentrated load." },
    { id: "q25", topic: TOPICS[1], difficulty: "easy", question: "Why is reinforcing steel typically placed near the tension face of a concrete beam?", options: ["Concrete is weak in tension, so steel carries the tensile stresses", "Steel is cheaper near the surface", "To reduce curing time", "It has no structural purpose"], correctIndex: 0, explanation: "Concrete resists compression well but cracks under tension, so steel is placed to carry the tensile stresses instead." },
    { id: "q26", topic: TOPICS[1], difficulty: "medium", question: "Which of the following most directly helps reduce long-term (creep-related) deflection in a reinforced concrete beam?", options: ["Reducing compression steel", "Adding compression reinforcement", "Increasing span length", "Reducing beam width"], correctIndex: 1, explanation: "Compression reinforcement helps restrain long-term creep deflection in concrete beams." },
    { id: "q27", topic: TOPICS[2], difficulty: "easy", question: "The primary purpose of a base plate under a steel column is to:", options: ["Distribute the column load to the foundation over a larger area", "Increase column height", "Resist wind uplift only", "Reduce steel weight"], correctIndex: 0, explanation: "Base plates spread concentrated column load over a larger foundation area to keep bearing pressure within limits." },
    { id: "q28", topic: TOPICS[2], difficulty: "medium", question: "For a steel tension member, which failure mode accounts for the reduced cross-section at bolt holes?", options: ["Gross yielding", "Net section fracture", "Local buckling", "Lateral-torsional buckling"], correctIndex: 1, explanation: "Net section fracture accounts for the reduced area at bolt holes, where stress concentrates." },
    { id: "q29", topic: TOPICS[2], difficulty: "medium", question: "Which connection type is generally assumed to transfer moment as well as shear between members?", options: ["Simple shear connection", "Moment (rigid) connection", "Pinned connection", "Bearing-only connection"], correctIndex: 1, explanation: "Moment connections are designed to transfer both shear and rotational moment between connected members." },
    { id: "q30", topic: TOPICS[2], difficulty: "hard", question: "A steel column's buckling capacity is most sensitive to which parameter, all else equal?", options: ["Yield strength alone", "Slenderness ratio", "Cross-section color", "Weld type"], correctIndex: 1, explanation: "Buckling capacity is governed largely by slenderness ratio, relating effective length to radius of gyration." },
    { id: "q31", topic: TOPICS[2], difficulty: "easy", question: "Shear studs in composite steel-concrete beams primarily function to:", options: ["Transfer horizontal shear between the steel beam and concrete slab", "Resist wind load", "Reduce beam depth", "Prevent corrosion"], correctIndex: 0, explanation: "Shear studs transfer horizontal shear at the steel-concrete interface, allowing the two materials to act compositely." },
    { id: "q32", topic: TOPICS[2], difficulty: "medium", question: "Increasing a steel beam's unbraced length, all else equal, generally has what effect on its flexural capacity?", options: ["No effect", "Decreases it due to increased buckling susceptibility", "Increases it", "Only affects shear capacity"], correctIndex: 1, explanation: "Longer unbraced lengths increase susceptibility to lateral-torsional buckling, reducing flexural capacity." },
    { id: "q33", topic: TOPICS[3], difficulty: "easy", question: "Which soil property most directly governs consolidation settlement in clay?", options: ["Compressibility, governed by void ratio changes under load", "Soil color", "Grain shape alone", "Thermal conductivity"], correctIndex: 0, explanation: "Consolidation settlement in clay is driven by compressibility, reflected in void ratio change under sustained load." },
    { id: "q34", topic: TOPICS[3], difficulty: "medium", question: "A mat (raft) foundation is typically chosen over multiple spread footings when:", options: ["Soil bearing capacity is low or footings would overlap", "Loads are very light", "Bedrock is at the surface", "Only for aesthetic reasons"], correctIndex: 0, explanation: "Mat foundations spread load over a large area, useful when low bearing capacity or footing overlap makes individual footings impractical." },
    { id: "q35", topic: TOPICS[3], difficulty: "medium", question: "Which factor most directly reduces a pile's allowable skin friction capacity in soft clay?", options: ["Higher pile roughness", "Low undrained shear strength of the surrounding clay", "Larger pile diameter", "Deeper embedment alone"], correctIndex: 1, explanation: "Skin friction in clay is governed largely by the soil's undrained shear strength; softer clay provides less resistance." },
    { id: "q36", topic: TOPICS[3], difficulty: "hard", question: "In a slope stability analysis, the factor of safety is generally defined as the ratio of:", options: ["Driving forces to resisting forces", "Resisting shear strength to driving forces", "Total stress to effective stress", "Void ratio to porosity"], correctIndex: 1, explanation: "Factor of safety compares available resisting shear strength to the driving forces causing instability." },
    { id: "q37", topic: TOPICS[3], difficulty: "easy", question: "Rising groundwater within a soil mass generally has what effect on effective stress?", options: ["Increases effective stress", "Decreases effective stress", "No effect", "Effective stress becomes undefined"], correctIndex: 1, explanation: "Rising groundwater increases pore pressure, which reduces effective stress per Terzaghi's effective stress principle." },
    { id: "q38", topic: TOPICS[3], difficulty: "medium", question: "Why is a geotechnical report typically required before finalizing a foundation design?", options: ["To characterize soil properties governing bearing capacity and settlement", "To determine exterior paint color", "It's only needed for high-rise buildings", "To calculate wind loads"], correctIndex: 0, explanation: "Geotechnical investigation characterizes subsurface conditions that directly govern foundation type, bearing capacity, and settlement." },
    { id: "q39", topic: TOPICS[4], difficulty: "easy", question: "Which of the following best describes a building's seismic weight?", options: ["Only the roof weight", "The total weight contributing to seismic inertial forces", "Wind pressure on the facade", "The weight of structural steel only"], correctIndex: 1, explanation: "Seismic weight includes dead load plus applicable portions of other loads that contribute mass to seismic inertial forces." },
    { id: "q40", topic: TOPICS[4], difficulty: "medium", question: "A soft-story condition in seismic design refers to:", options: ["A story with significantly less lateral stiffness than adjacent stories", "A story built with lightweight materials", "A basement level", "A story with reduced floor-to-floor height"], correctIndex: 0, explanation: "Soft stories concentrate seismic drift and damage due to a stiffness discontinuity between adjacent floors." },
    { id: "q41", topic: TOPICS[4], difficulty: "medium", question: "Torsional irregularity in a building's lateral system typically arises from:", options: ["Symmetric mass and stiffness distribution", "An offset between the center of mass and center of rigidity", "Uniform column spacing", "Increased foundation depth"], correctIndex: 1, explanation: "Torsional irregularity results when the center of mass and center of rigidity don't coincide, inducing twist under lateral load." },
    { id: "q42", topic: TOPICS[4], difficulty: "hard", question: "In wind load design, the design pressure on a building's windward face generally increases with:", options: ["Decreasing height above ground", "Increasing height above ground, up to a defined limit", "Building color", "Roof slope only"], correctIndex: 1, explanation: "Wind velocity pressure generally increases with height due to reduced ground-level turbulence, up to a code-defined limit." },
    { id: "q43", topic: TOPICS[4], difficulty: "easy", question: "A diaphragm in a building's lateral system primarily functions to:", options: ["Transfer lateral forces from floors and roof to the vertical lateral system", "Support only gravity loads", "Resist only axial compression", "Provide fireproofing"], correctIndex: 0, explanation: "Diaphragms collect lateral forces at each floor/roof level and transfer them to the vertical lateral-resisting elements." },
    { id: "q44", topic: TOPICS[4], difficulty: "medium", question: "Which best describes the role of a moment frame's beam-column connections in resisting lateral load?", options: ["They are designed to develop and transfer moment, providing lateral stiffness", "They are pinned and transfer no moment", "They only resist gravity loads", "They are purely decorative"], correctIndex: 0, explanation: "Moment frame connections are designed to transfer moment between beams and columns, which is what gives the frame lateral stiffness." },
    { id: "q5", topic: "Reinforced Concrete Design", difficulty: "medium", question: "Which factor most directly increases the development length required for reinforcing bars?", options: ["Larger bar diameter", "Higher concrete strength", "Epoxy coating removal", "Shorter bar spacing"], correctIndex: 0, explanation: "Development length scales with bar diameter — larger bars require more embedment to transfer force to the concrete." },
    { id: "q6", topic: "Foundations & Geotechnical", difficulty: "easy", question: "A deep foundation transfers load to bearing strata primarily through which two mechanisms?", options: ["Color and texture", "End bearing and skin friction", "Thermal expansion only", "Surface tension"], correctIndex: 1, explanation: "Piles and drilled shafts carry load via end bearing at the tip and skin friction along the shaft." },
  ],
  rejected: [],
};

// Difficulty is no longer author-assigned. It's computed from real answer data:
// each question tracks attempts/correct across everyone who's answered it, and a
// 1-10 difficulty score is derived from the actual miss rate. Used internally for
// adaptive selection — never shown to users as a label.
const MIN_ATTEMPTS_FOR_SCORE = 3;

function getDifficultyScore(qId, stats) {
  const s = stats[qId];
  if (!s || s.attempts < MIN_ATTEMPTS_FOR_SCORE) return null; // not enough data yet
  const missRate = 1 - s.correct / s.attempts;
  return Math.max(1, Math.min(10, Math.round(missRate * 9) + 1));
}

function targetScoreForAccuracy(accuracy) {
  // Low accuracy in a topic -> aim easier (low score). High accuracy -> aim harder (high score).
  return Math.max(1, Math.min(10, Math.round(1 + (accuracy / 100) * 9)));
}

function scoreColor(v) {
  if (v >= 75) return GREEN;
  if (v >= 60) return AMBER;
  return RED;
}

function pickAdaptiveSet(pool, accuracy, count, priorityQuestions = [], stats = {}) {
  const priIds = new Set(priorityQuestions.map((q) => q.id));
  const remainingPool = pool.filter((q) => !priIds.has(q.id));
  const target = targetScoreForAccuracy(accuracy);

  // Questions without enough answer data yet get a neutral score so they still
  // surface sometimes — that's how they accumulate the data needed to be scored at all.
  const scored = remainingPool
    .map((q) => ({ q, score: getDifficultyScore(q.id, stats) ?? 5, hasData: getDifficultyScore(q.id, stats) !== null }))
    .sort((a, b) => Math.abs(a.score - target) - Math.abs(b.score - target) || Math.random() - 0.5);

  const need = Math.max(0, count - priorityQuestions.length);
  const picked = scored.slice(0, need).map((s) => s.q);
  return [...priorityQuestions, ...picked];
}

// A person's per-topic record is stored as { attempts, correct } so it accumulates
// across every quiz they ever take (baseline, quick, timed, adaptive alike) instead
// of being overwritten by whichever set they answered most recently. This reads that
// as a 0-100 percentage; it also tolerates the old plain-number format (mock team
// data, or pre-migration accounts) so nothing crashes on legacy shapes.
function topicPct(val) {
  if (val == null) return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "object" && val.attempts > 0) return Math.round((val.correct / val.attempts) * 100);
  return undefined;
}

// Total questions a person has ever answered across all topics — used to gate
// Adaptive practice behind a 20-question baseline.
function totalAttempts(topics) {
  return Object.values(topics || {}).reduce((sum, v) => sum + (v && typeof v === "object" ? v.attempts : 0), 0);
}

const BASELINE_TARGET = 20;

function DimensionBar({ label, value }) {
  const color = scoreColor(value);
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0 text-[11px] tracking-wide" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</div>
      <svg width="100%" height="22" viewBox="0 0 300 22" preserveAspectRatio="none" className="flex-1">
        <line x1="0" y1="11" x2="300" y2="11" stroke={STEEL} strokeWidth="1" opacity="0.35" />
        {[0, 25, 50, 75, 100].map((t) => (<line key={t} x1={t * 3} y1="6" x2={t * 3} y2="16" stroke={STEEL} strokeWidth="1" opacity="0.35" />))}
        <line x1="0" y1="11" x2={value * 3} y2="11" stroke={color} strokeWidth="3" />
        <line x1="0" y1="4" x2="0" y2="18" stroke={color} strokeWidth="2" />
        <line x1={value * 3} y1="4" x2={value * 3} y2="18" stroke={color} strokeWidth="2" />
      </svg>
      <div className="w-12 shrink-0 text-right text-[13px] font-semibold" style={{ color, fontFamily: "'IBM Plex Mono', monospace" }}>{value}%</div>
    </div>
  );
}

function CornerTicks({ variant = "all" }) {
  const marks = variant === "all"
    ? ["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"]
    : ["top-0 left-0 border-t-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"];
  return marks.map((pos, i) => (
    <span key={i} className={`pointer-events-none absolute ${pos} w-2.5 h-2.5`} style={{ borderColor: AMBER }} />
  ));
}

function Sheet({ sheetNo, title, children }) {
  return (
    <div className="relative border rounded-none p-6" style={{ borderColor: INK, borderWidth: 1, background: PAPER_2 }}>
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Sheet {sheetNo}</div>
        <h2 className="text-xl mt-1" style={{ color: LINE, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

async function generateQuestions(topic, referenceQuestions = [], rejectionNotes = []) {
  // Calls our own safe backend endpoint (api/generate-questions.js) instead of
  // Anthropic directly — the real API key lives only on the server, never here.
  // referenceQuestions: a few of THIS PRODUCT'S OWN already-approved questions on
  // this topic, sent along as grounding so new questions match their accuracy/style.
  // rejectionNotes: short admin-written reasons a few PAST generated questions on this
  // topic were rejected (e.g. "too easy", "ambiguous wording", "wrong code reference").
  // Kept as plain reason strings only (not the rejected question text) and capped at 3
  // to keep the prompt — and token usage — small.
  const examples = referenceQuestions.slice(0, 3).map((q) => ({
    question: q.question, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation,
  }));
  const feedback = rejectionNotes
    .filter(Boolean)
    .slice(-3)
    .map((n) => n.trim().slice(0, 200));
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, examples, feedback }),
  });
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("No response content");
  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.questions.map((q) => ({ ...q, id: nextId(), topic }));
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function QuizRunner({ quiz, submitted, answers, onAnswer, onSubmit, allAnswered }) {
  return (
    <>
      <div className="space-y-6 mt-4">
        {quiz.map((q, i) => {
          const picked = answers[i];
          return (
            <div key={q.id} className="pb-5" style={{ borderBottom: `1px solid ${STEEL}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>{q.topic}</span>
              </div>
              <div className="text-sm mb-3" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                <span style={{ fontWeight: 600 }}>Q{i + 1}. </span>{q.question}
              </div>
              {q.imageUrls && q.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {q.imageUrls.map((url) => (<img key={url} src={url} alt="" className="max-h-72 border" style={{ borderColor: STEEL, background: PAPER_2 }} />))}
                </div>
              )}
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = picked === oi;
                  const showCorrect = submitted && oi === q.correctIndex;
                  const showWrongPick = submitted && isSelected && oi !== q.correctIndex;
                  return (
                    <button key={oi} disabled={submitted} onClick={() => onAnswer(i, oi)}
                      className="text-left px-3 py-2 text-sm flex items-center gap-2 rounded-none border transition"
                      style={{
                        borderColor: showCorrect ? GREEN : showWrongPick ? RED : isSelected ? AMBER : STEEL,
                        background: showCorrect ? GREEN : showWrongPick ? RED : isSelected && !submitted ? "rgba(199,149,82,0.15)" : "transparent",
                        color: showCorrect || showWrongPick ? PAPER_2 : LINE,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}>
                      {showCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: PAPER_2 }} />}
                      {showWrongPick && <XCircle className="w-4 h-4 shrink-0" style={{ color: PAPER_2 }} />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && <div className="mt-2 text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>{q.explanation}</div>}
            </div>
          );
        })}
      </div>
      {!submitted && (
        <button onClick={onSubmit} disabled={!allAnswered} className="mt-2 px-4 py-2 text-sm font-semibold rounded-none disabled:opacity-40"
          style={{ background: INK, color: PAPER_2, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Submit answers
        </button>
      )}
    </>
  );
}

function PracticeView({ bank, missed, you, questionStats, isAdmin, onRequestGeneration, onCompleteQuiz }) {
  const [mode, setMode] = useState(null); // null = landing chooser
  const [topic, setTopic] = useState(TOPICS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [requested, setRequested] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [missedThisAttempt, setMissedThisAttempt] = useState(null);
  const [adaptiveTopic, setAdaptiveTopic] = useState(null);
  const timerRef = useRef(null);

  const approvedForTopic = bank.approved.filter((q) => q.topic === topic);
  const hasEnough = approvedForTopic.length >= 4;
  const totalApproved = bank.approved.length;
  const canRunExam = totalApproved >= 6;
  const canRunBaseline = totalApproved >= 10;
  // Most recent rejection reasons an admin left for this topic — used to steer
  // the AI away from whatever made past generations get rejected.
  const rejectionNotesForTopic = bank.rejected
    .filter((q) => q.topic === topic && q.note)
    .map((q) => q.note);

  const eligibleTopics = TOPICS.filter((t) => bank.approved.filter((q) => q.topic === t).length >= 4);

  const attemptsSoFar = totalAttempts(you.topics);
  const baselineComplete = attemptsSoFar >= BASELINE_TARGET;
  const questionsUntilBaseline = Math.max(0, BASELINE_TARGET - attemptsSoFar);

  useEffect(() => {
    if (mode === "timed" && quiz && !submitted && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, quiz, submitted]);

  function openMode(key) {
    setMode(key);
    setQuiz(null);
    setRequested(false);
    setError(null);
  }

  function backToChooser() {
    setMode(null);
    setQuiz(null);
    setSubmitted(false);
    setAnswers({});
    setMissedThisAttempt(null);
    setTimeLeft(null);
  }

  function startQuick() {
    const missedForTopic = missed.filter((q) => q.topic === topic).slice(0, 2);
    const missedIds = new Set(missedForTopic.map((q) => q.id));
    const fresh = approvedForTopic.filter((q) => !missedIds.has(q.id)).sort(() => Math.random() - 0.5);
    const set = [...missedForTopic, ...fresh].slice(0, 4);
    setQuiz(set);
    setAnswers({});
    setSubmitted(false);
    setMissedThisAttempt(null);
    setTimeLeft(null);
  }

  function startAdaptive() {
    if (!baselineComplete || eligibleTopics.length === 0) return;
    // Weakest topic wins; unattempted topics default to 50 so they surface for coverage
    const ranked = [...eligibleTopics].sort((a, b) => (topicPct(you.topics[a]) ?? 50) - (topicPct(you.topics[b]) ?? 50));
    const target = ranked[0];
    setAdaptiveTopic(target);
    const acc = topicPct(you.topics[target]) ?? 50;
    const pool = bank.approved.filter((q) => q.topic === target);
    // No previously-missed questions mixed back in here — Adaptive only ever
    // serves fresh questions from the weak topic. Missed questions still live in
    // the review queue and can be retried from there or from Quick set.
    const set = pickAdaptiveSet(pool, acc, 4, [], questionStats);
    setQuiz(set);
    setAnswers({});
    setSubmitted(false);
    setMissedThisAttempt(null);
    setTimeLeft(null);
  }

  function startTimed() {
    const pool = [...bank.approved].sort(() => Math.random() - 0.5).slice(0, Math.min(10, bank.approved.length));
    setQuiz(pool);
    setAnswers({});
    setSubmitted(false);
    setMissedThisAttempt(null);
    setTimeLeft(pool.length * 120);
  }

  function startBaseline() {
    // Sample roughly evenly across every topic that has approved questions, then
    // fill any remaining slots from whichever topics have extra, capped at 20.
    const perTopicTarget = Math.floor(BASELINE_TARGET / TOPICS.length);
    let picked = [];
    TOPICS.forEach((t) => {
      const pool = bank.approved.filter((q) => q.topic === t).sort(() => Math.random() - 0.5);
      picked.push(...pool.slice(0, perTopicTarget));
    });
    if (picked.length < BASELINE_TARGET) {
      const usedIds = new Set(picked.map((q) => q.id));
      const remainder = bank.approved.filter((q) => !usedIds.has(q.id)).sort(() => Math.random() - 0.5);
      picked.push(...remainder.slice(0, BASELINE_TARGET - picked.length));
    }
    picked = picked.slice(0, BASELINE_TARGET);
    setQuiz(picked);
    setAnswers({});
    setSubmitted(false);
    setMissedThisAttempt(null);
    setTimeLeft(null);
  }

  async function requestMore() {
    setLoading(true);
    setError(null);
    try {
      const qs = await generateQuestions(topic, approvedForTopic, rejectionNotesForTopic);
      onRequestGeneration(qs);
      setRequested(true);
    } catch (e) {
      setError("Couldn't reach the AI generator right now. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    setSubmitted(true);
    const results = quiz.map((q, i) => ({ q, correct: answers[i] === q.correctIndex }));
    const correct = results.filter((r) => r.correct).length;
    const missedNow = results.filter((r) => !r.correct).map((r) => r.q);
    setMissedThisAttempt(missedNow);
    const label = mode === "timed" ? "Timed mock exam" : mode === "baseline" ? "Baseline test" : mode === "adaptive" ? adaptiveTopic : topic;
    onCompleteQuiz(label, correct, quiz.length, results);
  }

  function retryMissed() {
    setQuiz(missedThisAttempt);
    setAnswers({});
    setSubmitted(false);
    setMissedThisAttempt(null);
    setTimeLeft(null);
  }

  const allAnswered = quiz && quiz.every((_, i) => answers[i] !== undefined);
  const score = submitted && quiz ? quiz.filter((q, i) => answers[i] === q.correctIndex).length : null;

  if (mode === null) {
    return (
      <Sheet sheetNo="1 of 4" title="Practice">
        {!baselineComplete && (
          <div className="mb-6 p-4 border" style={{ borderColor: AMBER }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>Recommended first step</div>
            <div className="text-sm mb-3" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Take a {BASELINE_TARGET}-question baseline test across every topic. It's what unlocks Adaptive practice — {questionsUntilBaseline} question{questionsUntilBaseline === 1 ? "" : "s"} to go{attemptsSoFar > 0 ? " (any practice you've already done counts toward this)" : ""}.
            </div>
            {canRunBaseline ? (
              <button onClick={() => openMode("baseline")} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                <Target className="w-4 h-4" /> Start baseline test
              </button>
            ) : (
              <span className="text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Need at least 10 approved questions in the bank first.</span>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => baselineComplete && openMode("adaptive")}
            disabled={!baselineComplete}
            className="pt-btn text-left p-4 border rounded-none disabled:opacity-40"
          >
            <Target className="w-4 h-4 mb-2" style={{ color: AMBER }} />
            <div className="text-sm font-semibold mb-1" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>Adaptive</div>
            <div className="text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Shows you questions based on your weakest topics. Continuously assesses your weak topics based on practice question performance.
              {!baselineComplete && ` Locked — ${questionsUntilBaseline} more question${questionsUntilBaseline === 1 ? "" : "s"} to go.`}
            </div>
          </button>

          <button onClick={() => openMode("timed")} className="pt-btn text-left p-4 border rounded-none">
            <Timer className="w-4 h-4 mb-2" style={{ color: AMBER }} />
            <div className="text-sm font-semibold mb-1" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>Timed random exam</div>
            <div className="text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>A {Math.min(10, totalApproved)}-question mock exam, ~2 min/question, pulled at random across every topic.</div>
          </button>

          <button onClick={() => openMode("quick")} className="pt-btn text-left p-4 border rounded-none">
            <RefreshCw className="w-4 h-4 mb-2" style={{ color: AMBER }} />
            <div className="text-sm font-semibold mb-1" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>Specific review</div>
            <div className="text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Pick a topic yourself and go at your own pace.</div>
          </button>
        </div>

        {missed.length > 0 && (
          <div className="mt-5 text-[11px]" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>
            {missed.length} question{missed.length === 1 ? "" : "s"} in your review queue — retry them from Specific review.
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet sheetNo="1 of 4" title="Practice">
      <button onClick={backToChooser} className="text-xs mb-5 uppercase tracking-wide" style={{ color: STEEL, background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
        ← Back to practice options
      </button>

      {mode === "adaptive" && (
        <div className="mb-6">
          <button onClick={startAdaptive} disabled={eligibleTopics.length === 0} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none disabled:opacity-40" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Target className="w-4 h-4" />{quiz ? "New adaptive set" : "Start adaptive practice"}
          </button>
          <p className="text-xs mt-2" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Adaptive practice shows you questions based on your weakest topics{adaptiveTopic ? ` — currently: ${adaptiveTopic}` : ""}. It continuously assesses your weak topics based on practice question performance.
          </p>
        </div>
      )}

      {mode === "quick" && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={topic} onChange={(e) => { setTopic(e.target.value); setQuiz(null); setRequested(false); }} disabled={loading}
            className="px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {TOPICS.map((t) => (<option key={t} value={t} style={{ background: PAPER }}>{t}</option>))}
          </select>
          {hasEnough ? (
            <button onClick={startQuick} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              <RefreshCw className="w-4 h-4" />{quiz ? "New set from bank" : "Start practice set"}
            </button>
          ) : (
            <button onClick={requestMore} disabled={loading || requested} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none disabled:opacity-60" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Inbox className="w-4 h-4" />}
              {loading ? "Sending to review…" : requested ? "Sent for review" : "Request questions for review"}
            </button>
          )}
        </div>
      )}

      {mode === "timed" && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={startTimed} disabled={!canRunExam} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none disabled:opacity-40" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Timer className="w-4 h-4" />{quiz ? "New mock exam" : `Start ${Math.min(10, totalApproved)}-question mock exam`}
          </button>
          {!canRunExam && <span className="text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Need at least 6 approved questions across topics to run a mock exam.</span>}
          {timeLeft !== null && !submitted && (
            <span className="text-lg font-semibold flex items-center gap-1.5" style={{ color: timeLeft < 120 ? RED : LINE, fontFamily: "'IBM Plex Mono', monospace" }}>
              <Timer className="w-4 h-4" />{formatTime(timeLeft)}
            </span>
          )}
        </div>
      )}

      {mode === "baseline" && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={startBaseline} disabled={!canRunBaseline} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none disabled:opacity-40" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Target className="w-4 h-4" />{quiz ? "New baseline test" : `Start ${BASELINE_TARGET}-question baseline test`}
          </button>
          {!canRunBaseline && <span className="text-xs" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Need at least 10 approved questions in the bank first.</span>}
        </div>
      )}

      {error && <div className="flex items-center gap-2 text-sm mb-4" style={{ color: RED }}><AlertTriangle className="w-4 h-4" /> {error}</div>}

      {mode === "quick" && !hasEnough && !error && (
        <p className="text-sm mb-2" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Only {approvedForTopic.length} admin-approved question{approvedForTopic.length === 1 ? "" : "s"} for this topic — need at least 4 to start.
          {requested ? " Sent to the Review Queue — once approved, they'll appear here." : " Request a set and an admin can review it in the Review Queue tab."}
        </p>
      )}

      {mode === "adaptive" && eligibleTopics.length === 0 && (
        <p className="text-sm" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>No topic has 4+ approved questions yet — approve some in the Review Queue first.</p>
      )}

      {quiz && !submitted && <QuizRunner quiz={quiz} submitted={submitted} answers={answers} onAnswer={(i, oi) => setAnswers((a) => ({ ...a, [i]: oi }))} onSubmit={handleSubmit} allAnswered={allAnswered} />}

      {quiz && submitted && (
        <>
          <div className="mb-5 p-4 border" style={{ borderColor: scoreColor(Math.round((score / quiz.length) * 100)) }}>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Result</div>
            <div className="text-2xl font-semibold" style={{ color: scoreColor(Math.round((score / quiz.length) * 100)), fontFamily: "'IBM Plex Mono', monospace" }}>
              {score} / {quiz.length} correct
            </div>
          </div>
          {missedThisAttempt && missedThisAttempt.length > 0 ? (
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: RED, fontFamily: "'IBM Plex Mono', monospace" }}>
                <XCircle className="w-3.5 h-3.5" /> Missed {missedThisAttempt.length} question{missedThisAttempt.length === 1 ? "" : "s"} — added to your review queue
              </div>
              <button onClick={retryMissed} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none" style={{ background: RED, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                <RotateCcw className="w-4 h-4" /> Retry missed questions only
              </button>
            </div>
          ) : (
            <div className="text-sm mb-4" style={{ color: GREEN, fontFamily: "'IBM Plex Sans', sans-serif" }}>Perfect set — nothing to review.</div>
          )}
          <QuizRunner quiz={quiz} submitted={submitted} answers={answers} onAnswer={() => {}} onSubmit={() => {}} allAnswered={true} />
        </>
      )}
    </Sheet>
  );
}

async function uploadQuestionImage(file) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("question-images").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("question-images").getPublicUrl(path);
  return data.publicUrl;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// Lets an admin attach one or more original images (diagrams, charts, free-body
// diagrams) to a question. Uploads go straight to Supabase Storage; only the
// resulting public URLs are stored on the question row.
function ImageUploader({ images, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setErr(null);
    try {
      const urls = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) { setErr("Each image must be under 5MB — skipped one that was too large."); continue; }
        urls.push(await uploadQuestionImage(file));
      }
      if (urls.length) onChange([...(images || []), ...urls]);
    } catch (e2) {
      setErr("Upload failed. Check the question-images storage bucket is set up, then try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeImage(url) {
    onChange((images || []).filter((u) => u !== url));
  }

  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Image(s) — diagram, chart, free-body diagram</div>
      {images && images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url) => (
            <div key={url} className="relative">
              <img src={url} alt="" className="h-20 w-auto border" style={{ borderColor: STEEL, background: PAPER_2 }} />
              <button type="button" onClick={() => removeImage(url)} disabled={disabled}
                className="absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center text-[10px] leading-none"
                style={{ background: RED, color: PAPER_2, border: "none", cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}
      <label className="pt-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border cursor-pointer" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Inbox className="w-3.5 h-3.5" />}
        {uploading ? "Uploading…" : "Add image"}
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} disabled={disabled || uploading} className="hidden" />
      </label>
      <div className="text-[10px] mt-1" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Only upload original diagrams you made yourself — no images copied from textbooks, code references, or the web.
      </div>
      {err && <div className="text-xs mt-1" style={{ color: RED }}>{err}</div>}
    </div>
  );
}

function EditableQuestionCard({ q, variant = "pending", onApprove, onReject, onDelete, onSaveEdit, onGenerateDiagram }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genSvg, setGenSvg] = useState(null); // AI-drawn diagram awaiting accept/discard

  function startEdit() {
    setDraft({ question: q.question, options: [...q.options], correctIndex: q.correctIndex, explanation: q.explanation, imageUrls: q.imageUrls || [] });
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const ok = await onSaveEdit(q.id, draft);
    setSaving(false);
    if (ok) setEditing(false);
  }

  async function generateDiagram() {
    setGenLoading(true);
    setGenError(null);
    setGenSvg(null);
    try {
      const svg = await onGenerateDiagram(q.topic, draft.question);
      setGenSvg(svg);
    } catch (e) {
      setGenError("Couldn't generate a diagram. Try again.");
    } finally {
      setGenLoading(false);
    }
  }

  async function useGeneratedDiagram() {
    try {
      const blob = new Blob([genSvg], { type: "image/svg+xml" });
      const file = new File([blob], `diagram-${Date.now()}.svg`, { type: "image/svg+xml" });
      const url = await uploadQuestionImage(file);
      setDraft((d) => ({ ...d, imageUrls: [...(d.imageUrls || []), url] }));
      setGenSvg(null);
    } catch (e) {
      setGenError("Couldn't save that diagram. Try again.");
    }
  }

  if (editing) {
    return (
      <div className="pb-5" style={{ borderBottom: `1px solid ${STEEL}` }}>
        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{q.topic} · editing</div>
        <textarea value={draft.question} onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          className="w-full mb-3 px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} rows={2} />
        <ImageUploader images={draft.imageUrls} onChange={(imgs) => setDraft((d) => ({ ...d, imageUrls: imgs }))} disabled={saving} />
        {onGenerateDiagram && (
          <div className="mb-3">
            <button type="button" onClick={generateDiagram} disabled={genLoading} className="pt-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border disabled:opacity-60" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {genLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              {genLoading ? "Drawing…" : "Generate diagram (AI)"}
            </button>
            {genError && <div className="text-xs mt-1" style={{ color: RED }}>{genError}</div>}
            {genSvg && (
              <div className="mt-2 p-2 border" style={{ borderColor: AMBER, background: PAPER_2 }}>
                <img src={svgToDataUrl(genSvg)} alt="Generated diagram preview" className="max-h-48 border mb-2" style={{ borderColor: STEEL }} />
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={useGeneratedDiagram} className="px-3 py-1.5 text-xs font-semibold rounded-none" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>Use this image</button>
                  <button type="button" onClick={generateDiagram} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>Regenerate</button>
                  <button type="button" onClick={() => setGenSvg(null)} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: RED, color: RED, fontFamily: "'IBM Plex Sans', sans-serif" }}>Discard</button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="grid gap-2 mb-3">
          {draft.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input type="radio" checked={draft.correctIndex === oi} onChange={() => setDraft((d) => ({ ...d, correctIndex: oi }))} />
              <input value={opt} onChange={(e) => setDraft((d) => ({ ...d, options: d.options.map((o, i) => (i === oi ? e.target.value : o)) }))}
                className="flex-1 px-3 py-1.5 text-sm bg-transparent border rounded-none" style={{ borderColor: oi === draft.correctIndex ? GREEN : STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} />
            </div>
          ))}
        </div>
        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Explanation</div>
        <textarea value={draft.explanation} onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
          className="w-full mb-3 px-3 py-2 text-xs bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} rows={2} />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-none disabled:opacity-60" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-5" style={{ borderBottom: `1px solid ${STEEL}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{q.topic}</span>
      </div>
      {q.imageUrls && q.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {q.imageUrls.map((url) => (<img key={url} src={url} alt="" className="max-h-48 border" style={{ borderColor: STEEL, background: PAPER_2 }} />))}
        </div>
      )}
      <div className="text-sm mb-3" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>{q.question}</div>
      <div className="grid gap-1 mb-3">
        {q.options.map((opt, oi) => (
          <div key={oi} className="text-sm px-3 py-1.5 flex items-center gap-2 border" style={{ borderColor: oi === q.correctIndex ? GREEN : STEEL, color: LINE, opacity: oi === q.correctIndex ? 1 : 0.75, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {oi === q.correctIndex && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: GREEN }} />}{opt}
          </div>
        ))}
      </div>
      <div className="text-xs mb-3" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>{q.explanation}</div>
      {variant === "pending" && (
        <textarea placeholder="Reason for rejection (optional)" value={note} onChange={(e) => setNote(e.target.value)}
          className="w-full mb-3 px-3 py-2 text-xs bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} rows={2} />
      )}
      <div className="flex gap-2 flex-wrap">
        {variant === "pending" && (
          <>
            <button onClick={() => onApprove(q.id)} className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-none" style={{ background: GREEN, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
            <button onClick={() => onReject(q.id, note)} className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-none" style={{ background: RED, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}><XCircle className="w-3.5 h-3.5" /> Reject</button>
          </>
        )}
        <button onClick={startEdit} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>Edit</button>
        <button onClick={() => onDelete(q.id)} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: RED, color: RED, fontFamily: "'IBM Plex Sans', sans-serif" }}>Delete</button>
      </div>
    </div>
  );
}

function BankList({ title, items, color, onDelete, onSaveEdit, onGenerateDiagram }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="mt-6">
      <button onClick={() => setOpen(!open)} className="text-[11px] uppercase tracking-widest mb-2" style={{ color, fontFamily: "'IBM Plex Mono', monospace", background: "none", border: "none", cursor: "pointer" }}>
        {open ? "▾" : "▸"} {title} ({items.length})
      </button>
      {open && (
        <div className="space-y-2">
          {items.map((q) => (
            <EditableQuestionCard key={q.id} q={q} variant="bank" onDelete={onDelete} onSaveEdit={onSaveEdit} onGenerateDiagram={onGenerateDiagram} />
          ))}
        </div>
      )}
    </div>
  );
}

// Lets an admin upload a few original example diagrams per topic (SVG files
// work best — Claude can read exact drawing conventions from vector source;
// images work too, but only as loose visual style reference). These are shown
// to the AI as style/format examples when it draws a new diagram — never copied.
function DiagramSampleLibrary({ samples, onUpload, onDelete }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      await onUpload(topic, file);
    } catch (e2) {
      setErr("Upload failed — has the diagram_samples table been set up yet?");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${STEEL}` }}>
      <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>
        Diagram sample library ({samples.length})
      </div>
      <p className="text-xs mb-3" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Upload a few original example diagrams per topic. These are used only as style references (line style, label conventions) when the AI draws a new diagram for a question — never copied directly.
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select value={topic} onChange={(e) => setTopic(e.target.value)} className="px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {TOPICS.map((t) => (<option key={t} value={t} style={{ background: PAPER }}>{t}</option>))}
        </select>
        <label className="pt-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border cursor-pointer" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Inbox className="w-3.5 h-3.5" />}
          {uploading ? "Uploading…" : "Add sample"}
          <input ref={inputRef} type="file" accept="image/*,.svg" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </div>
      {err && <div className="text-xs mb-2" style={{ color: RED }}>{err}</div>}
      {samples.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {samples.map((s) => (
            <div key={s.id} className="relative">
              <img src={s.imageUrl} alt="" className="h-16 w-auto border" style={{ borderColor: STEEL, background: PAPER_2 }} />
              <div className="text-[9px] mt-0.5" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>{s.topic}</div>
              <button type="button" onClick={() => onDelete(s.id)}
                className="absolute -top-2 -right-2 rounded-full w-5 h-5 flex items-center justify-center text-[10px] leading-none"
                style={{ background: RED, color: PAPER_2, border: "none", cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Lets an admin write a brand-new question from scratch — the only way in
// before this was AI generation or the original seed data. Saves straight to
// "approved" status, since the admin writing it is the same person who'd
// otherwise approve it out of the pending queue.
function NewQuestionForm({ onSave, onCancel, onGenerateDiagram }) {
  const [draft, setDraft] = useState({ topic: TOPICS[0], question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", imageUrls: [] });
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genSvg, setGenSvg] = useState(null);
  const [err, setErr] = useState(null);

  function updateOption(i, val) {
    setDraft((d) => { const opts = [...d.options]; opts[i] = val; return { ...d, options: opts }; });
  }

  async function generateDiagram() {
    if (!draft.question.trim()) { setGenError("Write the question text first."); return; }
    setGenLoading(true); setGenError(null); setGenSvg(null);
    try {
      setGenSvg(await onGenerateDiagram(draft.topic, draft.question));
    } catch (e) {
      setGenError("Couldn't generate a diagram. Try again.");
    } finally {
      setGenLoading(false);
    }
  }

  async function useGeneratedDiagram() {
    try {
      const blob = new Blob([genSvg], { type: "image/svg+xml" });
      const file = new File([blob], `diagram-${Date.now()}.svg`, { type: "image/svg+xml" });
      const url = await uploadQuestionImage(file);
      setDraft((d) => ({ ...d, imageUrls: [...(d.imageUrls || []), url] }));
      setGenSvg(null);
    } catch (e) {
      setGenError("Couldn't save that diagram. Try again.");
    }
  }

  async function handleSave() {
    setErr(null);
    if (!draft.question.trim()) { setErr("Write the question text."); return; }
    if (draft.options.some((o) => !o.trim())) { setErr("Fill in all 4 answer options."); return; }
    if (!draft.explanation.trim()) { setErr("Add a short explanation."); return; }
    setSaving(true);
    const ok = await onSave(draft);
    setSaving(false);
    if (!ok) setErr("Couldn't save. Try again.");
  }

  return (
    <div className="mb-8 p-4 border" style={{ borderColor: AMBER, background: PAPER_2 }}>
      <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>New question</div>
      <select value={draft.topic} onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))}
        className="mb-3 px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        {TOPICS.map((t) => (<option key={t} value={t} style={{ background: PAPER }}>{t}</option>))}
      </select>
      <textarea placeholder="Question text" value={draft.question} onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
        className="w-full mb-3 px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} rows={2} />
      <ImageUploader images={draft.imageUrls} onChange={(imgs) => setDraft((d) => ({ ...d, imageUrls: imgs }))} disabled={saving} />
      {onGenerateDiagram && (
        <div className="mb-3">
          <button type="button" onClick={generateDiagram} disabled={genLoading} className="pt-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-none border disabled:opacity-60" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {genLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
            {genLoading ? "Drawing…" : "Generate diagram (AI)"}
          </button>
          {genError && <div className="text-xs mt-1" style={{ color: RED }}>{genError}</div>}
          {genSvg && (
            <div className="mt-2 p-2 border" style={{ borderColor: AMBER, background: PAPER }}>
              <img src={svgToDataUrl(genSvg)} alt="Generated diagram preview" className="max-h-48 border mb-2" style={{ borderColor: STEEL }} />
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={useGeneratedDiagram} className="px-3 py-1.5 text-xs font-semibold rounded-none" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>Use this image</button>
                <button type="button" onClick={generateDiagram} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>Regenerate</button>
                <button type="button" onClick={() => setGenSvg(null)} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: RED, color: RED, fontFamily: "'IBM Plex Sans', sans-serif" }}>Discard</button>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="grid gap-2 mb-3">
        {draft.options.map((opt, oi) => (
          <div key={oi} className="flex items-center gap-2">
            <input type="radio" checked={draft.correctIndex === oi} onChange={() => setDraft((d) => ({ ...d, correctIndex: oi }))} />
            <input value={opt} onChange={(e) => updateOption(oi, e.target.value)} placeholder={`Option ${oi + 1}`}
              className="flex-1 px-3 py-1.5 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} />
          </div>
        ))}
      </div>
      <textarea placeholder="Explanation" value={draft.explanation} onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
        className="w-full mb-3 px-3 py-2 text-xs bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} rows={2} />
      {err && <div className="text-xs mb-2" style={{ color: RED }}>{err}</div>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-semibold rounded-none disabled:opacity-60" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>{saving ? "Saving…" : "Save question"}</button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>Cancel</button>
      </div>
    </div>
  );
}

// Lets an admin request new AI-generated questions for any topic, any time —
// not just when a topic happens to be short on approved questions (that's the
// only place this used to be reachable, buried inside Practice → Specific
// review). Sends straight to the pending queue below, same as before.
function GenerateQuestionsControl({ bank, onRequestGeneration }) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(0);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const approvedForTopic = bank.approved.filter((q) => q.topic === topic);
      const rejectionNotes = bank.rejected.filter((q) => q.topic === topic && q.note).map((q) => q.note);
      const qs = await generateQuestions(topic, approvedForTopic, rejectionNotes);
      await onRequestGeneration(qs);
      setDone(qs.length);
    } catch (e) {
      setError("Couldn't reach the AI generator right now. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 p-4 border" style={{ borderColor: STEEL, background: PAPER }}>
      <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Generate AI questions</div>
      <div className="flex flex-wrap items-center gap-3">
        <select value={topic} onChange={(e) => { setTopic(e.target.value); setDone(0); setError(null); }} disabled={loading}
          className="px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {TOPICS.map((t) => (<option key={t} value={t} style={{ background: PAPER }}>{t}</option>))}
        </select>
        <button onClick={generate} disabled={loading} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none disabled:opacity-60" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Inbox className="w-4 h-4" />}
          {loading ? "Generating…" : "Generate 4 questions"}
        </button>
        {done > 0 && !loading && <span className="text-xs" style={{ color: GREEN, fontFamily: "'IBM Plex Sans', sans-serif" }}>Added {done} to Pending below.</span>}
      </div>
      {error && <div className="flex items-center gap-2 text-xs mt-2" style={{ color: RED }}><AlertTriangle className="w-3.5 h-3.5" /> {error}</div>}
    </div>
  );
}

function ReviewQueueView({ bank, isAdmin, onApprove, onReject, onDelete, onSaveEdit, onExport, onAddQuestion, onRequestGeneration, diagramSamples, onAddDiagramSample, onDeleteDiagramSample, onGenerateDiagram }) {
  const [showNewForm, setShowNewForm] = useState(false);
  return (
    <Sheet sheetNo="2 of 4" title="Review Queue — Admin Approval">
      {!isAdmin && (
        <p className="text-xs mb-4" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          You can see what's pending, but only an admin account can approve or reject questions.
        </p>
      )}
      {isAdmin && <GenerateQuestionsControl bank={bank} onRequestGeneration={onRequestGeneration} />}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-8">
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Pending</div><div className="text-2xl font-semibold" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{bank.pending.length}</div></div>
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Approved bank</div><div className="text-2xl font-semibold" style={{ color: GREEN, fontFamily: "'IBM Plex Mono', monospace" }}>{bank.approved.length}</div></div>
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Rejected</div><div className="text-2xl font-semibold" style={{ color: RED, fontFamily: "'IBM Plex Mono', monospace" }}>{bank.rejected.length}</div></div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            {!showNewForm && (
              <button onClick={() => setShowNewForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-none" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                + Add new question
              </button>
            )}
            <button onClick={onExport} className="px-3 py-1.5 text-xs font-semibold rounded-none border" style={{ borderColor: INK, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Export full bank (.json)
            </button>
          </div>
        )}
      </div>
      {isAdmin && showNewForm && (
        <NewQuestionForm
          onGenerateDiagram={onGenerateDiagram}
          onCancel={() => setShowNewForm(false)}
          onSave={async (draft) => {
            const ok = await onAddQuestion(draft);
            if (ok) setShowNewForm(false);
            return ok;
          }}
        />
      )}
      {bank.pending.length === 0 && <p className="text-sm" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Nothing waiting for review.</p>}
      <div className="space-y-6">
        {bank.pending.map((q) =>
          isAdmin ? (
            <EditableQuestionCard key={q.id} q={q} onApprove={onApprove} onReject={onReject} onDelete={onDelete} onSaveEdit={onSaveEdit} onGenerateDiagram={onGenerateDiagram} />
          ) : (
            <div key={q.id} className="pb-5" style={{ borderBottom: `1px solid ${STEEL}` }}>
              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{q.topic}</div>
              <div className="text-sm mb-3" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>{q.question}</div>
            </div>
          )
        )}
      </div>
      {isAdmin && (
        <>
          <BankList title="Manage approved questions" items={bank.approved} color={GREEN} onDelete={onDelete} onSaveEdit={onSaveEdit} onGenerateDiagram={onGenerateDiagram} />
          <BankList title="Manage rejected questions" items={bank.rejected} color={RED} onDelete={onDelete} onSaveEdit={onSaveEdit} onGenerateDiagram={onGenerateDiagram} />
          <DiagramSampleLibrary samples={diagramSamples} onUpload={onAddDiagramSample} onDelete={onDeleteDiagramSample} />
        </>
      )}
    </Sheet>
  );
}

function DashboardView({ team, bank, missed }) {
  const topicAverages = useMemo(() => TOPICS.map((t) => {
    const vals = team.map((e) => topicPct(e.topics[t])).filter((v) => v !== undefined);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const approvedCount = bank.approved.filter((q) => q.topic === t).length;
    return { topic: t.split(" (")[0], value: avg, approvedCount };
  }), [team, bank]);

  const weakest = [...topicAverages].sort((a, b) => a.value - b.value)[0];
  const teamAvgReadiness = Math.round(team.reduce((a, e) => a + e.readiness, 0) / team.length);

  return (
    <div className="space-y-6">
      <div className="text-xs px-3 py-2 border" style={{ borderColor: AMBER, color: AMBER, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Sample data for demo purposes — the team roster below (R. Alvarez, M. Okafor, etc.) is illustrative, not real employees. Your own real practice results still show up here alongside it.
      </div>
      <Sheet sheetNo="3 of 4" title="Manager Dashboard — Team Readiness">
        <div className="flex flex-wrap gap-8 mb-6">
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Team avg. readiness</div><div className="text-3xl font-semibold" style={{ color: scoreColor(teamAvgReadiness), fontFamily: "'IBM Plex Mono', monospace" }}>{teamAvgReadiness}%</div></div>
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Licensed seats</div><div className="text-3xl font-semibold" style={{ color: LINE, fontFamily: "'IBM Plex Mono', monospace" }}>{team.length}</div></div>
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Weakest topic, org-wide</div><div className="text-lg font-semibold" style={{ color: RED, fontFamily: "'IBM Plex Sans', sans-serif" }}>{weakest.topic}</div></div>
          <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Your review queue</div><div className="text-3xl font-semibold" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{missed.length}</div></div>
        </div>
        <div className="mb-2 text-[11px] uppercase tracking-widest flex items-center gap-2" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}><ClipboardList className="w-3.5 h-3.5" /> Topic performance, team average</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicAverages} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
              <CartesianGrid stroke={STEEL} strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="topic" tick={{ fill: STEEL, fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis domain={[0, 100]} tick={{ fill: STEEL, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: PAPER_2, border: `1px solid ${STEEL}`, fontFamily: "IBM Plex Sans" }} labelStyle={{ color: INK }} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>{topicAverages.map((d, i) => (<Cell key={i} fill={scoreColor(d.value)} />))}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[11px]" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>
          {topicAverages.map((d) => (<span key={d.topic}>{d.topic}: {d.approvedCount} approved</span>))}
        </div>
      </Sheet>
      <Sheet sheetNo="3A" title="Individual Readiness">
        <div className="mb-4 text-[11px] uppercase tracking-widest flex items-center gap-2" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}><Users className="w-3.5 h-3.5" /> {team.length} engineers licensed on this account</div>
        <div className="space-y-3">
          {[...team].sort((a, b) => b.readiness - a.readiness).map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-sm" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>{e.name}</div>
              <div className="flex-1"><DimensionBar label={e.role} value={e.readiness} /></div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("signin"); // 'signin' or 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setConfirmMsg(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onAuthed();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setConfirmMsg("Check your email to confirm your account, then sign in.");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: CANVAS, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
      <div className="relative border w-full max-w-sm p-6" style={{ borderColor: INK, background: PAPER_2 }}>
        <div className="mb-6">
          <h1 className="text-2xl" style={{ color: INK, fontFamily: "'Space Grotesk', sans-serif" }}>PRESSURE TESTING</h1>
          <div className="text-[10px] tracking-[0.15em] uppercase mt-0.5" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>
            {mode === "signin" ? "Sign in" : "Create an account"}
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }} />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-9 text-sm bg-transparent border rounded-none" style={{ borderColor: STEEL, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }} />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 h-full px-2.5 flex items-center"
              style={{ background: "none", border: "none", cursor: "pointer", color: STEEL }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <div className="text-xs" style={{ color: RED }}>{error}</div>}
          {confirmMsg && <div className="text-xs" style={{ color: GREEN }}>{confirmMsg}</div>}
          <button type="submit" disabled={loading} className="w-full py-2 text-sm font-semibold rounded-none disabled:opacity-60"
            style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setConfirmMsg(null); }}
          className="mt-4 text-xs underline" style={{ color: STEEL, background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out, object = signed in
  const [profile, setProfile] = useState(null);
  const [view, setView] = useState("practice");
  const [homeKey, setHomeKey] = useState(0);

  // Jumps back to the Practice landing page from anywhere in the app — including
  // mid-quiz or mid-timed-exam, where there was previously no way out except the
  // browser back button. Bumping homeKey remounts PracticeView, which resets its
  // internal mode/quiz state back to the chooser screen.
  function goHome() {
    setView("practice");
    setHomeKey((k) => k + 1);
  }
  const [team, setTeam] = useState(SEED_TEAM);
  const [bank, setBank] = useState({ approved: [], pending: [], rejected: [] });
  const [missed, setMissed] = useState([]);
  const [questionStats, setQuestionStats] = useState({});
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [diagramSamples, setDiagramSamples] = useState([]);

  // Check for an existing session on load, and keep listening for sign-in/out.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Once signed in, load this user's role (admin or member).
  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    supabase.from("profiles").select("role, email").eq("id", session.user.id).maybeSingle().then(({ data, error }) => {
      if (error) console.error("Profile lookup failed:", error.message);
      setProfile(data || { role: "member" });
    });
  }, [session]);

  // If someone's role doesn't permit the tab they're currently on (e.g. it changed,
  // or they landed on a hidden tab some other way), bounce back to Practice.
  useEffect(() => {
    if (!profile) return;
    if (view === "review" && profile.role !== "admin") setView("practice");
    if (view === "dashboard" && profile.role !== "admin" && profile.role !== "manager") setView("practice");
  }, [profile, view]);

  // Load the real, permanent question bank from Supabase — but only once signed in,
  // since the table now requires authentication to read.
  useEffect(() => {
    if (!session) return;
    async function loadBank() {
      setBankLoading(true);
      setBankError(null);
      const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: true });
      if (error) {
        setBankError("Couldn't load the question bank. Check your Supabase connection.");
        setBankLoading(false);
        return;
      }
      const shaped = data.map((r) => ({
        id: r.id,
        topic: r.topic,
        question: r.question,
        options: r.options,
        correctIndex: r.correct_index,
        explanation: r.explanation,
        note: r.reject_note || undefined,
        imageUrls: r.image_urls || [],
      }));
      setBank({
        approved: shaped.filter((_, i) => data[i].status === "approved"),
        pending: shaped.filter((_, i) => data[i].status === "pending"),
        rejected: shaped.filter((_, i) => data[i].status === "rejected"),
      });
      // Seed local difficulty stats from the server's real attempt counts on load.
      setQuestionStats((prev) => {
        const next = { ...prev };
        data.forEach((r) => {
          if (r.attempts > 0 && !next[r.id]) {
            next[r.id] = { attempts: r.attempts, correct: r.correct_count };
          }
        });
        return next;
      });
      setBankLoading(false);
    }
    loadBank();
  }, [session]);

  // Load the diagram sample library (style-reference images admins upload per
  // topic) — silently does nothing if the table doesn't exist yet, so this
  // doesn't break the app for anyone who hasn't run the migration.
  useEffect(() => {
    if (!session) return;
    supabase.from("diagram_samples").select("*").order("created_at", { ascending: true }).then(({ data, error }) => {
      if (!error && data) {
        setDiagramSamples(data.map((r) => ({ id: r.id, topic: r.topic, imageUrl: r.image_url, svgText: r.svg_text || null })));
      }
    });
  }, [session]);

  async function addDiagramSample(topic, file) {
    let svgText = null;
    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      svgText = await file.text();
    }
    const url = await uploadQuestionImage(file);
    const { data, error } = await supabase.from("diagram_samples").insert({ topic, image_url: url, svg_text: svgText }).select().single();
    if (error) throw error;
    setDiagramSamples((prev) => [...prev, { id: data.id, topic: data.topic, imageUrl: data.image_url, svgText: data.svg_text }]);
  }

  async function deleteDiagramSample(id) {
    const { error } = await supabase.from("diagram_samples").delete().eq("id", id);
    if (!error) setDiagramSamples((prev) => prev.filter((s) => s.id !== id));
  }

  // Asks the backend to draw an original SVG diagram for a specific question,
  // using up to 3 of that topic's sample diagrams as style references (SVG
  // samples are sent as literal markup; raster samples as images for loose
  // visual reference). Returns raw SVG markup, or throws on failure.
  async function generateDiagramForQuestion(topic, questionText) {
    const samplesForTopic = diagramSamples.filter((s) => s.topic === topic).slice(0, 3);
    const samplesPayload = [];
    for (const s of samplesForTopic) {
      if (s.svgText) {
        samplesPayload.push({ label: s.topic, svgText: s.svgText });
      } else {
        try {
          const resp = await fetch(s.imageUrl);
          const blob = await resp.blob();
          const base64 = await blobToBase64(blob);
          samplesPayload.push({ label: s.topic, base64, mediaType: blob.type || "image/png" });
        } catch (e) { /* skip this sample if it can't be fetched */ }
      }
    }
    const response = await fetch("/api/generate-diagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, questionText, samples: samplesPayload }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error || "Diagram generation failed");
    return data.svg;
  }

  // Once both the bank and the session are ready, load THIS account's saved
  // progress from Supabase — not the browser. This is what makes progress
  // follow the person's login instead of the device they happen to be on.
  useEffect(() => {
    if (!session || bankLoading) return;
    async function loadProgress() {
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", session.user.id).maybeSingle();
      if (error || !data) {
        setProgressLoaded(true);
        return;
      }
      setTeam((prev) => {
        const others = prev.filter((e) => e.id !== "you");
        const youObj = { id: "you", name: "You", role: "EIT, Structural", readiness: data.readiness || 0, topics: data.topic_scores || {} };
        return [...others, youObj];
      });
      const allQuestions = [...bank.approved, ...bank.pending, ...bank.rejected];
      const missedQs = (data.missed_ids || []).map((id) => allQuestions.find((q) => q.id === id)).filter(Boolean);
      setMissed(missedQs);
      setProgressLoaded(true);
    }
    loadProgress();
  }, [session, bankLoading]);

  async function saveProgressToServer(youObj, missedList) {
    if (!session) return;
    await supabase.from("user_progress").upsert({
      user_id: session.user.id,
      topic_scores: youObj.topics,
      readiness: youObj.readiness,
      missed_ids: missedList.map((q) => q.id),
      updated_at: new Date().toISOString(),
    });
  }

  async function resetDemo() {
    if (session) {
      await supabase.from("user_progress").delete().eq("user_id", session.user.id);
    }
    setTeam(SEED_TEAM);
    setMissed([]);
    setQuestionStats({});
  }

  const you = team.find((e) => e.id === "you") || { topics: {} };

  function recordResult(topicLabel, correct, total, results) {
    let updatedYou;
    setTeam((prev) => {
      const meIdx = prev.findIndex((e) => e.id === "you");
      const base = meIdx === -1
        ? { id: "you", name: "You", role: "EIT, Structural", readiness: 0, topics: {} }
        : { ...prev[meIdx] };
      const topics = { ...base.topics };
      if (results && results.length) {
        // Attribute every question to ITS OWN topic, regardless of which mode the
        // quiz was — so a timed mock exam (which spans every topic) also feeds
        // topic-level weakness tracking, not just Quick/Adaptive sets.
        results.forEach(({ q, correct: wasCorrect }) => {
          const t = q.topic;
          if (!t) return;
          const cur = topics[t] && typeof topics[t] === "object" ? topics[t] : { attempts: 0, correct: 0 };
          topics[t] = { attempts: cur.attempts + 1, correct: cur.correct + (wasCorrect ? 1 : 0) };
        });
      } else {
        const cur = topics[topicLabel] && typeof topics[topicLabel] === "object" ? topics[topicLabel] : { attempts: 0, correct: 0 };
        topics[topicLabel] = { attempts: cur.attempts + total, correct: cur.correct + correct };
      }
      const totals = Object.values(topics).reduce((acc, v) => {
        if (v && typeof v === "object") { acc.attempts += v.attempts; acc.correct += v.correct; }
        return acc;
      }, { attempts: 0, correct: 0 });
      const readiness = totals.attempts > 0 ? Math.round((totals.correct / totals.attempts) * 100) : 0;
      const youObj = { ...base, topics, readiness };
      updatedYou = youObj;
      if (meIdx === -1) return [...prev, youObj];
      const updated = [...prev];
      updated[meIdx] = youObj;
      return updated;
    });

    if (results) {
      setQuestionStats((prev) => {
        const next = { ...prev };
        results.forEach(({ q, correct: wasCorrect }) => {
          const s = next[q.id] || { attempts: 0, correct: 0 };
          next[q.id] = { attempts: s.attempts + 1, correct: s.correct + (wasCorrect ? 1 : 0) };
        });
        return next;
      });
      let updatedMissed;
      setMissed((prev) => {
        let next = [...prev];
        results.forEach(({ q, correct: wasCorrect }) => {
          const exists = next.some((x) => x.id === q.id);
          if (!wasCorrect && !exists) next.push(q);
          if (wasCorrect && exists) next = next.filter((x) => x.id !== q.id);
        });
        updatedMissed = next;
        return next;
      });
      // Save this account's progress to the database, not the browser, so it
      // follows the person's login rather than the device they're using.
      if (updatedYou) {
        Promise.resolve().then(() => saveProgressToServer(updatedYou, updatedMissed || missed));
      }
      // Push the real answer counts to Supabase so difficulty scoring accumulates
      // across everyone who uses the app, not just this browser.
      results.forEach(({ q, correct: wasCorrect }) => {
        supabase.rpc("increment_question_stat", { q_id: q.id, was_correct: wasCorrect }).then(({ error }) => {
          if (error) console.error("Stat update failed:", error.message);
        });
      });
    }
  }

  async function addPending(questions) {
    const rows = questions.map((q) => ({
      topic: q.topic,
      question: q.question,
      options: q.options,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      status: "pending",
    }));
    const { data, error } = await supabase.from("questions").insert(rows).select();
    if (error) {
      setBankError("Couldn't save new questions to the bank. Try again.");
      return;
    }
    const shaped = data.map((r) => ({
      id: r.id, topic: r.topic, question: r.question, options: r.options,
      correctIndex: r.correct_index, explanation: r.explanation, imageUrls: r.image_urls || [],
    }));
    setBank((b) => ({ ...b, pending: [...b.pending, ...shaped] }));
  }

  async function approve(id) {
    const { error } = await supabase.from("questions").update({ status: "approved" }).eq("id", id);
    if (error) {
      setBankError("Couldn't save that approval. Try again.");
      return;
    }
    setBank((b) => {
      const q = b.pending.find((x) => x.id === id);
      if (!q) return b;
      return { ...b, pending: b.pending.filter((x) => x.id !== id), approved: [...b.approved, q] };
    });
  }

  async function reject(id, note) {
    const { error } = await supabase.from("questions").update({ status: "rejected", reject_note: note || null }).eq("id", id);
    if (error) {
      setBankError("Couldn't save that rejection. Try again.");
      return;
    }
    setBank((b) => {
      const q = b.pending.find((x) => x.id === id);
      if (!q) return b;
      return { ...b, pending: b.pending.filter((x) => x.id !== id), rejected: [...b.rejected, { ...q, note }] };
    });
  }

  async function deleteQuestion(id) {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      setBankError("Couldn't delete that question. Try again.");
      return;
    }
    setBank((b) => ({
      approved: b.approved.filter((x) => x.id !== id),
      pending: b.pending.filter((x) => x.id !== id),
      rejected: b.rejected.filter((x) => x.id !== id),
    }));
  }

  async function saveEdit(id, edits) {
    const { error } = await supabase
      .from("questions")
      .update({ question: edits.question, options: edits.options, correct_index: edits.correctIndex, explanation: edits.explanation, image_urls: edits.imageUrls || [] })
      .eq("id", id);
    if (error) {
      setBankError("Couldn't save your edits. Try again.");
      return false;
    }
    setBank((b) => ({
      approved: b.approved.map((q) => (q.id === id ? { ...q, ...edits } : q)),
      pending: b.pending.map((q) => (q.id === id ? { ...q, ...edits } : q)),
      rejected: b.rejected.map((q) => (q.id === id ? { ...q, ...edits } : q)),
    }));
    return true;
  }

  // Lets an admin write a brand-new question by hand — previously the only way
  // questions entered the bank was AI generation or the original seed data.
  // Saves straight to "approved" since the admin writing it is the same person
  // who'd otherwise approve it out of the pending queue.
  async function addQuestion(newQ) {
    const { data, error } = await supabase
      .from("questions")
      .insert({
        topic: newQ.topic,
        question: newQ.question,
        options: newQ.options,
        correct_index: newQ.correctIndex,
        explanation: newQ.explanation,
        image_urls: newQ.imageUrls || [],
        status: "approved",
      })
      .select()
      .single();
    if (error) {
      setBankError("Couldn't save the new question. Try again.");
      return false;
    }
    setBank((b) => ({
      ...b,
      approved: [...b.approved, {
        id: data.id, topic: data.topic, question: data.question, options: data.options,
        correctIndex: data.correct_index, explanation: data.explanation, imageUrls: data.image_urls || [],
      }],
    }));
    return true;
  }

  async function exportBank() {
    const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: true });
    if (error) {
      setBankError("Couldn't export the bank. Try again.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pressure-testing-question-bank-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (session === undefined) {
    return (
      <div style={{ background: CANVAS, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: PAPER_2 }} />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthed={() => {}} />;
  }

  return (
    <div style={{
      background: `repeating-linear-gradient(0deg, transparent, transparent 23px, ${CANVAS_GRID} 23px, ${CANVAS_GRID} 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, ${CANVAS_GRID} 23px, ${CANVAS_GRID} 24px), ${CANVAS}`,
      backgroundPosition: "20px 28px",
      minHeight: "100%", padding: "28px 20px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        select option { background: ${PAPER}; }
        .pt-btn { border-color: ${INK}; color: ${INK}; background: ${PAPER_2}; transition: border-color .15s ease, color .15s ease, background-color .15s ease; }
        .pt-btn:hover { border-color: ${AMBER}; color: ${AMBER}; background-color: #FBF3E8; }
        .pt-btn:active { background-color: #F3E3CB; }
        .pt-btn.selected { border-color: ${AMBER}; color: ${AMBER}; }
        .pt-btn:disabled { pointer-events: none; }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end justify-between mb-1 flex-wrap gap-3">
          <div className="border px-4 py-2" style={{ borderColor: INK, background: PAPER_2 }}>
            <h1 className="text-3xl" style={{ color: LINE, fontFamily: "'Space Grotesk', sans-serif" }}>PRESSURE TESTING</h1>
            <div className="text-[10px] tracking-[0.15em] uppercase mt-0.5" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>PE Civil · Structural</div>
          </div>
          <div className="flex gap-1 flex-wrap items-center">
            {[
              ["practice", "Practice"],
              ...(profile?.role === "admin" ? [["review", "Review Queue"]] : []),
              ...(profile?.role === "admin" || profile?.role === "manager" ? [["dashboard", "Manager view"]] : []),
            ].map(([key, label]) => (
              <button key={key} onClick={() => setView(key)} className={`pt-btn relative px-3 py-1.5 text-xs uppercase tracking-wide rounded-none border flex items-center gap-1.5 ${view === key ? "selected" : ""}`}
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {view === key && <CornerTicks variant="two" />}
                {key === "review" && bank.pending.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full text-[9px] w-4 h-4" style={{ background: AMBER, color: INK }}>{bank.pending.length}</span>
                )}
                {label}
              </button>
            ))}
            <div className="text-[10px] ml-2 text-right leading-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <div style={{ color: STEEL }}>{session.user.email}</div>
              {profile?.role && profile.role !== "member" && (
                <div style={{ color: profile.role === "admin" ? RED : STEEL }}>{profile.role}</div>
              )}
            </div>
            <button onClick={() => supabase.auth.signOut()} className="pt-btn px-3 py-1.5 text-xs uppercase tracking-wide rounded-none border"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Sign out
            </button>
          </div>
        </div>
        <button onClick={goHome} className="flex items-center gap-1.5 text-xs uppercase tracking-wide mb-4 mt-3" style={{ color: STEEL, background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <p className="text-xs mb-8 flex items-center gap-3 flex-wrap" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Demo version.
          <button onClick={resetDemo} className="underline" style={{ color: STEEL, background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Reset Progress
          </button>
        </p>
        {bankError && (
          <div className="mb-4 text-sm flex items-center gap-2" style={{ color: RED }}>
            <AlertTriangle className="w-4 h-4" /> {bankError}
          </div>
        )}
        {bankLoading ? (
          <div className="text-sm flex items-center gap-2" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading question bank…
          </div>
        ) : (
          <>
            {view === "practice" && <PracticeView key={homeKey} bank={bank} missed={missed} you={you} questionStats={questionStats} isAdmin={profile?.role === "admin"} onRequestGeneration={addPending} onCompleteQuiz={recordResult} />}
            {view === "review" && profile?.role === "admin" && <ReviewQueueView bank={bank} isAdmin={true} onApprove={approve} onReject={reject} onDelete={deleteQuestion} onSaveEdit={saveEdit} onExport={exportBank} onAddQuestion={addQuestion} onRequestGeneration={addPending} diagramSamples={diagramSamples} onAddDiagramSample={addDiagramSample} onDeleteDiagramSample={deleteDiagramSample} onGenerateDiagram={generateDiagramForQuestion} />}
            {view === "dashboard" && (profile?.role === "admin" || profile?.role === "manager") && <DashboardView team={team} bank={bank} missed={missed} />}
          </>
        )}
      </div>
    </div>
  );
}
