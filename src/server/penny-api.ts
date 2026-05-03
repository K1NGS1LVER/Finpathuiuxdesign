// ============================================================
// FinPath — Penny AI API Route (Vite custom server middleware)
// Proxies to Groq API, keeping the API key server-side only
// Features: anonymized data, rate limiting, response caching
// ============================================================

import Groq from 'groq-sdk';
import type { FinancialProfile } from '../lib/types';
import type { Connect } from 'vite';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[Penny API] GROQ_API_KEY is not set in environment!');
    }
    groqClient = new Groq({ apiKey: apiKey || '' });
  }
  return groqClient;
}

// ── Rate Limiting ──────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15;       // max requests
const RATE_LIMIT_WINDOW = 60000; // per 60 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ── Response Caching ───────────────────────────────────────────
const responseCache = new Map<string, { reply: string; cachedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(message: string, profile: FinancialProfile): string {
  // Hash based on message + key financial numbers (not PII)
  const financialKey = `${profile.income.total}-${profile.expenses.total}-${profile.debts.totalMonthly}-${profile.savings}-${profile.goals.length}`;
  return `${message.trim().toLowerCase().slice(0, 200)}|${financialKey}`;
}

/**
 * Anonymize financial profile — strip any potentially identifying data
 * Only send aggregate numbers and goal names, never personal details
 */
function anonymizeProfile(profile: FinancialProfile) {
  return {
    income: {
      salary: profile.income.salary,
      freelance: profile.income.freelance,
      passive: profile.income.passive,
      total: profile.income.total,
    },
    expenses: {
      rent: profile.expenses.rent,
      food: profile.expenses.food,
      transport: profile.expenses.transport,
      utilities: profile.expenses.utilities,
      entertainment: profile.expenses.entertainment,
      other: profile.expenses.other,
      total: profile.expenses.total,
    },
    debts: {
      totalMonthly: profile.debts.totalMonthly,
      itemCount: profile.debts.items?.length ?? 0,
    },
    savings: profile.savings,
    investments: profile.investments,
    emergencyFund: profile.emergencyFund,
    goals: (profile.goals || []).map(g => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      timelineMonths: g.timelineMonths,
      priority: g.priority,
      status: g.status,
      category: g.category,
    })),
    healthScore: profile.healthScore ? {
      overall: profile.healthScore.overall,
      incomeStability: profile.healthScore.incomeStability,
      debtLoad: profile.healthScore.debtLoad,
      savingsRate: profile.healthScore.savingsRate,
      emergencyFund: profile.healthScore.emergencyFund,
    } : null,
    monthlySurplusReserve: (profile as any).monthlySurplusReserve ?? 0,
    strategy: (profile as any).strategy ?? 'avalanche',
  };
}

/**
 * Build the system prompt with anonymized financial context
 */
function buildSystemPrompt(profile: FinancialProfile): string {
  const anon = anonymizeProfile(profile);
  const surplus = anon.income.total - anon.expenses.total - anon.debts.totalMonthly;
  const goalsText = anon.goals
    .map(g => `- ${g.name}: Target ₹${g.targetAmount.toLocaleString('en-IN')}, Saved ₹${g.currentAmount.toLocaleString('en-IN')} (${g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0}%), ${g.timelineMonths}mo timeline, Priority ${g.priority}`)
    .join('\n');

  return `You are Penny, an AI personal finance companion for Indian professionals in the FinPath app.

PERSONALITY: Warm, direct, celebratory of wins, flags risks without alarmism. Never condescending. Use simple everyday language — avoid financial jargon unless you explain it immediately. Use ₹ for currency. Keep responses concise (3-5 sentences unless asked for detail). Structure advice as clear action steps.

BOUNDARIES: Only answer finance-related questions. If the user asks a non-financial question, politely redirect: "I'm best with money questions! Try asking me about your budget, goals, or savings strategy."

If the user has no financial data yet, encourage them to complete onboarding first.

USER'S ANONYMOUS FINANCIAL SNAPSHOT:
- Monthly Income: ₹${anon.income.total.toLocaleString('en-IN')} (Salary: ₹${anon.income.salary.toLocaleString('en-IN')}, Freelance: ₹${anon.income.freelance.toLocaleString('en-IN')}, Passive: ₹${anon.income.passive.toLocaleString('en-IN')})
- Monthly Expenses: ₹${anon.expenses.total.toLocaleString('en-IN')} (Rent: ₹${anon.expenses.rent.toLocaleString('en-IN')}, Food: ₹${anon.expenses.food.toLocaleString('en-IN')}, Transport: ₹${anon.expenses.transport.toLocaleString('en-IN')}, Utilities: ₹${anon.expenses.utilities.toLocaleString('en-IN')}, Fun: ₹${anon.expenses.entertainment.toLocaleString('en-IN')}, Other: ₹${anon.expenses.other.toLocaleString('en-IN')})
- Monthly Debt Payments: ₹${anon.debts.totalMonthly.toLocaleString('en-IN')} (${anon.debts.itemCount} items)
- Monthly Surplus: ₹${surplus.toLocaleString('en-IN')}
- Surplus Reserve: ₹${anon.monthlySurplusReserve.toLocaleString('en-IN')}/mo (set aside, not for goals)
- Strategy: ${anon.strategy}
- Savings: ₹${anon.savings.toLocaleString('en-IN')}
- Investments: ₹${anon.investments.toLocaleString('en-IN')}
- Emergency Fund: ₹${anon.emergencyFund.toLocaleString('en-IN')}
${anon.healthScore ? `- Health Score: ${anon.healthScore.overall}/100 (Income Stability: ${anon.healthScore.incomeStability}/25, Debt Load: ${anon.healthScore.debtLoad}/25, Savings Rate: ${anon.healthScore.savingsRate}/25, Emergency Fund: ${anon.healthScore.emergencyFund}/25)` : ''}

GOALS:
${goalsText || 'No goals set yet.'}

RULES:
1. ALWAYS reference the user's specific numbers — never give generic advice.
2. Give actionable next-steps, not vague suggestions. e.g. "Move ₹5,000 from entertainment to your Emergency Fund goal this month."
3. When discussing affordability, calculate using their actual surplus and timeline.
4. For tax questions, use Indian tax law (Section 80C, 80D, HRA, NPS etc).
5. If asked about strategy, explain avalanche vs snowball in plain language.`;
}

/**
 * Handle POST /api/penny
 */
export async function handlePennyChat(
  body: { message: string; profile: FinancialProfile; context?: string }
): Promise<string> {
  const { message, profile, context } = body;

  // Check cache first
  const cacheKey = getCacheKey(message, profile);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return cached.reply;
  }

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [
      { role: 'system', content: buildSystemPrompt(profile) },
    ];

    // Add page context if provided
    if (context) {
      messages.push({ role: 'user', content: `[Context: The user is currently on the ${context} page of the app.]` });
    }

    messages.push({ role: 'user', content: message });

    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    });

    const reply = completion.choices[0]?.message?.content || "I'm having trouble thinking right now. Try again?";

    // Cache the response
    responseCache.set(cacheKey, { reply, cachedAt: Date.now() });

    // Clean old cache entries periodically
    if (responseCache.size > 100) {
      const now = Date.now();
      for (const [key, val] of responseCache) {
        if (now - val.cachedAt > CACHE_TTL) responseCache.delete(key);
      }
    }

    return reply;
  } catch (error: any) {
    console.error('Groq API error:', error);
    throw new Error(error.message || 'Failed to get response from Penny');
  }
}

/**
 * Vite server middleware plugin for /api/penny
 */
export function pennyApiPlugin() {
  return {
    name: 'penny-api',
    configureServer(server: any) {
      server.middlewares.use('/api/penny', async (req: Connect.IncomingMessage, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Rate limiting by IP
        const ip = (req as any).socket?.remoteAddress || 'unknown';
        if (!checkRateLimit(ip)) {
          res.statusCode = 429;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Too many requests. Please wait a moment before asking again.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            
            if (!parsed.message || typeof parsed.message !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Message is required' }));
              return;
            }

            const reply = await handlePennyChat(parsed);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ reply }));
          } catch (err: any) {
            console.error('[Penny API] Error:', err?.message || err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
        });
      });
    },
  };
}
