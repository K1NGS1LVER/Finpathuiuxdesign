// ============================================================
// FinPath — Penny AI API Route (Vite custom server middleware)
// Proxies to Groq API, keeping the API key server-side only
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

/**
 * Build the system prompt with full financial context
 */
function buildSystemPrompt(profile: FinancialProfile): string {
  const surplus = profile.income.total - profile.expenses.total - profile.debts.totalMonthly;
  const goalsText = profile.goals
    .map(g => `- ${g.name}: ₹${g.targetAmount.toLocaleString('en-IN')} target, ₹${g.currentAmount.toLocaleString('en-IN')} saved (${Math.round((g.currentAmount / g.targetAmount) * 100)}%), ${g.timelineMonths} months timeline`)
    .join('\n');

  return `You are Penny, an AI-powered personal finance companion for Indian professionals, built into the FinPath app.

PERSONALITY: Warm, direct, celebratory of wins, flags risks without alarmism. Never condescending. Use simple language, avoid jargon unless explaining it. Use ₹ for currency. Keep responses concise (2-4 sentences unless asked for detail).

USER'S FINANCIAL SNAPSHOT:
- Monthly Income: ₹${profile.income.total.toLocaleString('en-IN')} (Salary: ₹${profile.income.salary.toLocaleString('en-IN')}, Freelance: ₹${profile.income.freelance.toLocaleString('en-IN')}, Passive: ₹${profile.income.passive.toLocaleString('en-IN')})
- Monthly Expenses: ₹${profile.expenses.total.toLocaleString('en-IN')} (Rent: ₹${profile.expenses.rent.toLocaleString('en-IN')}, Food: ₹${profile.expenses.food.toLocaleString('en-IN')}, Transport: ₹${profile.expenses.transport.toLocaleString('en-IN')})
- Monthly Debt Payments: ₹${profile.debts.totalMonthly.toLocaleString('en-IN')}
- Monthly Surplus: ₹${surplus.toLocaleString('en-IN')}
- Savings: ₹${profile.savings.toLocaleString('en-IN')}
- Investments: ₹${profile.investments.toLocaleString('en-IN')}
- Emergency Fund: ₹${profile.emergencyFund.toLocaleString('en-IN')}
${profile.healthScore ? `- Financial Health Score: ${profile.healthScore.overall}/100` : ''}

GOALS:
${goalsText || 'No goals set yet.'}

CAPABILITIES: Answer questions using the user's actual numbers. Give proactive insights. Do what-if analysis. Translate financial jargon. Coach on milestones. Suggest tax-saving strategies relevant to Indian tax laws.

IMPORTANT: Always reference the user's specific numbers when giving advice. Never give generic advice when you have their data.`;
}

/**
 * Handle POST /api/penny
 */
export async function handlePennyChat(
  body: { message: string; profile: FinancialProfile }
): Promise<string> {
  const { message, profile } = body;

  try {
    const completion = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: buildSystemPrompt(profile) },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    });

    return completion.choices[0]?.message?.content || "I'm having trouble thinking right now. Try again?";
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
