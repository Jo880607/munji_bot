import { sendMessage } from '../../../lib/telegram';
import { askMunji } from '../../../lib/munji-ai';
import { getTeamStatus } from '../../../lib/team-state';

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message?.text) {
      return Response.json({ ok: true });
    }

    // 본인 chat_id만 처리
    const chatId = String(message.chat.id);
    if (chatId !== process.env.TELEGRAM_CHAT_ID) {
      return Response.json({ ok: true });
    }

    const userText = message.text.trim();

    // 특수 명령어 처리
    if (userText === '/start') {
      await sendMessage(
        '🔥 먼지 팀장입니다!\n\n' +
        '겨울햇살팀 텔레그램 채널이 활성화되었습니다.\n' +
        '대표님, 아무 때나 지시해 주세요. 팀원들 관리하고 있겠습니다. 🫡\n\n' +
        '<b>명령어:</b>\n' +
        '/status - 팀 현황 보기\n' +
        '/report - 즉시 보고 요청\n' +
        '그 외 자유롭게 메시지 주시면 됩니다.'
      );
      return Response.json({ ok: true });
    }

    if (userText === '/status') {
      const status = getTeamStatus();
      await sendMessage(
        `🔥 <b>[겨울햇살팀 현황]</b>\n\n${status}\n\n팀원들 상태 이상 없습니다. 🫡`
      );
      return Response.json({ ok: true });
    }

    if (userText === '/report') {
      const teamStatus = getTeamStatus();
      const report = await askMunji(
        '대표님이 즉시 보고를 요청하셨습니다. 현재 팀 상황을 종합 보고해 주세요.',
        teamStatus
      );
      await sendMessage(`🔥 <b>[먼지 팀장 - 즉시 보고]</b>\n\n${report}`);
      return Response.json({ ok: true });
    }

    // 일반 메시지 → AI 먼지가 응답
    const teamStatus = getTeamStatus();
    const reply = await askMunji(userText, teamStatus);

    // 텔레그램 메시지 길이 제한 (4096자)
    if (reply.length > 4000) {
      const chunks = reply.match(/[\s\S]{1,4000}/g) || [reply];
      for (const chunk of chunks) {
        await sendMessage(chunk);
      }
    } else {
      await sendMessage(reply);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'Munji bot webhook is running 🔥' });
}
