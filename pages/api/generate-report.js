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

  const prompt = `You are a senior Canadian financial advisor specializing in credit optimization, debt reduction, and wealth building for Canadians. Generate a comprehensive, highly personalized financial report in HTML format (no doctype/html/body tags — inner HTML only, with inline styles).

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

Use this color palette for callout boxes:
- Key insight: <div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;">
- Warning/Risk: <div style="background:#fef2f0;border-left:4px solid #c0392b;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;">
- Positive/Good: <div style="background:#f0faf5;border-left:4px solid #1a7a4a;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;">

Use <table style="width:100%;border-collapse:collapse;font-size:14px;margin:14px 0"> for data tables.
Use <th style="background:#0a1628;color:#fff;padding:10px 14px;text-align:left"> for headers.
Use <td style="padding:9px 14px;border-bottom:1px solid #eee"> for cells.

SECTIONS:

<h2>📊 A. Financial Snapshot & Credit Profile</h2>
Income vs expenses summary table. Monthly surplus. Per-card utilization table with risk rating (Good <10%, Moderate 10-30%, High >30%). Overall utilization impact on credit score. Net worth snapshot.

<h2>📅 B. Optimal Payment Strategy</h2>
For each card: exact amount to pay BEFORE statement closes (to lower reported utilization to under 10%), and exact amount to pay by due date. Specific calendar dates using their closing/due day numbers. PIF (Pay-In-Full) vs minimum strategy impact.

<h2>⚡ C. Debt Elimination Plan</h2>
Avalanche method (highest interest first) vs Snowball (lowest balance first) with actual payoff timelines and total interest saved for this specific client. Recommended method with justification. Month-by-month projection for first 6 months.

<h2>🎁 D. Rewards & Card Optimization</h2>
Table showing which card to use for each spend category (groceries, restaurants, gas, travel, online purchases, recurring bills) and why. Estimated annual rewards value in dollars. Flag any card not justifying its annual fee.

<h2>🇨🇦 E. Top Canadian Card Recommendations</h2>
2-3 specific cards available in Canada that would benefit this person (e.g. Scotia Momentum Visa Infinite, TD Aeroplan Visa Infinite, Amex Cobalt, Tangerine Money-Back, Rogers World Elite Mastercard, CIBC Dividend Visa Infinite, etc.). Real card names, real benefits, real estimated annual value. Explain why each fits this profile.

<h2>🏦 F. Savings & Emergency Fund Plan</h2>
Target emergency fund = 3–6 months of their actual expenses ($${totalExp} × 3 = $${(totalExp*3).toFixed(0)} minimum, $${(totalExp*6).toFixed(0)} ideal). Current gap. Monthly savings recommendation. TFSA vs RRSP strategy specific to province ${basic.province}. Projected timeline to reach targets.

<h2>🎯 G. Goal Strategy</h2>
Tailored roadmap for: ${goals.primary || "their stated goal"}. Milestones with specific dollar amounts and dates. Key risks. How to protect the goal.

<h2>✅ H. Action Plan</h2>
<h3 style="color:#0a1628;margin:18px 0 10px">⚡ This Week (Days 1–7)</h3>
3-5 concrete, specific actions with exact amounts.
<h3 style="color:#0a1628;margin:18px 0 10px">📅 This Month (Days 8–30)</h3>
3-5 actions with exact steps.
<h3 style="color:#0a1628;margin:18px 0 10px">🔄 Next 90 Days</h3>
3-5 strategic moves.
<h3 style="color:#0a1628;margin:18px 0 10px">📈 Next 12 Months</h3>
3-5 long-term milestones with target dates.

End with a brief encouraging closing paragraph referencing their specific goal and situation.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const reportHtml = message.content[0].text;
    return res.status(200).json({ report: reportHtml });
  } catch (err) {
    console.error("Anthropic error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate report" });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" }, responseLimit: "8mb" }
};
