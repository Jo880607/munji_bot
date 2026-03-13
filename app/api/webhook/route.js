import { sendMessage } from '../../../lib/telegram.js';
import { askMunji, runProjectPipeline, runAgent, AGENTS } from '../../../lib/agent-pipeline.js';
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
      await sendMessage(
        '🔥 <b>먼지 팀장입니다!</b>\n\n' +
        '겨울햇살팀 AI 에이전트 시스템 활성화!\n\n' +
        '<b>📌 명령어:</b>\n' +
        '/project [설명] - 프로젝트 실행 (전체 팀 가동)\n' +
        '/status - 팀 현황\n' +
        '/help - 도움말\n\n' +
        '<b>📌 팀원 직접 호출:</b>\n' +
        '@치치 [질문] - 마케팅 관련\n' +
        '@멍뭉 [질문] - 기획 관련\n' +
        '@유키 [질문] - 백엔드 관련\n' +
        '@푸딩 [질문] - 프론트 관련\n' +
        '@코코 [질문] - QA 관련\n\n' +
        '자유롭게 메시지 주시면 먼지가 응답합니다! 🫡'
      );
      return Response.json({ ok: true });
    }

    if (userText === '/status') {
      const status = getTeamStatus();
      await sendMessage(`🔥 <b>[겨울햇살팀 현황]</b>\n\n${status}\n\n프로젝트를 던져주세요! 🫡`);
      return Response.json({ ok: true });
    }

    if (userText === '/help') {
      await sendMessage(
        '🔥 <b>[사용법]</b>\n\n' +
        '<b>1. 프로젝트 실행 (전체 팀)</b>\n' +
        '/project [설명]\n\n' +
        '<b>2. 팀원 직접 호출</b>\n' +
        '@치치 이 게임 마케팅 어떻게 하면 좋을까?\n' +
        '@유키 이 API 구조 검토해줘\n' +
        '@멍뭉 이 아이디어 기획서로 정리해줘\n' +
        '@푸딩 이 UI 개선점 알려줘\n' +
        '@코코 이 코드 리뷰해줘\n\n' +
        '<b>3. 자유 대화</b>\n' +
        '먼지에게 일반 질문/지시'
      );
      return Response.json({ ok: true });
    }

    // ===== /project → 파이프라인 =====
    if (userText.startsWith('/project')) {
      const desc = userText.replace(/^\/project\s*/, '').trim();
      if (!desc) { await sendMessage('🔥 예: /project TODO 리스트 앱 만들어줘'); return Response.json({ ok: true }); }
      await runProjectPipeline(desc);
      return Response.json({ ok: true });
    }

    // ===== @팀원 → 개별 호출 =====
    const memberMap = {
      '@치치': 'chichi', '@chichi': 'chichi',
      '@멍뭉': 'mungmung', '@mungmung': 'mungmung',
      '@유키': 'yuki', '@yuki': 'yuki',
      '@푸딩': 'pudding', '@pudding': 'pudding',
      '@코코': 'coco', '@coco': 'coco',
    };

    for (const [prefix, agentId] of Object.entries(memberMap)) {
      if (userText.startsWith(prefix)) {
        const question = userText.replace(prefix, '').trim();
        if (!question) {
          await sendMessage(`${AGENTS[agentId].emoji} ${AGENTS[agentId].name}에게 질문을 함께 입력해 주세요!`);
          return Response.json({ ok: true });
        }
        const agent = AGENTS[agentId];
        await sendMessage(`${agent.emoji} <b>${agent.name}</b>에게 전달합니다... ⏳`);
        const reply = await runAgent(agentId, question);
        if (reply.length > 4000) {
          const chunks = reply.match(/[\s\S]{1,4000}/g) || [reply];
          for (const chunk of chunks) await sendMessage(`${agent.emoji} <b>[${agent.name}]</b>\n\n${chunk}`);
        } else {
          await sendMessage(`${agent.emoji} <b>[${agent.name}]</b>\n\n${reply}`);
        }
        return Response.json({ ok: true });
      }
    }

    // ===== "만들어줘" 등 → 프로젝트 (명확한 경우만) =====
    const projectPatterns = [
      /(.+)(앱|사이트|페이지|시스템|서비스)\s*(만들어|개발해|구현해|빌드해)/,
      /^\/project/,
    ];
    const isProject = projectPatterns.some(p => p.test(userText));

    if (isProject) {
      await runProjectPipeline(userText);
      return Response.json({ ok: true });
    }

    // ===== 일반 대화 → 먼지 =====
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
  return Response.json({ status: 'Munji bot v3 🔥', commands: ['/project', '/status', '/help', '@팀원'] });
}
```
