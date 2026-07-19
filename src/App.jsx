import { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Users, ClipboardList, Inbox, Timer, RotateCcw, Target } from "lucide-react";

const TOPICS = [
  "Structural Analysis (Loads & Load Effects)",
  "Reinforced Concrete Design",
  "Steel Design",
  "Foundations & Geotechnical",
  "Lateral Systems (Wind & Seismic)",
];

// Warm "drafting vellum" palette — cream/tan paper tones instead of dark blueprint
const PAPER = "#EDE3C8";    // page background
const PAPER_2 = "#F8F1DE";  // sheet/panel background, lighter cream
const INK = "#332B1D";      // primary text — dark ink brown
const LINE = INK;           // kept as an alias so no text ends up unreadable
const STEEL = "#93805C";    // secondary text, borders — warm taupe
const AMBER = "#D98E3B";    // accent — warm amber/rust
const RED = "#B5482F";      // incorrect / weak — terracotta
const GREEN = "#5C7A52";    // correct / strong — sage green

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

// Saves each visitor's progress in their own browser so it survives a page reload —
// no account or database needed for this demo stage. Progress is local to that
// browser/device only; it won't follow someone to a different computer.
const STORAGE_KEY = "pressure-testing-demo-state-v1";

function loadSavedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage unavailable (e.g. private browsing) — fail silently, demo still works this session
  }
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

function Sheet({ sheetNo, title, children }) {
  return (
    <div className="relative border rounded-none p-6" style={{ borderColor: STEEL, borderWidth: 1, background: PAPER_2 }}>
      {["top-2 left-2 border-l border-t", "top-2 right-2 border-r border-t", "bottom-2 left-2 border-l border-b", "bottom-2 right-2 border-r border-b"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3`} style={{ borderColor: STEEL, opacity: 0.6 }} />
      ))}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Sheet {sheetNo}</div>
        <h2 className="text-xl mt-1" style={{ color: LINE, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
      </div>
      {children}
      <div className="mt-6 pt-3 flex justify-between text-[10px] uppercase tracking-[0.15em]" style={{ borderTop: `1px solid ${STEEL}`, color: STEEL, fontFamily: "'IBM Plex Mono', monospace", opacity: 0.7 }}>
        <span>Scale: NTS</span><span>Pressure Testing — Prototype</span><span>Rev D</span>
      </div>
    </div>
  );
}

async function generateQuestions(topic) {
  // Calls our own safe backend endpoint (api/generate-questions.js) instead of
  // Anthropic directly — the real API key lives only on the server, never here.
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
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
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = picked === oi;
                  const showCorrect = submitted && oi === q.correctIndex;
                  const showWrongPick = submitted && isSelected && oi !== q.correctIndex;
                  return (
                    <button key={oi} disabled={submitted} onClick={() => onAnswer(i, oi)}
                      className="text-left px-3 py-2 text-sm flex items-center gap-2 rounded-none border transition"
                      style={{ borderColor: showCorrect ? GREEN : showWrongPick ? RED : isSelected ? AMBER : STEEL, background: isSelected && !submitted ? "rgba(217,142,59,0.15)" : "transparent", color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                      {showCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: GREEN }} />}
                      {showWrongPick && <XCircle className="w-4 h-4 shrink-0" style={{ color: RED }} />}
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

function PracticeView({ bank, missed, you, questionStats, onRequestGeneration, onCompleteQuiz }) {
  const [mode, setMode] = useState("adaptive");
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

  const eligibleTopics = TOPICS.filter((t) => bank.approved.filter((q) => q.topic === t).length >= 4);

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
    if (eligibleTopics.length === 0) return;
    // Weakest topic wins; unattempted topics default to 50 so they surface for coverage
    const ranked = [...eligibleTopics].sort((a, b) => (you.topics[a] ?? 50) - (you.topics[b] ?? 50));
    const target = ranked[0];
    setAdaptiveTopic(target);
    const acc = you.topics[target] ?? 50;
    const pool = bank.approved.filter((q) => q.topic === target);
    const missedForTopic = missed.filter((q) => q.topic === target).slice(0, 2);
    const set = pickAdaptiveSet(pool, acc, 4, missedForTopic, questionStats);
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

  async function requestMore() {
    setLoading(true);
    setError(null);
    try {
      const qs = await generateQuestions(topic);
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
    const label = mode === "timed" ? "Timed mock exam" : mode === "adaptive" ? adaptiveTopic : topic;
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

  return (
    <Sheet sheetNo="1 of 4" title="Practice">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {[["adaptive", "Adaptive"], ["quick", "Quick set"], ["timed", "Timed mock exam"]].map(([key, label]) => (
          <button key={key} onClick={() => { setMode(key); setQuiz(null); setRequested(false); }}
            className="px-3 py-1.5 text-xs uppercase tracking-wide rounded-none border"
            style={{ borderColor: mode === key ? AMBER : STEEL, color: mode === key ? AMBER : STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>
            {label}
          </button>
        ))}
        {missed.length > 0 && (
          <span className="text-[11px] ml-2" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>
            {missed.length} question{missed.length === 1 ? "" : "s"} in your review queue
          </span>
        )}
      </div>

      {mode === "adaptive" && (
        <div className="mb-6">
          <button onClick={startAdaptive} disabled={eligibleTopics.length === 0} className="px-4 py-2 text-sm font-semibold flex items-center gap-2 rounded-none disabled:opacity-40" style={{ background: AMBER, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <Target className="w-4 h-4" />{quiz ? "New adaptive set" : "Start adaptive practice"}
          </button>
          <p className="text-xs mt-2" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Automatically targets your weakest topic{adaptiveTopic ? ` — currently: ${adaptiveTopic}` : ""} and matches question difficulty to your current accuracy there. Questions you've missed before are mixed back in first.
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

function ReviewQueueView({ bank, onApprove, onReject }) {
  const [notes, setNotes] = useState({});
  return (
    <Sheet sheetNo="2 of 4" title="Review Queue — Admin Approval">
      <div className="flex flex-wrap gap-8 mb-6">
        <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Pending</div><div className="text-2xl font-semibold" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{bank.pending.length}</div></div>
        <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Approved bank</div><div className="text-2xl font-semibold" style={{ color: GREEN, fontFamily: "'IBM Plex Mono', monospace" }}>{bank.approved.length}</div></div>
        <div><div className="text-[10px] uppercase tracking-widest" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Rejected</div><div className="text-2xl font-semibold" style={{ color: RED, fontFamily: "'IBM Plex Mono', monospace" }}>{bank.rejected.length}</div></div>
      </div>
      {bank.pending.length === 0 && <p className="text-sm" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Nothing waiting for review.</p>}
      <div className="space-y-6">
        {bank.pending.map((q) => (
          <div key={q.id} className="pb-5" style={{ borderBottom: `1px solid ${STEEL}` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>{q.topic}</span>
            </div>
            <div className="text-sm mb-3" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>{q.question}</div>
            <div className="grid gap-1 mb-3">
              {q.options.map((opt, oi) => (
                <div key={oi} className="text-sm px-3 py-1.5 flex items-center gap-2 border" style={{ borderColor: oi === q.correctIndex ? GREEN : STEEL, color: LINE, opacity: oi === q.correctIndex ? 1 : 0.75, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {oi === q.correctIndex && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: GREEN }} />}{opt}
                </div>
              ))}
            </div>
            <div className="text-xs mb-3" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>{q.explanation}</div>
            <textarea placeholder="Reason for rejection (optional)" value={notes[q.id] || ""} onChange={(e) => setNotes((n) => ({ ...n, [q.id]: e.target.value }))}
              className="w-full mb-3 px-3 py-2 text-xs bg-transparent border rounded-none" style={{ borderColor: STEEL, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }} rows={2} />
            <div className="flex gap-2">
              <button onClick={() => onApprove(q.id)} className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-none" style={{ background: GREEN, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
              <button onClick={() => onReject(q.id, notes[q.id] || "")} className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 rounded-none" style={{ background: RED, color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}><XCircle className="w-3.5 h-3.5" /> Reject</button>
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function DashboardView({ team, bank, missed }) {
  const topicAverages = useMemo(() => TOPICS.map((t) => {
    const vals = team.map((e) => e.topics[t]).filter((v) => v !== undefined);
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const approvedCount = bank.approved.filter((q) => q.topic === t).length;
    return { topic: t.split(" (")[0], value: avg, approvedCount };
  }), [team, bank]);

  const weakest = [...topicAverages].sort((a, b) => a.value - b.value)[0];
  const teamAvgReadiness = Math.round(team.reduce((a, e) => a + e.readiness, 0) / team.length);

  return (
    <div className="space-y-6">
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

export default function App() {
  const saved = useMemo(() => loadSavedState(), []);
  const [view, setView] = useState("practice");
  const [team, setTeam] = useState(saved?.team || SEED_TEAM);
  const [bank, setBank] = useState(saved?.bank || SEED_BANK);
  const [missed, setMissed] = useState(saved?.missed || []);
  const [questionStats, setQuestionStats] = useState(saved?.questionStats || {});

  useEffect(() => {
    saveState({ team, bank, missed, questionStats });
  }, [team, bank, missed, questionStats]);

  function resetDemo() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setTeam(SEED_TEAM);
    setBank(SEED_BANK);
    setMissed([]);
    setQuestionStats({});
  }

  const you = team.find((e) => e.id === "you") || { topics: {} };

  function recordResult(topicLabel, correct, total, results) {
    const pct = Math.round((correct / total) * 100);
    setTeam((prev) => {
      const meIdx = prev.findIndex((e) => e.id === "you");
      if (meIdx === -1) {
        const youObj = { id: "you", name: "You", role: "EIT, Structural", readiness: pct, topics: { [topicLabel]: pct } };
        return [...prev, youObj];
      }
      const updated = [...prev];
      const youObj = { ...updated[meIdx] };
      youObj.topics = { ...youObj.topics, [topicLabel]: pct };
      const vals = Object.values(youObj.topics);
      youObj.readiness = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
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
      setMissed((prev) => {
        let next = [...prev];
        results.forEach(({ q, correct: wasCorrect }) => {
          const exists = next.some((x) => x.id === q.id);
          if (!wasCorrect && !exists) next.push(q);
          if (wasCorrect && exists) next = next.filter((x) => x.id !== q.id);
        });
        return next;
      });
    }
  }

  function addPending(questions) {
    setBank((b) => ({ ...b, pending: [...b.pending, ...questions] }));
  }
  function approve(id) {
    setBank((b) => {
      const q = b.pending.find((x) => x.id === id);
      if (!q) return b;
      return { ...b, pending: b.pending.filter((x) => x.id !== id), approved: [...b.approved, q] };
    });
  }
  function reject(id, note) {
    setBank((b) => {
      const q = b.pending.find((x) => x.id === id);
      if (!q) return b;
      return { ...b, pending: b.pending.filter((x) => x.id !== id), rejected: [...b.rejected, { ...q, note }] };
    });
  }

  return (
    <div style={{ background: PAPER, minHeight: "100%", padding: "28px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        select option { background: ${PAPER}; }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end justify-between mb-1 flex-wrap gap-3">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>PE Civil · Structural</div>
            <h1 className="text-3xl" style={{ color: LINE, fontFamily: "'Space Grotesk', sans-serif" }}>PRESSURE TESTING</h1>
          </div>
          <div className="flex gap-1 flex-wrap">
            {[["practice", "Practice"], ["review", "Review Queue"], ["dashboard", "Manager view"]].map(([key, label]) => (
              <button key={key} onClick={() => setView(key)} className="px-3 py-1.5 text-xs uppercase tracking-wide rounded-none border flex items-center gap-1.5"
                style={{ borderColor: view === key ? AMBER : STEEL, color: view === key ? AMBER : STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>
                {key === "review" && bank.pending.length > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full text-[9px] w-4 h-4" style={{ background: AMBER, color: INK }}>{bank.pending.length}</span>
                )}
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs mb-8" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Demo version. Your progress is saved in this browser and will still be here next time you visit — it isn't yet shared across devices or with other people.{" "}
          <button onClick={resetDemo} className="underline" style={{ color: STEEL, background: "none", border: "none", cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            Reset my demo progress
          </button>
        </p>
        {view === "practice" && <PracticeView bank={bank} missed={missed} you={you} questionStats={questionStats} onRequestGeneration={addPending} onCompleteQuiz={recordResult} />}
        {view === "review" && <ReviewQueueView bank={bank} onApprove={approve} onReject={reject} />}
        {view === "dashboard" && <DashboardView team={team} bank={bank} missed={missed} />}
      </div>
    </div>
  );
}
