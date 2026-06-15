import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: "Missing client data" });
  }

  const {
    basic, expenses, cards, debts, savings, goals,
    totalIncome, totalExp, totalLimit, totalBal, util, surplus, totalDebt, totalSav
  } = data;

  const monthlyExpTotal = parseFloat(totalExp) || 0;

  const prompt = `You are a senior Canadian financial advisor (CFP-level) specializing in credit optimization, debt reduction, rewards maximization, and wealth building for Canadians. You charge $300/hour and your reports are known for being exhaustive, specific, and full of real calculations.

Generate a COMPREHENSIVE, DEEP, highly personalized financial report in HTML format (no doctype/html/body tags — inner HTML only, with inline styles).

CRITICAL QUALITY REQUIREMENTS — the report must be a genuine ANALYSIS, not a restatement of inputs:
- Do real math: calculate monthly interest cost per card (balance × APR ÷ 12), total annual interest, payoff timelines, projected savings growth month by month, emergency fund gap, rewards points earned per category per year with dollar value.
- Build actual calendars and tables: payment timing day-by-day using their statement closing and due dates, 12-month savings projection with running totals, avalanche vs snowball month-by-month comparison.
- Benchmark their spending against typical Canadian/provincial norms and flag specific categories that are high/low with exact dollar opportunities.
- Give specific dollar amounts and dates in EVERY recommendation. Never say "save more" — say "redirect $X/month to reach $Y by [month]".
- Recommend real Canadian credit cards by name with real reward structures and estimated annual value for THIS person's spending.
- Reference their actual goal, timeline, province (tax implications), and any context they gave.
- The report should be long and thorough — aim for the depth of a 6-8 page professional advisory document.

CLIENT PROFILE:
- Name: ${basic.name || "Client"}
- Province: ${basic.province}
- Monthly Net Income (after tax): $${basic.netIncome || 0} CAD
- Other Monthly Income: $${basic.otherIncome || 0} CAD
- Total Monthly Income: $${totalIncome} CAD
- Approximate Credit Score: ${basic.creditScore || "Unknown"}

MONTHLY EXPENSES (Total: $${totalExp}):
- Housing/Rent/Mortgage: $${expenses.housing || 0}
- Groceries: $${expenses.groceries || 0}
- Transport (car/gas/transit): $${expenses.transport || 0}
- Restaurants & Takeout: $${expenses.restaurants || 0}
- Subscriptions & Bills: $${expenses.subs || 0}
- Insurance: $${expenses.insurance || 0}
- Childcare/Family: $${expenses.family || 0}
- Other: $${expenses.other || 0}
Monthly Surplus (after expenses + debt payments): $${surplus}

CREDIT CARDS (Overall Utilization: ${util}%):
${cards.map((c, i) => `Card ${i+1}: ${c.name || "Unnamed"} | Limit: $${c.limit || 0} | Balance: $${c.balance || 0} | Util: ${c.limit > 0 ? ((parseFloat(c.balance)||0)/(parseFloat(c.limit)||1)*100).toFixed(1) : 0}% | APR: ${c.apr || 19.99}% | Annual Fee: $${c.fee || 0}/yr | Rewards: ${c.rewards || "unknown"} | Statement closes: day ${c.closing || "?"} | Payment due: day ${c.due || "?"}`).join("\n")}

LOANS & LINES OF CREDIT (Total: $${totalDebt}):
${debts.length === 0 ? "None" : debts.map(d => `${d.type} — ${d.name || ""}: Balance $${d.balance || 0} at ${d.rate || 0}% interest, $${d.payment || 0}/month`).join("\n")}

SAVINGS & INVESTMENTS (Total: $${totalSav}):
- Emergency/Chequing savings: $${savings.emergency || 0}
- TFSA: $${savings.tfsa || 0}
- RRSP: $${savings.rrsp || 0}
- Other investments: $${savings.other || 0}

FINANCIAL GOALS:
- Primary: ${goals.primary || "Not specified"}
- Secondary: ${goals.secondary || "None"}
- Timeline: ${goals.timeline || "Not specified"}
- Target Amount: ${goals.amount ? "$" + goals.amount : "Not specified"}
- Additional context: ${goals.context || "None"}

---

HTML FORMATTING RULES (apply to every element):
- H2: <h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:28px 0 12px;padding-top:20px;border-top:1px solid #ece5d8">
- H3: <h3 style="color:#0a1628;font-size:16px;margin:16px 0 8px">
- Tables: <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0">
- TH: <th style="background:#0a1628;color:#fff;padding:9px 12px;text-align:left;font-size:13px">
- TD: <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#2a2a3e">
- P and LI: always add style="color:#2a2a3e"
- Gold box: <div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:12px 16px;border-radius:0 8px 8px 0;margin:10px 0;font-size:14px;color:#2a2a3e">
- Red box: <div style="background:#fef2f0;border-left:4px solid #c0392b;padding:12px 16px;border-radius:0 8px 8px 0;margin:10px 0;font-size:14px;color:#2a2a3e">
- Green box: <div style="background:#f0faf5;border-left:4px solid #1a7a4a;padding:12px 16px;border-radius:0 8px 8px 0;margin:10px 0;font-size:14px;color:#2a2a3e">

Generate ALL sections below. Be concise but specific — use real numbers from the data.

<h2 ...>📋 Executive Summary</h2>
3 sentences: health status, biggest strength, biggest gap. Status: 🟢/🟡/🔴.

<h2 ...>📊 A. Credit & Financial Snapshot</h2>
Table: Income vs Expenses vs Surplus. Table: each card with Limit/Balance/Utilization%/Monthly Interest (balance×APR÷12)/Risk. Total utilization + credit score impact sentence. Net worth table. Score target for 12 months.

<h2 ...>📅 B. Payment Strategy</h2>
Key rule: pay BEFORE statement closing date to lower reported utilization. Table per card: Card | Closes Day | Pay Before | Due Day | Amount to Pay. Annual interest saved by paying in full. One pro tip.

<h2 ...>⚡ C. Debt Plan</h2>
Table: each debt with balance, rate, monthly interest. One-month payoff plan if surplus covers it. Avalanche vs snowball table with winner. 6-month projection. Post-payoff rule.

<h2 ...>🎁 D. Rewards Optimization</h2>
Table: Category | Best Card | Why | Est. Annual Value. Total annual rewards estimate. Fees vs benefits per card: keep/cancel/downgrade.

<h2 ...>🇨🇦 E. Card Recommendations</h2>
Open new card now? (yes/no + reason). 2 specific Canadian cards with name, fee, earn rates, estimated annual value for this person.

<h2 ...>🏦 F. Savings Plan</h2>
Emergency fund target: monthly expenses × 3 = $${(monthlyExpTotal*3).toFixed(0)} min, × 6 = $${(monthlyExpTotal*6).toFixed(0)} ideal. Current gap. Table: monthly surplus allocation (emergency / goal / buffer) with 12-month totals. TFSA first for ${basic.province} — why. 2 recommended HISA accounts.

<h2 ...>💸 G. Spending Analysis</h2>
Table: Category | Amount | % Income | QC Benchmark | Status. Top 2 cuts with annual savings and impact on goal.

<h2 ...>🎯 H. Goal: ${goals.primary || "primary goal"}</h2>
Math: can they reach ${goals.amount ? "$"+goals.amount : "target"} in ${goals.timeline || "their timeline"}? Show calculation. 4-row milestone table. Top 2 risks + mitigations.

<h2 ...>✅ I. Action Plan</h2>
<h3 ...>⚡ This Week</h3> Table: Action | Amount | Time needed (4 rows)
<h3 ...>📅 This Month</h3> 4 bullet actions
<h3 ...>🔄 Next 90 Days</h3> 4 bullet actions with savings running total
<h3 ...>📈 12-Month Milestones</h3> Table: Month | Milestone | Savings Total (6 rows)

Close with 2-sentence encouragement + disclaimer to consult a CFP/conseiller financier in QC.`;

  // ── Streaming response ──
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Accel-Buffering", "no"); // disable Nginx buffering
  res.setHeader("Cache-Control", "no-cache");

  try {
    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta?.type === "text_delta"
      ) {
        res.write(chunk.delta.text);
      }
    }

    res.end();
  } catch (err) {
    console.error("Anthropic stream error:", err);
    // If headers already sent, we can only end the stream
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Stream failed" });
    } else {
      res.end();
    }
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
    responseLimit: false, // no limit on streaming response
  },
};
