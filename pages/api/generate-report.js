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

Write the full report using these HTML sections. Every number must reference actual client data. Be specific, warm, direct, and professional.

Use this color palette for callout boxes (ALWAYS include color:#2a2a3e on every box):
- Key insight: <div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;color:#2a2a3e;">
- Warning/Risk: <div style="background:#fef2f0;border-left:4px solid #c0392b;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;color:#2a2a3e;">
- Positive/Good: <div style="background:#f0faf5;border-left:4px solid #1a7a4a;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;color:#2a2a3e;">

CRITICAL: Every <td>, <p>, <li>, <div>, and <span> that contains text MUST have explicit color:#2a2a3e. Never rely on inherited color. Tables: <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0">, headers: <th style="background:#0a1628;color:#fff;padding:10px 14px;text-align:left">, cells: <td style="padding:9px 14px;border-bottom:1px solid #eee;color:#2a2a3e">.

SECTIONS:

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">📋 Executive Summary</h2>
3-4 sentence narrative: overall financial health, biggest strength, biggest gap, and whether their primary goal is achievable in timeline (with the key number). End with status verdict line (e.g. "🟢 Healthy with optimization opportunities").

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">📊 A. Financial Snapshot & Credit Profile</h2>
Income vs expenses summary table. Monthly surplus shown explicitly. Per-card utilization table with risk rating. Overall utilization impact on credit score. Net worth snapshot. 2-3 score strengths and 2-3 areas of attention. Realistic 12-month score target and exact conditions to reach it.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">📅 B. Optimal Payment Strategy</h2>
Explain credit bureaus report balance at statement closing. Day-by-day payment calendar using their actual closing/due day numbers per card. Two-payment-per-card system in a table. Calculate monthly interest avoided by paying in full (balance × APR ÷ 12 per card, annual total). One advanced tactic.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">⚡ C. Debt Elimination Plan</h2>
Each debt with monthly interest cost. If debt is small vs surplus, give one-month payoff plan with exact distribution. Avalanche vs snowball comparison with real numbers and winner. Month-by-month 6-month projection table. Total interest saved vs minimums. Post-payoff operating rule.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">🎁 D. Rewards & Card Optimization</h2>
Each card's real reward structure. Table: spend category → optimal card → points/cashback earned per year → dollar value. Total annual rewards value. Fees vs benefits table per card with keep/cancel/downgrade verdict and ROI.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">🇨🇦 E. New Card Recommendations</h2>
Should they open a new card now? (factor hard-inquiry impact). Then 2-3 specific real Canadian cards with real benefits, fees, estimated annual value for THIS person's spending. Clear personal recommendation.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">🏦 F. Savings & Emergency Fund Plan</h2>
Current savings table. Emergency fund target (${monthlyExpTotal} × 3 = $${(monthlyExpTotal*3).toFixed(0)} min, × 6 = $${(monthlyExpTotal*6).toFixed(0)} ideal) with exact gap. Monthly surplus allocation table with 12-month totals. TFSA vs RRSP for ${basic.province}. 3-4 real Canadian HISA options with rates. Interest earned estimate.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">💸 G. Spending Analysis</h2>
Table: category | amount | % income | QC/Canada benchmark | status flag. Top 1-2 optimization opportunities with annual savings quantified and tied to their goal acceleration.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">🎯 H. Goal Strategy</h2>
Roadmap for: ${goals.primary || "their stated goal"} (timeline: ${goals.timeline || "unspecified"}, target: ${goals.amount ? "$"+goals.amount : "unspecified"}). Math proving achievability. Milestones with dollar amounts and target months. Key risks and mitigations.

<h2 style="font-family:Georgia,serif;color:#0a1628;font-size:20px;margin:32px 0 14px;padding-top:24px;border-top:1px solid #ece5d8">✅ I. Action Plan</h2>
<h3 style="color:#0a1628;margin:18px 0 10px;font-size:16px">⚡ This Week (Days 1–7)</h3>
Table with 4-6 actions, exact amounts, estimated time.
<h3 style="color:#0a1628;margin:18px 0 10px;font-size:16px">📅 This Month (Days 8–30)</h3>
4-6 actions with exact steps.
<h3 style="color:#0a1628;margin:18px 0 10px;font-size:16px">🔄 Next 90 Days</h3>
4-6 strategic moves with running savings totals.
<h3 style="color:#0a1628;margin:18px 0 10px;font-size:16px">📈 Next 12 Months</h3>
Month-by-month milestone table ending at goal. Projected end-state snapshot (savings, debt, score).

End with an encouraging closing paragraph and a one-line disclaimer to consult a licensed CFP / conseiller financier in QC for complex decisions.`;

  // ── Streaming response ──
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("X-Accel-Buffering", "no"); // disable Nginx buffering
  res.setHeader("Cache-Control", "no-cache");

  try {
    const client = new Anthropic({ apiKey });

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
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
