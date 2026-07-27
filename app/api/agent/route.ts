import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { MODE_PROMPTS, CHAT_SYSTEM_PROMPT } from '@/lib/prompts';
import { checkRateLimit } from '@/lib/rate-limit';

const VALID_MODES = ['chat', 'translate', 'expand-sentence', 'grammar-explain', 'plan', 'speaking-coach', 'essay-correct'];
const MAX_MESSAGE_LENGTH = 50000;
const MAX_MESSAGES = 30;

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    let body: any;
    try { body = await req.json(); } catch { return Response.json({ error: '请求格式无效' }, { status: 400 }); }
    const { messages = [], mode = 'chat', apiKey } = body;

    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1';
    const { allowed, remaining } = checkRateLimit(ip, apiKey);
    if (!allowed) return Response.json({ error: '请求太频繁了，喝口水休息几秒再试吧~' }, { status: 429 });

    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) return Response.json({ error: '请先设置 DeepSeek API 密钥' }, { status: 401 });
    if (!apiKey.startsWith('sk-')) return Response.json({ error: 'API 密钥格式无效' }, { status: 401 });
    if (!VALID_MODES.includes(mode)) return Response.json({ error: '无效的模式' }, { status: 400 });
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) return Response.json({ error: '消息格式无效' }, { status: 400 });
    for (const m of messages) {
      if (!m.role || !m.content || typeof m.content !== 'string' || m.content.length > MAX_MESSAGE_LENGTH)
        return Response.json({ error: '消息内容格式无效' }, { status: 400 });
    }

    const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' });
    const systemPrompt = MODE_PROMPTS[mode] || CHAT_SYSTEM_PROMPT;
    const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];
    for (const m of messages.slice(-10)) {
      if (m.role === 'user' || m.role === 'assistant') formattedMessages.push({ role: m.role, content: m.content });
    }

    const stream = await client.chat.completions.create({
      model: 'deepseek-v4-flash', messages: formattedMessages as any, max_tokens: 2048, temperature: 0.7, stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = (chunk.choices[0]?.delta as any)?.content;
            if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Request-Id': requestId, 'X-RateLimit-Remaining': String(remaining) },
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error.message);
    const isKeyError = error?.message?.includes('401') || error?.message?.includes('Unauthorized') || error?.message?.includes('key');
    return Response.json({ error: isKeyError ? 'API 密钥无效，请检查是否正确' : 'AI 服务暂时不可用，请稍后重试' }, { status: 500, headers: { 'X-Request-Id': requestId } });
  }
}
