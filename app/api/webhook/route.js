import { sendMessage } from '../../../lib/telegram.js';
import { askMunji, runProjectPipeline } from '../../../lib/agent-pipeline.js';
import { getTeamStatus } from '../../../lib/team-state.js';

export const maxDuration = 300; // 최대 5분 (파이프라인용)

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message?.text) {
      return Response.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    if (chatId !== process.env.TELEGRAM_CHAT_ID) {
      return Response.json({ ok: true });
    }

    const userText = message.text.trim();

    // ===== 명령어 처리 =====

    if (userText === '/start') {
      await sendMessage(
        '🔥 <b>먼지 팀장입니다!</b>\n\n' +
        '겨울햇살팀 AI 에이전트 시스템이 활성화되었습니다.\n\n' +
        '<b>📌 명령어:</b>\n' +
        '/project [설명] - 프로젝트 실행\n' +
        '  → 예: /project TODO 리스트 앱 만들어줘\n' +
        '  → 팀원들이 순차적으로 기획→개발→QA 진행\n\n' +
        '/status - 팀 현황\n' +
        '/help - 도움말\n\n' +
        '또는 자유롭게 메시지 주시면 됩니다! 🫡'
      );
      return Response.json({ ok: true });
    }

    if (userText === '/status') {
      const status = getTeamStatus();
      await sendMessage(
        `🔥 <b>[겨울햇살팀 현황]</b>\n\n${status}\n\n팀원들 대기 중입니다. 프로젝트를 던져주세요! 🫡`
      );
      return Response.json({ ok: true });
    }

    if (userText === '/help') {
      await sendMessage(
        '🔥 <b>[먼지 팀장 - 사용법]</b>\n\n' +
        '<b>1. 프로젝트 실행</b>\n' +
        '/project [원하는 것 설명]\n' +
        '→ 팀원들이 자동으로 기획→개발→테스트\n' +
        '→ 각 단계별 텔레그램 보고\n\n' +
        '예시:\n' +
        '• /project TODO 리스트 웹앱\n' +
        '• /project 회사 소개 랜딩페이지\n' +
        '• /project 식단 관리 앱 기획서만\n\n' +
        '<b>2. 자유 대화</b>\n' +
        '그냥 메시지 보내면 먼지가 응답합니다.\n\n' +
        '<b>3. 명령어</b>\n' +
        '/status - 팀 현황\n' +
        '/help - 이 도움말'
      );
      return Response.json({ ok: true });
    }

    // ===== /project → 파이프라인 실행 =====
    if (userText.startsWith('/project')) {
      const projectDesc = userText.replace(/^\/project\s*/, '').trim();

      if (!projectDesc) {
        await sendMessage(
          '🔥 프로젝트 설명을 함께 입력해 주세요!\n\n' +
          '예: /project TODO 리스트 앱 만들어줘'
        );
        return Response.json({ ok: true });
      }

      await runProjectPipeline(projectDesc);
      return Response.json({ ok: true });
    }

    // ===== 자연어 프로젝트 감지 =====
    const projectKeywords = ['만들어줘', '만들어 줘', '개발해줘', '개발해 줘', '기획해줘', '기획해 줘', '구현해줘', '구현해 줘'];
    const isProjectRequest = projectKeywords.some(kw => userText.includes(kw));

    if (isProjectRequest) {
      await runProjectPipeline(userText);
      return Response.json({ ok: true });
    }

    // ===== 일반 대화 =====
    const teamStatus = getTeamStatus();
    const reply = await askMunji(userText, teamStatus);

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
    try {
      await sendMessage(`🔥 오류 발생: ${error.message?.substring(0, 200)}`);
    } catch (e) {}
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    status: 'Munji bot v2 - Agent Pipeline 🔥',
    commands: ['/project', '/status', '/help'],
  });
}
