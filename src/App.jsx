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

const INK = "#0F1F33";
const INK_2 = "#16294A";
const LINE = "#E7EEF3";
const STEEL = "#7C8B9C";
const AMBER = "#F2A93C";
const RED = "#C1443B";
const GREEN = "#4E9B6B";

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
  approved: [
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
  ],
  pending: [
    { id: "q5", topic: "Reinforced Concrete Design", difficulty: "medium", question: "Which factor most directly increases the development length required for reinforcing bars?", options: ["Larger bar diameter", "Higher concrete strength", "Epoxy coating removal", "Shorter bar spacing"], correctIndex: 0, explanation: "Development length scales with bar diameter — larger bars require more embedment to transfer force to the concrete." },
    { id: "q6", topic: "Foundations & Geotechnical", difficulty: "easy", question: "A deep foundation transfers load to bearing strata primarily through which two mechanisms?", options: ["Color and texture", "End bearing and skin friction", "Thermal expansion only", "Surface tension"], correctIndex: 1, explanation: "Piles and drilled shafts carry load via end bearing at the tip and skin friction along the shaft." },
  ],
  rejected: [],
};

const DIFF_COLOR = { easy: GREEN, medium: AMBER, hard: RED };

function scoreColor(v) {
  if (v >= 75) return GREEN;
  if (v >= 60) return AMBER;
  return RED;
}

function weightsForAccuracy(acc) {
  if (acc < 60) return { easy: 0.5, medium: 0.4, hard: 0.1 };
  if (acc < 80) return { easy: 0.2, medium: 0.5, hard: 0.3 };
  return { easy: 0.1, medium: 0.4, hard: 0.5 };
}

function pickAdaptiveSet(pool, accuracy, count, priorityQuestions = []) {
  const priIds = new Set(priorityQuestions.map((q) => q.id));
  const remainingPool = pool.filter((q) => !priIds.has(q.id));
  const weights = weightsForAccuracy(accuracy);
  const byDiff = { easy: [], medium: [], hard: [] };
  remainingPool.forEach((q) => byDiff[q.difficulty || "medium"].push(q));
  Object.keys(byDiff).forEach((k) => byDiff[k].sort(() => Math.random() - 0.5));

  const need = Math.max(0, count - priorityQuestions.length);
  const targetCounts = {
    easy: Math.round(weights.easy * need),
    medium: Math.round(weights.medium * need),
    hard: Math.round(weights.hard * need),
  };

  let picked = [];
  ["easy", "medium", "hard"].forEach((d) => {
    picked = picked.concat(byDiff[d].slice(0, targetCounts[d]));
  });
  if (picked.length < need) {
    const leftover = remainingPool.filter((q) => !picked.some((p) => p.id === q.id)).sort(() => Math.random() - 0.5);
    picked = picked.concat(leftover.slice(0, need - picked.length));
  }
  return [...priorityQuestions, ...picked.slice(0, need)];
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
    <div className="relative border rounded-none p-6" style={{ borderColor: STEEL, borderWidth: 1, background: INK_2 }}>
      {["top-2 left-2 border-l border-t", "top-2 right-2 border-r border-t", "bottom-2 left-2 border-l border-b", "bottom-2 right-2 border-r border-b"].map((pos, i) => (
        <div key={i} className={`absolute ${pos} w-3 h-3`} style={{ borderColor: STEEL, opacity: 0.6 }} />
      ))}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: STEEL, fontFamily: "'IBM Plex Mono', monospace" }}>Sheet {sheetNo}</div>
        <h2 className="text-xl mt-1" style={{ color: LINE, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
      </div>
      {children}
      <div className="mt-6 pt-3 flex justify-between text-[10px] uppercase tracking-[0.15em]" style={{ borderTop: `1px solid ${STEEL}`, color: STEEL, fontFamily: "'IBM Plex Mono', monospace", opacity: 0.7 }}>
        <span>Scale: NTS</span><span>True Bearing — Prototype</span><span>Rev D</span>
      </div>
    </div>
  );
}

function callClaude(systemPrompt, userPrompt) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  }).then((r) => r.json());
}

async function generateQuestions(topic) {
  const system =
    "You are an expert item-writer for the NCEES PE Civil: Structural exam. Generate original multiple-choice practice questions that test understanding of civil/structural engineering concepts at PE Civil: Structural exam style and difficulty. Write strictly from general engineering knowledge — do not reference, quote, closely paraphrase, or reconstruct content from any specific textbook, commercial test-prep product, or code document (e.g. ACI, ASCE, NCEES materials). Vary the numeric values, units, and scenario framing meaningfully across questions so each generation is distinct from prior ones. Respond ONLY with valid minified JSON and nothing else — no markdown fences, no commentary. Schema: {\"questions\":[{\"question\":string,\"options\":[string,string,string,string],\"correctIndex\":number,\"explanation\":string,\"difficulty\":\"easy\"|\"medium\"|\"hard\"}]}. Keep each explanation under 35 words.";
  const user = `Generate 4 original practice questions for the topic "${topic}" at PE Civil: Structural exam difficulty, with a mix of difficulty levels.`;
  const data = await callClaude(system, user);
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("No response content");
  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.questions.map((q) => ({ ...q, id: nextId(), topic, difficulty: q.difficulty || "medium" }));
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function DiffBadge({ d }) {
  const c = DIFF_COLOR[d] || AMBER;
  return (
    <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border" style={{ borderColor: c, color: c, fontFamily: "'IBM Plex Mono', monospace" }}>
      {d || "medium"}
    </span>
  );
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
                <DiffBadge d={q.difficulty} />
              </div>
              <div className="text-sm mb-3" style={{ color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                <span style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>Q{i + 1}. </span>{q.question}
              </div>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = picked === oi;
                  const showCorrect = submitted && oi === q.correctIndex;
                  const showWrongPick = submitted && isSelected && oi !== q.correctIndex;
                  return (
                    <button key={oi} disabled={submitted} onClick={() => onAnswer(i, oi)}
                      className="text-left px-3 py-2 text-sm flex items-center gap-2 rounded-none border transition"
                      style={{ borderColor: showCorrect ? GREEN : showWrongPick ? RED : isSelected ? AMBER : STEEL, background: isSelected && !submitted ? "rgba(242,169,60,0.08)" : "transparent", color: LINE, fontFamily: "'IBM Plex Sans', sans-serif" }}>
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
          style={{ background: LINE, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Submit answers
        </button>
      )}
    </>
  );
}

function PracticeView({ bank, missed, you, onRequestGeneration, onCompleteQuiz }) {
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
    const set = pickAdaptiveSet(pool, acc, 4, missedForTopic);
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
            {TOPICS.map((t) => (<option key={t} value={t} style={{ background: INK }}>{t}</option>))}
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
              <DiffBadge d={q.difficulty} />
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
              <Tooltip contentStyle={{ background: INK, border: `1px solid ${STEEL}`, fontFamily: "IBM Plex Sans" }} labelStyle={{ color: LINE }} />
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
  const [view, setView] = useState("practice");
  const [team, setTeam] = useState(SEED_TEAM);
  const [bank, setBank] = useState(SEED_BANK);
  const [missed, setMissed] = useState([]);

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
    <div style={{ background: INK, minHeight: "100%", padding: "28px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        select option { background: ${INK}; }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end justify-between mb-1 flex-wrap gap-3">
          <div>
            <div className="text-[11px] tracking-[0.3em] uppercase" style={{ color: AMBER, fontFamily: "'IBM Plex Mono', monospace" }}>PE Civil · Structural</div>
            <h1 className="text-3xl" style={{ color: LINE, fontFamily: "'Space Grotesk', sans-serif" }}>TRUE BEARING</h1>
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
        <p className="text-xs mb-8" style={{ color: STEEL, fontFamily: "'IBM Plex Sans', sans-serif" }}>Prototype demo — not a real product deployment. Storage is in-memory only and resets on reload.</p>
        {view === "practice" && <PracticeView bank={bank} missed={missed} you={you} onRequestGeneration={addPending} onCompleteQuiz={recordResult} />}
        {view === "review" && <ReviewQueueView bank={bank} onApprove={approve} onReject={reject} />}
        {view === "dashboard" && <DashboardView team={team} bank={bank} missed={missed} />}
      </div>
    </div>
  );
}
