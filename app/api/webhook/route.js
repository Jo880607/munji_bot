import { sendMessage } from '../../../lib/telegram.js';
import { askMunji, runProjectPipeline } from '../../../lib/agent-pipeline.js';
import { getTeamStatus } from '../../../lib/team-state.js';

export const maxDuration = 300;

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message;
    if (!message?.text) return Response.json({ ok: true });

    const chatId = String(message.chat.id);
    if (chatId !== process.env.TELEGRAM_CHAT_ID) return Response.json({ ok: true });

    const userText = message.text.trim();

    if (userText === '/start') {
      await sendMessage('🔥 <b>먼지 팀장입니다!</b>\n\n겨울햇살팀 AI 에이전트 시스템 활성화!\n\n/project [설명] - 프로젝트 실행\n/status - 팀 현황\n/help - 도움말');
      return Response.json({ ok: true });
    }
    if (userText === '/status') {
      const status = getTeamStatus();
      await sendMessage(`🔥 <b>[겨울햇살팀 현황]</b>\n\n${status}\n\n프로젝트를 던져주세요! 🫡`);
      return Response.json({ ok: true });
    }
    if (userText === '/help') {
      await sendMessage('🔥 <b>[사용법]</b>\n\n/project [설명] - 팀원 자동 가동\n예: /project TODO앱 만들어줘\n\n또는 "만들어줘" 포함 메시지도 자동 감지!');
      return Response.json({ ok: true });
    }

    if (userText.startsWith('/project')) {
      const desc = userText.replace(/^\/project\s*/, '').trim();
      if (!desc) { await sendMessage('🔥 예: /project TODO 리스트 앱 만들어줘'); return Response.json({ ok: true }); }
      await runProjectPipeline(desc);
      return Response.json({ ok: true });
    }

    const projectKeywords = ['만들어줘', '만들어 줘', '개발해줘', '개발해 줘', '기획해줘', '기획해 줘', '구현해줘', '구현해 줘'];
    if (projectKeywords.some(kw => userText.includes(kw))) {
      await runProjectPipeline(userText);
      return Response.json({ ok: true });
    }

    const teamStatus = getTeamStatus();
    const reply = await askMunji(userText, teamStatus);
    if (reply.length > 4000) {
      const chunks = reply.match(/[\s\S]{1,4000}/g) || [reply];
      for (const chunk of chunks) await sendMessage(chunk);
    } else {
      await sendMessage(reply);
    }
    return Response.json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    try { await sendMessage(`🔥 오류: ${error.message?.substring(0, 200)}`); } catch(e) {}
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'Munji bot v2 - Agent Pipeline 🔥' });
}
