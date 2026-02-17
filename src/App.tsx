// @ts-nocheck
import { useState } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─── STORAGE (localStorage para StackBlitz/CodeSandbox) ──────────────────────
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const todayKey = () => new Date().toISOString().split("T")[0];
const todayLabel = () => new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0d0d", surface: "#161616", card: "#1e1e1e", border: "#2a2a2a",
  accent: "#c8f060", accentDark: "#0d0d0d", text: "#f0f0f0",
  muted: "#888", faint: "#444", danger: "#ff5555",
  purple: "#9b7fe8", orange: "#ff9944", teal: "#3ecfcf",
};

const catColors = {
  trabajo: C.teal, salud: C.accent, personal: C.purple,
  aprendizaje: C.orange, otro: C.muted,
};

// ─── GROQ API ────────────────────────────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "";
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: "2px 8px", fontSize: 11,
    fontFamily: "monospace", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
  }}>{children}</span>
);

const Checkbox = ({ checked, onChange }) => (
  <button onClick={onChange} style={{
    width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: "pointer",
    border: `2px solid ${checked ? C.accent : C.border}`,
    background: checked ? C.accent + "22" : "transparent",
    color: checked ? C.accent : "transparent",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, transition: "all 0.15s",
  }}>{checked ? "✓" : ""}</button>
);

const Input = ({ value, onChange, placeholder, onKeyDown, style }) => (
  <input value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown}
    placeholder={placeholder} style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      color: C.text, padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
      outline: "none", width: "100%", boxSizing: "border-box", ...style,
    }} />
);

const Sel = ({ value, onChange, options, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
    color: C.text, padding: "10px 14px", fontSize: 13, fontFamily: "monospace",
    outline: "none", cursor: "pointer", ...style,
  }}>
    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
  </select>
);

const Btn = ({ children, onClick, variant = "default", disabled, style }) => {
  const v = {
    default: { background: C.surface, border: `1px solid ${C.border}`, color: C.text },
    accent: { background: C.accent, border: `1px solid ${C.accent}`, color: C.accentDark },
    ghost: { background: "transparent", border: "none", color: C.muted },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      borderRadius: 9, padding: "10px 18px", fontSize: 13, fontFamily: "monospace",
      cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700,
      display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
      opacity: disabled ? 0.5 : 1, whiteSpace: "nowrap", ...v, ...style,
    }}>{children}</button>
  );
};

const Panel = ({ title, icon, children, accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
    <div style={{
      borderBottom: `1px solid ${C.border}`, padding: "13px 20px",
      display: "flex", alignItems: "center", gap: 10, background: C.surface,
    }}>
      <span style={{ color: accent || C.accent, fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 12, fontFamily: "monospace", color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{title}</span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const Empty = ({ icon, title, desc }) => (
  <div style={{
    textAlign: "center", padding: "56px 20px", color: C.muted, fontSize: 14, lineHeight: 1.9,
    border: `1px dashed ${C.border}`, borderRadius: 16,
  }}>
    <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
    <div style={{ fontFamily: "monospace", marginBottom: 6, color: C.text }}>{title}</div>
    <div style={{ whiteSpace: "pre-line" }}>{desc}</div>
  </div>
);

// ─── API KEY SCREEN ───────────────────────────────────────────────────────────
function ApiKeyScreen({ onSave }) {
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");

  const test = async () => {
    if (!key.trim()) return;
    setTesting(true); setError("");
    try {
      await callGemini(key.trim(), "Di solo: ok");
      onSave(key.trim());
    } catch (e) {
      setError("Error: " + (e.message || "API key invalida o sin conexion."));
    }
    setTesting(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 460,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 20, overflow: "hidden",
      }}>
        <div style={{
          padding: "28px 32px 24px",
          borderBottom: `1px solid ${C.border}`,
          background: C.surface,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>DayForge</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
            Organizador diario con IA. Para empezar, ingresa tu API key de Groq (100% gratuita).
          </div>
        </div>
        <div style={{ padding: "24px 32px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontFamily: "monospace", color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Groq API Key
            </div>
            <Input
              value={key}
              onChange={setKey}
              placeholder="gsk_..."
              onKeyDown={e => e.key === "Enter" && test()}
              style={{ fontFamily: "monospace", letterSpacing: 0.5 }}
            />
            {error && <div style={{ marginTop: 8, fontSize: 13, color: C.danger }}>{error}</div>}
          </div>

          <Btn variant="accent" onClick={test} disabled={testing || !key.trim()} style={{ justifyContent: "center" }}>
            {testing ? "⏳ Verificando..." : "✦ Conectar y empezar"}
          </Btn>

          <div style={{
            fontSize: 12, color: C.muted, lineHeight: 1.7,
            background: C.surface, borderRadius: 10, padding: "14px 16px",
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ color: C.text, fontWeight: 600, marginBottom: 6 }}>¿Cómo obtener la key?</div>
            1. Ve a <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: C.accent }}>console.groq.com</a><br />
            2. Regístrate gratis (Google o email)<br />
            3. Ve a <strong style={{ color: C.text }}>"API Keys"</strong> → <strong style={{ color: C.text }}>"Create API Key"</strong><br />
            4. Cópiala y pégala aquí arriba<br />
            <br />
            <span style={{ color: C.accent }}>✓ 100% gratuito</span> — sin tarjeta de crédito.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REFINE PANEL ─────────────────────────────────────────────────────────────
function RefinePanel({ onRefine, loading }) {
  const [note, setNote] = useState("");
  const go = () => { if (!note.trim() || loading) return; onRefine(note); setNote(""); };
  return (
    <div style={{
      display: "flex", gap: 10, padding: 16,
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
    }}>
      <Input value={note} onChange={setNote}
        placeholder='Ajusta tu plan: "Tengo reunión a las 11h", "Añade tiempo para el gimnasio"...'
        onKeyDown={e => e.key === "Enter" && go()} style={{ flex: 1 }} />
      <Btn onClick={go} disabled={loading || !note.trim()} variant="accent">⚡ Ajustar</Btn>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(() => store.get("dayforge:apikey") || "");
  const [tab, setTab] = useState("day");
  const [goals, setGoals] = useState(() => store.get("dayforge:goals") || []);
  const [habits, setHabits] = useState(() => store.get("dayforge:habits") || []);
  const [plan, setPlan] = useState(() => {
    const saved = store.get("dayforge:plan");
    const date = store.get("dayforge:date");
    return (saved && date === todayKey()) ? saved : [];
  });
  const [newGoal, setNewGoal] = useState({ text: "", category: "trabajo", horizon: "mes" });
  const [newHabit, setNewHabit] = useState({ text: "", time: "mañana" });
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [aiStatus, setAiStatus] = useState("idle");
  const [aiError, setAiError] = useState("");

  const saveGoals = d => { setGoals(d); store.set("dayforge:goals", d); };
  const saveHabits = d => { setHabits(d); store.set("dayforge:habits", d); };
  const savePlan = d => { setPlan(d); store.set("dayforge:plan", d); store.set("dayforge:date", todayKey()); };
  const saveKey = k => { setApiKey(k); store.set("dayforge:apikey", k); };

  const addGoal = () => {
    if (!newGoal.text.trim()) return;
    saveGoals([...goals, { id: Date.now(), ...newGoal, done: false }]);
    setNewGoal({ text: "", category: "trabajo", horizon: "mes" });
    setShowAddGoal(false);
  };

  const addHabit = () => {
    if (!newHabit.text.trim()) return;
    saveHabits([...habits, { id: Date.now(), ...newHabit }]);
    setNewHabit({ text: "", time: "mañana" });
    setShowAddHabit(false);
  };

  const generatePlan = async () => {
    setAiStatus("loading"); setAiError("");
    const prompt = `Eres un asistente de productividad personal. Organiza el día de una persona basándote en sus objetivos y hábitos.
Responde SOLO con un JSON válido (sin texto adicional, sin bloques de código markdown), con este formato exacto:
[{"text":"descripción","time":"09:00","duration":30,"tag":"trabajo","priority":"alta"}]

Reglas:
- time en formato HH:MM (24h)
- duration en minutos
- tag: uno de trabajo/salud/personal/aprendizaje/otro
- priority: alta/media/baja
- Genera entre 6 y 10 tareas distribuidas durante el día
- Incluye los hábitos como tareas concretas con horario
- Divide objetivos grandes en acciones pequeñas realizables hoy
- Pon trabajo cognitivo por la mañana, tareas livianas por la tarde/noche

Mis objetivos:
${goals.map(g => `- [${g.horizon}] ${g.text} (${g.category})`).join("\n") || "Ninguno aún"}

Mis hábitos diarios:
${habits.map(h => `- ${h.text} (${h.time})`).join("\n") || "Ninguno aún"}

Fecha de hoy: ${todayLabel()}`;

    try {
      const text = await callGemini(apiKey, prompt);
      const clean = text.replace(/```json|```/g, "").trim();
      const tasks = JSON.parse(clean);
      savePlan(tasks.map((t, i) => ({ ...t, id: Date.now() + i, done: false })));
      setAiStatus("done");
    } catch (e) {
      setAiError("Error al generar el plan. Verifica tu API key o intenta de nuevo.");
      setAiStatus("idle");
    }
  };

  const refineWithNote = async (note) => {
    setAiStatus("loading"); setAiError("");
    const prompt = `Eres un asistente de productividad. Ajusta este plan de día según la indicación del usuario.
Responde SOLO con un JSON válido (sin texto extra, sin bloques de código markdown).
Formato: [{"text":"...","time":"HH:MM","duration":30,"tag":"trabajo","priority":"alta"}]

Plan actual:
${JSON.stringify(plan.map(t => ({ text: t.text, time: t.time, duration: t.duration, tag: t.tag, priority: t.priority })))}

Ajuste solicitado: ${note}

Devuelve el plan completo ajustado.`;
    try {
      const text = await callGemini(apiKey, prompt);
      const clean = text.replace(/```json|```/g, "").trim();
      const tasks = JSON.parse(clean);
      savePlan(tasks.map((t, i) => ({ ...t, id: Date.now() + i, done: false })));
      setAiStatus("done");
    } catch {
      setAiError("Error al ajustar el plan. Intenta de nuevo.");
      setAiStatus("idle");
    }
  };

  if (!apiKey) return <ApiKeyScreen onSave={saveKey} />;

  const doneTasks = plan.filter(t => t.done).length;
  const progress = plan.length > 0 ? Math.round((doneTasks / plan.length) * 100) : 0;
  const loading = aiStatus === "loading";

  const tabBtn = (t, label) => (
    <button onClick={() => setTab(t)} style={{
      padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
      fontFamily: "monospace", fontSize: 12, fontWeight: 700, letterSpacing: 0.8,
      textTransform: "uppercase", transition: "all 0.15s",
      background: tab === t ? C.accent : "transparent",
      color: tab === t ? C.accentDark : C.muted,
    }}>{label}</button>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input::placeholder { color: ${C.faint}; }
        select option { background: ${C.surface}; color: ${C.text}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10, height: 64,
        borderBottom: `1px solid ${C.border}`,
        background: C.bg + "ee", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.accent, fontSize: 22 }}>✦</span>
          <div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 15 }}>DayForge</div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 0.5 }}>{todayLabel()}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, background: C.surface, padding: 4, borderRadius: 12, border: `1px solid ${C.border}` }}>
          {tabBtn("day", "☀ Hoy")}
          {tabBtn("goals", "◎ Objetivos")}
          {tabBtn("habits", "↺ Hábitos")}
        </div>
        <button onClick={() => { if (confirm("¿Cambiar la API key?")) saveKey(""); }} style={{
          background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 12,
          fontFamily: "monospace", padding: "6px 10px", borderRadius: 6,
          transition: "color 0.15s",
        }} title="Cambiar API key">⚙ key</button>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── HOY ────────────────────────────────────────── */}
        {tab === "day" && <>
          {/* Generate card */}
          <div style={{
            background: `linear-gradient(135deg, ${C.accent}11, ${C.purple}11)`,
            border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                {plan.length === 0 ? "Sin plan para hoy" : `${doneTasks}/${plan.length} completadas · ${progress}%`}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                {plan.length === 0
                  ? "Genera tu plan diario con IA basado en tus objetivos y hábitos"
                  : "Plan generado con IA · Puedes ajustarlo con lenguaje natural"}
              </div>
            </div>
            <Btn variant="accent" onClick={generatePlan} disabled={loading} style={{ flexShrink: 0 }}>
              {loading
                ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span> Pensando...</>
                : <>✦ {plan.length > 0 ? "Regenerar" : "Generar mi día"}</>}
            </Btn>
          </div>

          {aiError && (
            <div style={{ padding: 14, borderRadius: 10, background: C.danger + "15", border: `1px solid ${C.danger}44`, color: C.danger, fontSize: 13 }}>
              ⚠ {aiError}
            </div>
          )}

          {/* Progress bar */}
          {plan.length > 0 && (
            <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: C.accent, borderRadius: 4, transition: "width 0.4s ease" }} />
            </div>
          )}

          {/* Task list */}
          {plan.length > 0 && (
            <Panel title="Plan del día" icon="⊞" accent={C.teal}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...plan].sort((a, b) => (a.time || "").localeCompare(b.time || "")).map(task => {
                  const col = catColors[task.tag] || C.muted;
                  const priCol = task.priority === "alta" ? C.danger : task.priority === "media" ? C.orange : C.muted;
                  return (
                    <div key={task.id} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 10,
                      background: task.done ? C.surface + "88" : C.surface,
                      border: `1px solid ${task.done ? C.border + "44" : C.border}`,
                      opacity: task.done ? 0.6 : 1, transition: "all 0.2s",
                    }}>
                      <Checkbox checked={task.done} onChange={() => {
                        savePlan(plan.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, marginBottom: 5,
                          textDecoration: task.done ? "line-through" : "none",
                          color: task.done ? C.muted : C.text,
                        }}>{task.text}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {task.time && <Badge color={C.teal}>{task.time}</Badge>}
                          {task.duration && <Badge color={C.muted}>{task.duration}min</Badge>}
                          {task.tag && <Badge color={col}>{task.tag}</Badge>}
                          {task.priority && <Badge color={priCol}>{task.priority}</Badge>}
                        </div>
                      </div>
                      <button onClick={() => savePlan(plan.filter(t => t.id !== task.id))} style={{
                        background: "none", border: "none", color: C.faint, cursor: "pointer",
                        fontSize: 18, padding: 4, transition: "color 0.15s", flexShrink: 0,
                      }} onMouseEnter={e => e.currentTarget.style.color = C.danger}
                        onMouseLeave={e => e.currentTarget.style.color = C.faint}>×</button>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {plan.length > 0 && <RefinePanel onRefine={refineWithNote} loading={loading} />}

          {plan.length === 0 && !loading && (
            <Empty icon="⊞" title="Sin plan todavía"
              desc={"Agrega objetivos y hábitos, luego pulsa\n✦ Generar mi día"} />
          )}
        </>}

        {/* ── OBJETIVOS ─────────────────────────────────── */}
        {tab === "goals" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Objetivos</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{goals.length} objetivo{goals.length !== 1 ? "s" : ""}</div>
            </div>
            <Btn onClick={() => setShowAddGoal(!showAddGoal)} variant="accent">+ Nuevo</Btn>
          </div>

          {showAddGoal && (
            <Panel title="Nuevo objetivo" icon="◎">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input value={newGoal.text} onChange={v => setNewGoal({ ...newGoal, text: v })}
                  placeholder="Ej: Correr una maratón, aprender Python, ahorrar 3000€..."
                  onKeyDown={e => e.key === "Enter" && addGoal()} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Sel value={newGoal.category} onChange={v => setNewGoal({ ...newGoal, category: v })}
                    style={{ flex: 1 }} options={[
                      { v: "trabajo", l: "💼 Trabajo" }, { v: "salud", l: "🏃 Salud" },
                      { v: "personal", l: "🌱 Personal" }, { v: "aprendizaje", l: "📚 Aprendizaje" },
                      { v: "otro", l: "◦ Otro" },
                    ]} />
                  <Sel value={newGoal.horizon} onChange={v => setNewGoal({ ...newGoal, horizon: v })}
                    style={{ flex: 1 }} options={[
                      { v: "semana", l: "Esta semana" }, { v: "mes", l: "Este mes" },
                      { v: "trimestre", l: "Este trimestre" }, { v: "año", l: "Este año" },
                      { v: "largo plazo", l: "Largo plazo" },
                    ]} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="accent" onClick={addGoal} style={{ flex: 1, justifyContent: "center" }}>Guardar</Btn>
                  <Btn onClick={() => setShowAddGoal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancelar</Btn>
                </div>
              </div>
            </Panel>
          )}

          {goals.length === 0
            ? <Empty icon="◎" title="Sin objetivos" desc={"Define tus metas para que la IA\npueda organizar tu día hacia ellas"} />
            : goals.map(goal => {
              const col = catColors[goal.category] || C.muted;
              return (
                <div key={goal.id} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderRadius: 12, background: C.card,
                  border: `1px solid ${goal.done ? C.border + "44" : C.border}`,
                  opacity: goal.done ? 0.65 : 1, transition: "all 0.2s",
                }}>
                  <Checkbox checked={goal.done} onChange={() => saveGoals(goals.map(g => g.id === goal.id ? { ...g, done: !g.done } : g))} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 500, marginBottom: 6,
                      textDecoration: goal.done ? "line-through" : "none",
                      color: goal.done ? C.muted : C.text,
                    }}>{goal.text}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Badge color={col}>{goal.category}</Badge>
                      <Badge color={C.muted}>{goal.horizon}</Badge>
                    </div>
                  </div>
                  <button onClick={() => saveGoals(goals.filter(g => g.id !== goal.id))} style={{
                    background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 18,
                  }} onMouseEnter={e => e.currentTarget.style.color = C.danger}
                    onMouseLeave={e => e.currentTarget.style.color = C.faint}>×</button>
                </div>
              );
            })}
        </>}

        {/* ── HÁBITOS ───────────────────────────────────── */}
        {tab === "habits" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Hábitos diarios</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{habits.length} hábito{habits.length !== 1 ? "s" : ""}</div>
            </div>
            <Btn onClick={() => setShowAddHabit(!showAddHabit)} variant="accent">+ Nuevo</Btn>
          </div>

          {showAddHabit && (
            <Panel title="Nuevo hábito" icon="↺" accent={C.purple}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input value={newHabit.text} onChange={v => setNewHabit({ ...newHabit, text: v })}
                  placeholder="Ej: Meditar 10 minutos, leer 30 páginas, salir a caminar..."
                  onKeyDown={e => e.key === "Enter" && addHabit()} />
                <Sel value={newHabit.time} onChange={v => setNewHabit({ ...newHabit, time: v })}
                  options={[
                    { v: "madrugada", l: "🌙 Madrugada (antes de 7h)" },
                    { v: "mañana", l: "☀ Mañana (7h – 12h)" },
                    { v: "mediodía", l: "🌤 Mediodía (12h – 15h)" },
                    { v: "tarde", l: "🌅 Tarde (15h – 20h)" },
                    { v: "noche", l: "🌙 Noche (20h+)" },
                  ]} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="accent" onClick={addHabit} style={{ flex: 1, justifyContent: "center" }}>Guardar</Btn>
                  <Btn onClick={() => setShowAddHabit(false)} style={{ flex: 1, justifyContent: "center" }}>Cancelar</Btn>
                </div>
              </div>
            </Panel>
          )}

          {habits.length === 0
            ? <Empty icon="↺" title="Sin hábitos" desc={"Agrega tus rutinas diarias para que\nla IA las incluya en tu plan del día"} />
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {habits.map(habit => (
                <div key={habit.id} style={{
                  padding: "16px 18px", borderRadius: 12, background: C.card,
                  border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{habit.text}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Badge color={C.purple}>{habit.time}</Badge>
                    <button onClick={() => saveHabits(habits.filter(h => h.id !== habit.id))} style={{
                      background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 18,
                    }} onMouseEnter={e => e.currentTarget.style.color = C.danger}
                      onMouseLeave={e => e.currentTarget.style.color = C.faint}>×</button>
                  </div>
                </div>
              ))}
            </div>}
        </>}

      </div>
    </>
  );
}
