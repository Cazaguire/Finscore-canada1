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

Use this color palette for callout boxes (ALWAYS include the text color so it stays readable on light backgrounds):
- Key insight: <div style="background:#fef9ec;border-left:4px solid #c9a84c;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;color:#2a2a3e;">
- Warning/Risk: <div style="background:#fef2f0;border-left:4px solid #c0392b;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;color:#2a2a3e;">
- Positive/Good: <div style="background:#f0faf5;border-left:4px solid #1a7a4a;padding:14px 18px;border-radius:0 10px 10px 0;margin:14px 0;font-size:14px;color:#2a2a3e;">

CRITICAL: Every <td>, <p>, <li>, <div>, and <span> that contains text MUST have an explicit dark color (color:#2a2a3e or color:#0a1628). Never rely on inherited color — text without an explicit color will be invisible. For table data cells use <td style="padding:9px 14px;border-bottom:1px solid #eee;color:#2a2a3e">.

SECTIONS:

<h2>📋 Executive Summary</h2>
A 3-4 sentence narrative summary of this person's overall financial health, their single biggest strength, their single biggest gap/opportunity, and whether their primary goal is achievable in their timeline (with the key number that proves it). End with a one-line status verdict (e.g. "🟢 Healthy with optimization opportunities").

<h2>📊 A. Financial Snapshot & Credit Profile</h2>
Income vs expenses summary table. Monthly surplus calculation shown explicitly. Per-card utilization table with risk rating (Good <10%, Moderate 10-30%, High >30%). Overall utilization and its specific impact on their credit score (cite that utilization is one of the largest scoring factors in Equifax/TransUnion). Net worth snapshot table. Identify 2-3 score-driving strengths and 2-3 areas of attention. State a realistic score target for 12 months and the exact conditions to reach it.

<h2>📅 B. Optimal Payment Strategy</h2>
Explain the key principle: credit bureaus report the balance at STATEMENT CLOSING, not at payment — so paying before the closing date lowers reported utilization. Build a day-by-day payment calendar using their actual closing and due day numbers for each card. Recommend a two-payment-per-card system (pre-statement payment + pre-due-date payment) in a table. Calculate the monthly interest cost they avoid by paying in full (balance × APR ÷ 12 per card, summed to an annual figure). Include one advanced tactic.

<h2>⚡ C. Debt Elimination Plan</h2>
Show each debt with its monthly interest cost (balance × APR ÷ 12). If total debt is small relative to surplus, say so directly and give a one-month payoff plan with exact distribution — don't force an avalanche/snowball framework where it isn't needed, but still SHOW the avalanche vs snowball comparison with their real numbers and name the winner. Provide a month-by-month projection table for the first 6 months. State total interest saved vs making minimum payments. End with a post-payoff operating rule.

<h2>🎁 D. Rewards & Card Optimization</h2>
Analyze each of their actual cards individually with its real reward structure (research the real earn rates for named cards like Amex Cobalt = 5x eats/groceries, etc.). Build a table mapping each spend category (groceries, restaurants, gas, travel, online, recurring bills) to the optimal card AND the points/cashback earned per year in that category with dollar value. Calculate total annual rewards value. Build a "fees vs benefits" table for every card with a keep/cancel/downgrade verdict and ROI. Add one strategic tip relevant to their goal.

<h2>🇨🇦 E. New Card Recommendations</h2>
First state clearly whether they should open a new card now given their situation and goal timeline (factor in hard-inquiry score impact). Then give 2-3 specific real Canadian cards (e.g. Scotia Momentum Visa Infinite, TD Aeroplan Visa Infinite, Rogers Red World Elite, Tangerine Money-Back, Scotia Passport Visa Infinite, CIBC Dividend Visa Infinite) with real benefits, fees, and estimated annual value FOR THIS PERSON'S spending — but frame as "for the 12-18 month horizon" if opening now isn't advised. Give a clear personal recommendation.

<h2>🏦 F. Savings & Emergency Fund Plan</h2>
Lay out current savings by account in a table. Calculate emergency fund target = 3-6 months of their actual expenses ($${monthlyExpTotal} × 3 = $${(monthlyExpTotal*3).toFixed(0)} minimum, × 6 = $${(monthlyExpTotal*6).toFixed(0)} ideal) and show the exact GAP. Propose a specific monthly allocation of their surplus split across emergency fund / goal fund / buffer in a table with 12-month totals. Recommend TFSA vs RRSP specific to ${basic.province} (note QC provincial tax treatment). Suggest 3-4 real Canadian high-interest savings/TFSA options with current approximate rates (EQ Bank, Wealthsimple Cash, Tangerine, their own bank). Show interest earned estimate.

<h2>💸 G. Spending Analysis & Optimization</h2>
Build a table: each expense category, their dollar amount, % of income, a typical Canadian/${basic.province} benchmark range, and a status flag (🟢 good / 🟡 review / 🔴 high). Identify the 1-2 categories with the biggest optimization opportunity and quantify the annual savings of trimming them (e.g. "reducing restaurants from $X to $Y saves $Z/year"). Tie the savings back to accelerating their primary goal.

<h2>🎯 H. Goal Strategy</h2>
Tailored roadmap for their primary goal: ${goals.primary || "their stated goal"} (timeline: ${goals.timeline || "unspecified"}, target: ${goals.amount ? "$"+goals.amount : "unspecified"}). Show the math proving whether the goal is achievable in the timeline given their surplus. Milestones with specific dollar amounts and target months. Key risks and how to protect the goal.

<h2>✅ I. Action Plan</h2>
<h3 style="color:#0a1628;margin:18px 0 10px">⚡ This Week (Days 1–7)</h3>
4-6 concrete actions in a table with exact amounts and estimated time per task.
<h3 style="color:#0a1628;margin:18px 0 10px">📅 This Month (Days 8–30)</h3>
4-6 actions with exact steps.
<h3 style="color:#0a1628;margin:18px 0 10px">🔄 Next 90 Days</h3>
4-6 strategic moves with running savings totals.
<h3 style="color:#0a1628;margin:18px 0 10px">📈 Next 12 Months</h3>
A month-by-month milestone table ending at their goal, plus a projected end-state snapshot (savings, debt, score).

End with a brief encouraging closing paragraph referencing their specific goal and situation, and a one-line disclaimer that this is educational and they should consult a licensed advisor (CFP / conseiller financier in QC) for complex tax/legal/investment decisions.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
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
