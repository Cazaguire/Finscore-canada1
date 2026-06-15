import { useState } from "react";
import Head from "next/head";

const provinces = ["QC","ON","BC","AB","MB","SK","NS","NB","NL","PE"];

/* ─── tiny UI helpers ─── */
function Label({ children, hint }) {
  return (
    <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#0a1628", marginBottom:6 }}>
      {children}{hint && <span style={{ fontWeight:400, color:"#999", marginLeft:4 }}>{hint}</span>}
    </label>
  );
}

function Input({ prefix, style: extraStyle, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      {prefix && (
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
          color:"#aaa", fontWeight:600, fontSize:14, pointerEvents:"none", zIndex:1 }}>{prefix}</span>
      )}
      <input
        {...props}
        onFocus={e => { setFocus(true); props.onFocus?.(e); }}
        onBlur={e => { setFocus(false); props.onBlur?.(e); }}
        style={{
          width:"100%", padding: prefix ? "11px 14px 11px 28px" : "11px 14px",
          border: `1.5px solid ${focus ? "#c9a84c" : "#ddd"}`,
          borderRadius:10, fontSize:14, fontFamily:"inherit",
          color:"#1a1a2e", background:"#fafaf8", outline:"none",
          boxSizing:"border-box", transition:"border 0.2s", ...extraStyle
        }}
      />
    </div>
  );
}

function Select({ options, value, onChange, style: extra }) {
  return (
    <select value={value} onChange={onChange} style={{
      width:"100%", padding:"11px 14px", border:"1.5px solid #ddd",
      borderRadius:10, fontSize:14, fontFamily:"inherit",
      color:"#1a1a2e", background:"#fafaf8", outline:"none",
      appearance:"none", boxSizing:"border-box", ...extra
    }}>
      {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width:"100%", padding:"11px 14px", minHeight:70, resize:"vertical",
        border: `1.5px solid ${focus ? "#c9a84c" : "#ddd"}`,
        borderRadius:10, fontSize:14, fontFamily:"inherit",
        color:"#1a1a2e", background:"#fafaf8", outline:"none",
        lineHeight:1.55, boxSizing:"border-box", transition:"border 0.2s"
      }}
    />
  );
}

function Row({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>{children}</div>;
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <Label hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background:"#fff", borderRadius:18, border:"1px solid rgba(201,168,76,0.18)",
      padding:"28px 32px", marginBottom:20,
      boxShadow:"0 4px 30px rgba(0,0,0,0.1)", ...style
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, sub }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:22,
      paddingBottom:14, borderBottom:"1px solid #f0ebe0" }}>
      <div style={{ width:40, height:40, borderRadius:10, background:"#0a1628",
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#0a1628" }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:"#999", marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Pill({ value, thresholds }) {
  // thresholds: [good_max, warn_max] e.g. [10, 30]
  const n = parseFloat(value) || 0;
  const color = n <= thresholds[0] ? "#1a7a4a" : n <= thresholds[1] ? "#c9a84c" : "#c0392b";
  const bg = n <= thresholds[0] ? "rgba(26,122,74,0.1)" : n <= thresholds[1] ? "rgba(201,168,76,0.1)" : "rgba(192,57,43,0.1)";
  const label = n <= thresholds[0] ? "✓ Good" : n <= thresholds[1] ? "● Moderate" : "⚠ High";
  return (
    <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20,
      background:bg, color, fontWeight:700, fontSize:12, marginLeft:10 }}>
      {label}
    </span>
  );
}

/* ─── Main component ─── */
export default function Home() {
  const [basic, setBasic] = useState({ name:"", province:"QC", netIncome:"", otherIncome:"", creditScore:"" });
  const [exp, setExp] = useState({ housing:"", groceries:"", transport:"", restaurants:"", subs:"", insurance:"", family:"", other:"" });
  const [cards, setCards] = useState([{ name:"", rewards:"", limit:"", balance:"", closing:"", due:"", fee:"", apr:"19.99" }]);
  const [debts, setDebts] = useState([]);
  const [sav, setSav] = useState({ emergency:"", tfsa:"", rrsp:"", other:"" });
  const [goals, setGoals] = useState({ primary:"", secondary:"", timeline:"", amount:"", context:"" });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  /* ── helpers ── */
  const upd = (setter, field, val) => setter(p => ({ ...p, [field]: val }));
  const updCard = (i, f, v) => setCards(c => c.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const updDebt = (i, f, v) => setDebts(d => d.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  const addCard = () => setCards(c => [...c, { name:"", rewards:"", limit:"", balance:"", closing:"", due:"", fee:"", apr:"19.99" }]);
  const addDebt = () => setDebts(d => [...d, { type:"", name:"", balance:"", rate:"", payment:"" }]);

  /* ── derived numbers ── */
  const totalIncome = (parseFloat(basic.netIncome)||0) + (parseFloat(basic.otherIncome)||0);
  const totalExp = Object.values(exp).reduce((a,b) => a+(parseFloat(b)||0), 0);
  const totalLimit = cards.reduce((a,c) => a+(parseFloat(c.limit)||0), 0);
  const totalBal = cards.reduce((a,c) => a+(parseFloat(c.balance)||0), 0);
  const util = totalLimit > 0 ? ((totalBal/totalLimit)*100).toFixed(1) : "0.0";
  const totalDebt = debts.reduce((a,d) => a+(parseFloat(d.balance)||0), 0);
  const totalDebtPay = debts.reduce((a,d) => a+(parseFloat(d.payment)||0), 0);
  const surplus = (totalIncome - totalExp - totalDebtPay).toFixed(0);
  const totalSav = Object.values(sav).reduce((a,b) => a+(parseFloat(b)||0), 0);

  /* ── submit ── */
  async function handleSubmit() {
    setLoading(true);
    setError("");
    setReport("");
    // scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { basic, expenses: exp, cards, debts, savings: sav, goals,
            totalIncome, totalExp, totalLimit, totalBal, util, surplus, totalDebt, totalSav }
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Server error");
      setReport(json.report);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const btnStyle = {
    width:"100%", padding:"16px", borderRadius:14, border:"none",
    background:"linear-gradient(135deg,#c9a84c,#e8c97a)", color:"#0a1628",
    fontFamily:"inherit", fontSize:16, fontWeight:800, cursor:"pointer",
    boxShadow:"0 4px 20px rgba(201,168,76,0.35)", letterSpacing:0.3,
    transition:"opacity 0.2s"
  };

  const denseInputStyle = { background:"#fff" };

  /* ─── REPORT VIEW ─── */
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0a1628,#0d1f3c)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20, padding:40 }}>
      <div style={{ width:52, height:52, border:"3px solid rgba(201,168,76,0.2)", borderTopColor:"#c9a84c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <h2 style={{ fontFamily:"Georgia,serif", fontSize:24, color:"#fff", textAlign:"center" }}>Analyzing your financial profile…</h2>
      <p style={{ color:"rgba(255,255,255,0.45)", fontSize:15, textAlign:"center" }}>This takes 20–40 seconds. Please don't close this tab.</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (report) return (
    <>
      <Head><title>Your Financial Report — FinScore Canada</title></Head>
      <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0a1628,#0d1f3c)", padding:"40px 16px 80px" }}>
        <div style={{ maxWidth:780, margin:"0 auto" }}>
          <Card className="report-card">
            {/* Report header */}
            <div style={{ textAlign:"center", paddingBottom:24, borderBottom:"2px solid #ece5d8", marginBottom:32 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🍁</div>
              <h1 style={{ fontFamily:"Georgia,serif", fontSize:28, color:"#0a1628", marginBottom:6 }}>
                Financial Optimization Report
              </h1>
              {basic.name && <p style={{ fontSize:18, fontWeight:600, color:"#0a1628" }}>{basic.name}</p>}
              <p style={{ color:"#999", fontSize:13, marginTop:4 }}>
                Generated {new Date().toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" })} ·
                Province: {basic.province} · Monthly Income: ${totalIncome.toLocaleString()} CAD
              </p>
            </div>

            {/* Report body */}
            <div className="report-body" dangerouslySetInnerHTML={{ __html: report }} />

            {/* Actions */}
            <div className="no-print" style={{ display:"flex", gap:12, marginTop:36, paddingTop:24, borderTop:"1px solid #ece5d8", flexWrap:"wrap" }}>
              <button onClick={() => window.print()} style={{ flex:1, minWidth:160, padding:"13px 20px", borderRadius:12, background:"#0a1628", border:"1px solid rgba(201,168,76,0.3)", color:"#c9a84c", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                🖨 Print / Save PDF
              </button>
              <button onClick={() => { setReport(""); setError(""); }} style={{ flex:1, minWidth:160, padding:"13px 20px", borderRadius:12, background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.3)", color:"#c9a84c", fontFamily:"inherit", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                ↺ New Analysis
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  /* ─── FORM ─── */
  return (
    <>
      <Head>
        <title>FinScore Canada — AI Financial Advisor</title>
        <meta name="description" content="Get a personalized Canadian credit and financial optimization report powered by AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* BG gradients */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 80% 60% at 20% 0%, rgba(201,168,76,0.07) 0%, transparent 60%), linear-gradient(160deg,#0a1628 0%,#0d1f3c 60%,#091525 100%)" }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:720, margin:"0 auto", padding:"40px 16px 80px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.25)",
            borderRadius:50, padding:"6px 18px", marginBottom:16,
            fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"#c9a84c" }}>
            🍁 FinScore Canada · AI-Powered
          </div>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(28px,5vw,46px)", fontWeight:900,
            lineHeight:1.15, marginBottom:12,
            background:"linear-gradient(135deg,#fff 30%,#e8c97a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Your Personal Credit &<br />Financial Advisor
          </h1>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:15 }}>
            Fill in your profile → receive a complete, personalized financial report in seconds
          </p>
        </div>

        {error && (
          <div style={{ background:"rgba(192,57,43,0.12)", border:"1px solid rgba(192,57,43,0.3)", borderRadius:12, padding:"14px 18px", marginBottom:20, color:"#ff8f7a", fontSize:14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── 1. Basic Info ── */}
        <Card>
          <SectionTitle icon="👤" title="Basic Information" />
          <Row>
            <Field label="First Name" hint="(optional)">
              <Input type="text" value={basic.name} onChange={e=>upd(setBasic,"name",e.target.value)} placeholder="e.g. Marie" />
            </Field>
            <Field label="Province">
              <Select value={basic.province} onChange={e=>upd(setBasic,"province",e.target.value)} options={provinces.map(p=>[p,p])} />
            </Field>
          </Row>
          <Row>
            <Field label="Monthly Net Income" hint="(after tax)">
              <Input prefix="$" type="number" value={basic.netIncome} onChange={e=>upd(setBasic,"netIncome",e.target.value)} placeholder="5,200" />
            </Field>
            <Field label="Other Monthly Income" hint="(optional)">
              <Input prefix="$" type="number" value={basic.otherIncome} onChange={e=>upd(setBasic,"otherIncome",e.target.value)} placeholder="0" />
            </Field>
          </Row>
          <Field label="Approximate Credit Score" hint="(optional — check Borrowell or Credit Karma)">
            <Select value={basic.creditScore} onChange={e=>upd(setBasic,"creditScore",e.target.value)}
              options={[["","I don't know"],["800+","Excellent: 800+"],["740-799","Very Good: 740–799"],
                ["670-739","Good: 670–739"],["580-669","Fair: 580–669"],["<580","Poor: Below 580"]]} />
          </Field>
        </Card>

        {/* ── 2. Expenses ── */}
        <Card>
          <SectionTitle icon="🏠" title="Monthly Expenses" sub="Approximate amounts are fine" />
          <Row>
            <Field label="Housing (rent/mortgage)"><Input prefix="$" type="number" value={exp.housing} onChange={e=>upd(setExp,"housing",e.target.value)} placeholder="1,800" /></Field>
            <Field label="Groceries"><Input prefix="$" type="number" value={exp.groceries} onChange={e=>upd(setExp,"groceries",e.target.value)} placeholder="600" /></Field>
          </Row>
          <Row>
            <Field label="Transport (car, gas, transit)"><Input prefix="$" type="number" value={exp.transport} onChange={e=>upd(setExp,"transport",e.target.value)} placeholder="300" /></Field>
            <Field label="Restaurants & Takeout"><Input prefix="$" type="number" value={exp.restaurants} onChange={e=>upd(setExp,"restaurants",e.target.value)} placeholder="200" /></Field>
          </Row>
          <Row>
            <Field label="Subscriptions & Bills"><Input prefix="$" type="number" value={exp.subs} onChange={e=>upd(setExp,"subs",e.target.value)} placeholder="150" /></Field>
            <Field label="Insurance"><Input prefix="$" type="number" value={exp.insurance} onChange={e=>upd(setExp,"insurance",e.target.value)} placeholder="200" /></Field>
          </Row>
          <Row>
            <Field label="Childcare / Family"><Input prefix="$" type="number" value={exp.family} onChange={e=>upd(setExp,"family",e.target.value)} placeholder="0" /></Field>
            <Field label="Other Expenses"><Input prefix="$" type="number" value={exp.other} onChange={e=>upd(setExp,"other",e.target.value)} placeholder="200" /></Field>
          </Row>
          {totalExp > 0 && (
            <div style={{ background:"#f7f4ee", borderRadius:10, padding:"11px 16px", fontSize:14, marginTop:4 }}>
              <strong style={{ color:"#0a1628" }}>Total: ${totalExp.toLocaleString()}</strong>
              {totalIncome > 0 && (
                <span style={{ marginLeft:12, fontWeight:600, color: parseFloat(surplus) >= 0 ? "#1a7a4a" : "#c0392b" }}>
                  Monthly surplus: ${parseInt(surplus).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* ── 3. Credit Cards ── */}
        <Card>
          <SectionTitle icon="💳" title="Credit Cards" sub="Add all cards — even with $0 balance" />
          {cards.map((card, i) => (
            <div key={i} style={{ background:"#f7f4ee", border:"1px solid #e5ddd0", borderRadius:14, padding:18, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <strong style={{ fontSize:13, color:"#0a1628" }}>💳 Card #{i+1}</strong>
                {cards.length > 1 && (
                  <button onClick={() => setCards(c => c.filter((_,idx)=>idx!==i))}
                    style={{ background:"none", border:"none", color:"#c0392b", fontSize:17, cursor:"pointer", lineHeight:1 }}>✕</button>
                )}
              </div>
              <Row>
                <Field label="Bank & Card Name">
                  <Input type="text" value={card.name} onChange={e=>updCard(i,"name",e.target.value)} placeholder="e.g. TD Cashback Visa Infinite" style={denseInputStyle} />
                </Field>
                <Field label="Rewards Type">
                  <Select value={card.rewards} onChange={e=>updCard(i,"rewards",e.target.value)}
                    options={[["","Select"],["cashback","Cash Back"],["points","Points (Aeroplan, Scene+…)"],["travel","Travel Miles"],["none","No Rewards"]]}
                    style={denseInputStyle} />
                </Field>
              </Row>
              <Row>
                <Field label="Credit Limit">
                  <Input prefix="$" type="number" value={card.limit} onChange={e=>updCard(i,"limit",e.target.value)} placeholder="5,000" style={denseInputStyle} />
                </Field>
                <Field label={`Balance${card.limit&&card.balance ? ` — ${((parseFloat(card.balance)||0)/(parseFloat(card.limit)||1)*100).toFixed(0)}% util.` : ""}`}>
                  <Input prefix="$" type="number" value={card.balance} onChange={e=>updCard(i,"balance",e.target.value)} placeholder="0" style={denseInputStyle} />
                </Field>
              </Row>
              <Row>
                <Field label="Statement Closes (day of month)">
                  <Input type="number" value={card.closing} onChange={e=>updCard(i,"closing",e.target.value)} placeholder="e.g. 15" min="1" max="31" style={denseInputStyle} />
                </Field>
                <Field label="Payment Due (day of month)">
                  <Input type="number" value={card.due} onChange={e=>updCard(i,"due",e.target.value)} placeholder="e.g. 10" min="1" max="31" style={denseInputStyle} />
                </Field>
              </Row>
              <Row>
                <Field label="Annual Fee">
                  <Input prefix="$" type="number" value={card.fee} onChange={e=>updCard(i,"fee",e.target.value)} placeholder="0" style={denseInputStyle} />
                </Field>
                <Field label="Interest Rate (APR %)">
                  <Input prefix="%" type="number" value={card.apr} onChange={e=>updCard(i,"apr",e.target.value)} placeholder="19.99" step="0.01" style={denseInputStyle} />
                </Field>
              </Row>
            </div>
          ))}
          <button onClick={addCard} style={{ width:"100%", padding:"10px", border:"2px dashed rgba(201,168,76,0.4)", borderRadius:10, background:"transparent", color:"#c9a84c", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            ＋ Add Another Card
          </button>
          {totalLimit > 0 && (
            <div style={{ marginTop:12, background:"#f7f4ee", borderRadius:10, padding:"11px 16px", fontSize:14 }}>
              <strong style={{ color:"#0a1628" }}>Overall Utilization: {util}%</strong>
              <Pill value={util} thresholds={[10,30]} />
            </div>
          )}
        </Card>

        {/* ── 4. Debts + Savings ── */}
        <Card>
          <SectionTitle icon="🏦" title="Loans & Lines of Credit" sub="Other debts beyond credit cards" />
          {debts.map((d, i) => (
            <div key={i} style={{ background:"#f7f4ee", border:"1px solid #e5ddd0", borderRadius:14, padding:18, marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <strong style={{ fontSize:13, color:"#0a1628" }}>Debt #{i+1}</strong>
                <button onClick={() => setDebts(x => x.filter((_,idx)=>idx!==i))}
                  style={{ background:"none", border:"none", color:"#c0392b", fontSize:17, cursor:"pointer", lineHeight:1 }}>✕</button>
              </div>
              <Row>
                <Field label="Type">
                  <Select value={d.type} onChange={e=>updDebt(i,"type",e.target.value)}
                    options={[["","Select"],["personal-loan","Personal Loan"],["auto-loan","Auto Loan"],
                      ["student-loan","Student Loan"],["heloc","HELOC"],["loc","Line of Credit"],
                      ["mortgage","Mortgage"],["other","Other"]]}
                    style={denseInputStyle} />
                </Field>
                <Field label="Lender / Description">
                  <Input type="text" value={d.name} onChange={e=>updDebt(i,"name",e.target.value)} placeholder="e.g. Desjardins LOC" style={denseInputStyle} />
                </Field>
              </Row>
              <Row>
                <Field label="Outstanding Balance">
                  <Input prefix="$" type="number" value={d.balance} onChange={e=>updDebt(i,"balance",e.target.value)} placeholder="12,000" style={denseInputStyle} />
                </Field>
                <Field label="Interest Rate">
                  <Input prefix="%" type="number" value={d.rate} onChange={e=>updDebt(i,"rate",e.target.value)} placeholder="5.99" step="0.01" style={denseInputStyle} />
                </Field>
              </Row>
              <Field label="Monthly Payment">
                <Input prefix="$" type="number" value={d.payment} onChange={e=>updDebt(i,"payment",e.target.value)} placeholder="350" style={denseInputStyle} />
              </Field>
            </div>
          ))}
          <button onClick={addDebt} style={{ width:"100%", padding:"10px", border:"2px dashed rgba(201,168,76,0.4)", borderRadius:10, background:"transparent", color:"#c9a84c", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:24 }}>
            ＋ Add a Loan or Line of Credit
          </button>

          <div style={{ paddingTop:20, borderTop:"1px solid #ece5d8" }}>
            <div style={{ fontFamily:"Georgia,serif", fontSize:17, fontWeight:700, color:"#0a1628", marginBottom:16 }}>💰 Savings & Investments</div>
            <Row>
              <Field label="Emergency / Chequing"><Input prefix="$" type="number" value={sav.emergency} onChange={e=>upd(setSav,"emergency",e.target.value)} placeholder="2,000" /></Field>
              <Field label="TFSA Balance"><Input prefix="$" type="number" value={sav.tfsa} onChange={e=>upd(setSav,"tfsa",e.target.value)} placeholder="0" /></Field>
            </Row>
            <Row>
              <Field label="RRSP Balance"><Input prefix="$" type="number" value={sav.rrsp} onChange={e=>upd(setSav,"rrsp",e.target.value)} placeholder="0" /></Field>
              <Field label="Other Investments"><Input prefix="$" type="number" value={sav.other} onChange={e=>upd(setSav,"other",e.target.value)} placeholder="0" /></Field>
            </Row>
          </div>
        </Card>

        {/* ── 5. Goals ── */}
        <Card>
          <SectionTitle icon="🎯" title="Financial Goals" />
          <Field label="Primary Goal">
            <Select value={goals.primary} onChange={e=>upd(setGoals,"primary",e.target.value)}
              options={[["","Select your main goal"],["buy-house","Buy a House / First Home"],
                ["buy-car","Buy a Car"],["debt-free","Become Completely Debt-Free"],
                ["emergency-fund","Build Emergency Fund"],["improve-credit","Improve Credit Score"],
                ["invest-more","Start / Grow Investments"],["baby","Prepare for Baby / Family"],
                ["retire-early","Plan for Early Retirement"],["travel","Save for Travel"]]} />
          </Field>
          <Field label="Secondary Goals" hint="(optional)">
            <Textarea value={goals.secondary} onChange={e=>upd(setGoals,"secondary",e.target.value)} placeholder="e.g. Also want to max TFSA this year and reduce CC debt by 50%…" />
          </Field>
          <Row>
            <Field label="Timeline">
              <Select value={goals.timeline} onChange={e=>upd(setGoals,"timeline",e.target.value)}
                options={[["","Select timeline"],["3-months","Within 3 months"],["6-months","6 months"],
                  ["1-year","1 year"],["2-years","2 years"],["3-5-years","3–5 years"],["5-plus","5+ years"]]} />
            </Field>
            <Field label="Target Amount" hint="(if applicable)">
              <Input prefix="$" type="number" value={goals.amount} onChange={e=>upd(setGoals,"amount",e.target.value)} placeholder="30,000" />
            </Field>
          </Row>
          <Field label="Anything else I should know?" hint="(optional)">
            <Textarea value={goals.context} onChange={e=>upd(setGoals,"context",e.target.value)} placeholder="e.g. Baby coming in 3 months, recently changed jobs, planning to move cities, self-employed…" />
          </Field>
        </Card>

        {/* ── Submit ── */}
        <button onClick={handleSubmit} style={btnStyle}>
          🚀 Generate My Financial Report
        </button>
        <p style={{ textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:12, marginTop:12 }}>
          Your data is never stored. The report is generated fresh each time.
        </p>
      </div>

      <style>{`
        @media (max-width: 560px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
