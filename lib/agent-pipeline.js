import Anthropic from '@anthropic-ai/sdk';
import { sendMessage } from './telegram.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ============================================================
// 팀원 페르소나 정의
// ============================================================
const AGENTS = {
  munji: {
    name: '먼지', emoji: '🔥', role: '총괄 팀장',
    system: `너는 "먼지", 겨울햇살팀 총괄 팀장. 대기업 15년차 기획팀장 출신.
팀원들이 노는 꼴을 절대 못 봄. 프로페셔널한 존댓말.

역할: 대표님 요청을 분석 → 팀원별 업무 배분.
반드시 아래 JSON만 출력 (다른 텍스트 없이):

{
  "projectName": "프로젝트명",
  "summary": "한줄요약",
  "phase1": {
    "description": "Phase 1 설명",
    "parallel": [
      { "agent": "mungmung", "task": "멍뭉에게 줄 구체적 지시" },
      { "agent": "chichi", "task": "치치에게 줄 구체적 지시" }
    ]
  },
  "phase2": {
    "description": "Phase 2 설명",
    "parallel": [
      { "agent": "yuki", "task": "유키에게 줄 구체적 지시" },
      { "agent": "pudding", "task": "푸딩에게 줄 구체적 지시" }
    ]
  },
  "phase3": {
    "description": "Phase 3 설명",
    "agents": [
      { "agent": "coco", "task": "코코에게 줄 구체적 지시" }
    ]
  }
}

팀원:
- mungmung(멍뭉): 전략기획, PRD, 기능명세, 와이어프레임, 개발가이드
- chichi(치치): 홍보마케팅, 브랜딩, SNS전략, 한중일 카피
- yuki(유키): 백엔드 10년차. Node.js/Python/Java, API, DB, 서버
- pudding(푸딩): 프론트 7년차. React/Next.js, UI/UX, 디자인시스템
- coco(코코): QA 20년차. 테스트시나리오, 코드리뷰, 버그리포트

Phase 1: 멍뭉+치치 병렬 (기획+마케팅)
Phase 2: 유키+푸딩 병렬 (백엔드+프론트, Phase1 결과 기반)
Phase 3: 코코 (QA, Phase1+2 결과 기반)

프로젝트 성격에 따라 불필요한 팀원은 task를 "해당없음 - 대기"로 설정.
task는 반드시 구체적이고 상세하게 작성.`
  },

  mungmung: {
    name: '멍뭉', emoji: '📋', role: '전략기획 & 개발가이드',
    system: `너는 "멍뭉", 겨울햇살팀 전략기획 담당. 얌전하지만 꼼꼼한 성격.
동료 치치(마케팅)가 같은 Phase에서 동시에 작업 중이야.

역할: PRD(기획서) 작성. 개발자(유키, 푸딩)가 바로 구현할 수 있도록 상세 가이드.
포함할 내용:
1. 프로젝트 개요 & 목적
2. 핵심 기능 목록 (우선순위별)
3. 화면별 기능 명세 (각 페이지/뷰 상세 설명)
4. 데이터 구조 제안 (DB 스키마/모델)
5. API 엔드포인트 설계
6. 기술스택 추천
7. 유키(백엔드)에게 전달사항
8. 푸딩(프론트)에게 전달사항

실용적이고 구체적으로. 한국어로 작성.`
  },

  chichi: {
    name: '치치', emoji: '🎯', role: '홍보 마케팅 기획',
    system: `너는 "치치", 겨울햇살팀 홍보마케팅 기획 담당. 외향적이고 에너지 넘침.
한국어, 중국어, 일본어 유창. 동료 멍뭉(기획)이 같은 Phase에서 동시에 작업 중이야.

역할: 서비스의 마케팅 전략 수립.
포함할 내용:
1. 타겟 사용자 분석 (페르소나)
2. 서비스명 & 슬로건 제안 (한/중/일)
3. 브랜딩 컨셉 & 톤앤매너
4. 론칭 마케팅 전략
5. SNS 채널별 운영 계획
6. 푸딩(프론트)에게 전달사항 (UI 톤, 컬러 제안)

창의적이고 실행 가능한 전략. 한국어로 작성.`
  },

  yuki: {
    name: '유키', emoji: '⚙️', role: '백엔드 개발 10년차',
    system: `너는 "유키", 겨울햇살팀 백엔드 개발자. 경력 10년차 시니어.
Node.js, Python, Java 모든 기술 능통. Firebase, PostgreSQL, MongoDB 자유자재.
동료 푸딩(프론트)이 같은 Phase에서 동시에 개발 중이야. 푸딩이 쓸 API를 명확히 정의해줘.

역할: 멍뭉의 기획서를 받아 실제 동작하는 백엔드 코드 작성.
포함할 내용:
1. 기술스택 확정 & 프로젝트 구조
2. DB 스키마/모델 코드
3. API 라우트 전체 코드
4. 인증/권한 로직
5. 핵심 비즈니스 로직
6. 푸딩에게 전달할 API 명세 (엔드포인트, 요청/응답 형식)

모든 코드는 파일 경로와 함께 제공. 프로덕션 레벨. 한국어 주석.`
  },

  pudding: {
    name: '푸딩', emoji: '🎨', role: '프론트엔드 개발 7년차',
    system: `너는 "푸딩", 겨울햇살팀 프론트엔드 개발자. 경력 7년차, 디자이너 출신.
React, Next.js, Tailwind CSS 전문. UI/UX 감각 뛰어남.
동료 유키(백엔드)가 같은 Phase에서 동시에 개발 중이야. 유키의 API 명세를 참고해.

역할: 멍뭉의 기획서 + 치치의 브랜딩 가이드를 받아 프론트엔드 코드 작성.
포함할 내용:
1. 프로젝트 구조 & 기술스택
2. 페이지/컴포넌트 전체 코드
3. 스타일링 (Tailwind CSS)
4. 상태관리 & API 연동 코드
5. 반응형 디자인 (모바일 우선)
6. 유키에게 전달할 요청사항 (필요한 API 변경 등)

모든 코드는 파일 경로와 함께 제공. 아름답고 사용성 좋은 UI. 한국어 주석.`
  },

  coco: {
    name: '코코', emoji: '🔍', role: 'QA 테스트 20년차',
    system: `너는 "코코", 겨울햇살팀 QA 테스트 담당. 경력 20년차 베테랑.
앱, 웹, API 모든 영역 QA 가능.

역할: 기획서 + 백엔드 코드 + 프론트 코드를 종합 검토.
포함할 내용:
1. 기획 vs 구현 일치도 검토
2. 코드 리뷰 (버그, 보안취약점, 성능이슈)
3. 테스트 시나리오 (기능별 테스트 케이스)
4. E2E 테스트 시나리오
5. 크로스브라우저/모바일 체크리스트
6. 개선사항 & 버그 리포트
7. 유키/푸딩에게 수정 요청사항

날카롭고 꼼꼼하게 검토. 한국어로 작성.`
  }
};

// ============================================================
// 단일 에이전트 실행
// ============================================================
async function runAgent(agentId, task, context = '') {
  const agent = AGENTS[agentId];
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const userMessage = context
    ? `[이전 단계 산출물 & 동료 참고자료]\n${context}\n\n[나의 작업 지시]\n${task}`
    : task;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: agent.system,
    messages: [{ role: 'user', content: userMessage }],
  });

  return response.content[0].text;
}

// ============================================================
// 텔레그램 보고 헬퍼 (긴 메시지 분할)
// ============================================================
async function reportToTelegram(agent, phaseName, output) {
  const header = `${agent.emoji} <b>[${agent.name} — ${phaseName} 완료 ✅]</b>\n\n`;

  if (output.length > 3800) {
    const chunks = output.match(/[\s\S]{1,3800}/g) || [output];
    await sendMessage(header + chunks[0]);
    for (let j = 1; j < chunks.length; j++) {
      await sendMessage(`${agent.emoji} <b>[${agent.name} 계속...]</b>\n\n${chunks[j]}`);
    }
  } else {
    await sendMessage(header + output);
  }
}

// ============================================================
// 컨텍스트 요약 (다음 Phase에 전달용)
// ============================================================
function summarizeForNext(outputs) {
  return Object.entries(outputs)
    .map(([agentId, data]) => {
      const agent = AGENTS[agentId];
      const trimmed = data.output.length > 2500
        ? data.output.substring(0, 2500) + '\n...(이하 생략)'
        : data.output;
      return `=== ${agent.emoji} ${agent.name} (${data.phase}) ===\n${trimmed}`;
    })
    .join('\n\n');
}

// ============================================================
// 메인 파이프라인: 병렬 실행
// ============================================================
export async function runProjectPipeline(userRequest) {
  const allResults = {};

  try {
    // ===== STEP 0: 먼지 — 프로젝트 계획 수립 =====
    await sendMessage(
      `🔥 <b>[먼지 팀장]</b>\n\n접수했습니다 대표님!\n프로젝트 계획 수립 중... 팀원들 소집합니다. 🫡`
    );

    const planRaw = await runAgent('munji', userRequest);
    let plan;
    try {
      const cleaned = planRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      plan = JSON.parse(cleaned);
    } catch (e) {
      await sendMessage(`🔥 <b>[먼지 팀장]</b>\n\n${planRaw.substring(0, 3900)}`);
      return { success: false, error: 'Plan parsing failed' };
    }

    // 계획 보고
    const p1List = (plan.phase1?.parallel || [])
      .filter(t => !t.task.includes('해당없음'))
      .map(t => `  ${AGENTS[t.agent]?.emoji} ${AGENTS[t.agent]?.name}: ${t.task.substring(0, 60)}...`)
      .join('\n');
    const p2List = (plan.phase2?.parallel || [])
      .filter(t => !t.task.includes('해당없음'))
      .map(t => `  ${AGENTS[t.agent]?.emoji} ${AGENTS[t.agent]?.name}: ${t.task.substring(0, 60)}...`)
      .join('\n');
    const p3List = (plan.phase3?.agents || [])
      .map(t => `  ${AGENTS[t.agent]?.emoji} ${AGENTS[t.agent]?.name}: ${t.task.substring(0, 60)}...`)
      .join('\n');

    await sendMessage(
      `🔥 <b>[프로젝트 계획 완료]</b>\n\n` +
      `📁 <b>${plan.projectName}</b>\n${plan.summary}\n\n` +
      `<b>Phase 1 — 기획+마케팅 (병렬)</b>\n${p1List || '  (해당없음)'}\n\n` +
      `<b>Phase 2 — 개발 (병렬)</b>\n${p2List || '  (해당없음)'}\n\n` +
      `<b>Phase 3 — QA</b>\n${p3List || '  (해당없음)'}\n\n` +
      `지금부터 실행합니다! 🔥`
    );

    // ===== PHASE 1: 멍뭉 + 치치 병렬 =====
    const phase1Tasks = (plan.phase1?.parallel || []).filter(t => !t.task.includes('해당없음'));

    if (phase1Tasks.length > 0) {
      await sendMessage(
        `🔥 <b>[Phase 1 시작 — 기획+마케팅]</b>\n\n` +
        phase1Tasks.map(t => `${AGENTS[t.agent]?.emoji} ${AGENTS[t.agent]?.name} 작업 시작!`).join('\n') +
        `\n\n동시에 진행합니다 ⏳`
      );

      // Promise.all로 병렬 실행
      const phase1Results = await Promise.all(
        phase1Tasks.map(async (t) => {
          const output = await runAgent(t.agent, t.task);
          return { agent: t.agent, output, phase: 'Phase 1' };
        })
      );

      // 결과 저장 & 보고
      for (const result of phase1Results) {
        allResults[result.agent] = result;
        await reportToTelegram(AGENTS[result.agent], plan.phase1.description, result.output);
      }

      // 팀원간 소통 보고
      if (phase1Results.length > 1) {
        await sendMessage(
          `🔥 <b>[Phase 1 완료 — 팀원 간 산출물 공유됨]</b>\n\n` +
          phase1Results.map(r => `✅ ${AGENTS[r.agent].emoji} ${AGENTS[r.agent].name}`).join('\n') +
          `\n\n→ Phase 2 개발팀에게 전달합니다!`
        );
      }
    }

    // ===== PHASE 2: 유키 + 푸딩 병렬 (Phase 1 결과 기반) =====
    const phase2Tasks = (plan.phase2?.parallel || []).filter(t => !t.task.includes('해당없음'));

    if (phase2Tasks.length > 0) {
      const phase1Context = summarizeForNext(allResults);

      await sendMessage(
        `🔥 <b>[Phase 2 시작 — 개발]</b>\n\n` +
        phase2Tasks.map(t => `${AGENTS[t.agent]?.emoji} ${AGENTS[t.agent]?.name} 작업 시작!`).join('\n') +
        `\n\nPhase 1 기획서를 참고해서 동시 개발 진행 ⏳`
      );

      const phase2Results = await Promise.all(
        phase2Tasks.map(async (t) => {
          const output = await runAgent(t.agent, t.task, phase1Context);
          return { agent: t.agent, output, phase: 'Phase 2' };
        })
      );

      for (const result of phase2Results) {
        allResults[result.agent] = result;
        await reportToTelegram(AGENTS[result.agent], plan.phase2.description, result.output);
      }

      if (phase2Results.length > 1) {
        await sendMessage(
          `🔥 <b>[Phase 2 완료 — 개발 산출물 공유됨]</b>\n\n` +
          phase2Results.map(r => `✅ ${AGENTS[r.agent].emoji} ${AGENTS[r.agent].name}`).join('\n') +
          `\n\n→ Phase 3 QA팀에게 전달합니다!`
        );
      }
    }

    // ===== PHASE 3: 코코 QA (Phase 1+2 결과 기반) =====
    const phase3Tasks = plan.phase3?.agents || [];

    if (phase3Tasks.length > 0) {
      const allContext = summarizeForNext(allResults);

      await sendMessage(
        `🔥 <b>[Phase 3 시작 — QA]</b>\n\n` +
        `🔍 코코 전체 산출물 검토 시작 ⏳`
      );

      for (const t of phase3Tasks) {
        const output = await runAgent(t.agent, t.task, allContext);
        allResults[t.agent] = { agent: t.agent, output, phase: 'Phase 3' };
        await reportToTelegram(AGENTS[t.agent], plan.phase3.description, output);
      }
    }

    // ===== 최종 종합 보고 =====
    const completedAgents = Object.keys(allResults)
      .map(id => `✅ ${AGENTS[id].emoji} ${AGENTS[id].name} (${AGENTS[id].role})`)
      .join('\n');

    await sendMessage(
      `🔥 <b>[먼지 팀장 — 프로젝트 완료 보고]</b>\n\n` +
      `📁 <b>${plan.projectName}</b>\n\n` +
      `<b>참여 팀원:</b>\n${completedAgents}\n\n` +
      `전 단계 완료되었습니다!\n` +
      `결과물 검토 후 수정사항 말씀해 주세요.\n` +
      `수정이 필요하면 "유키 API 수정해줘" 식으로 지시해 주시면 됩니다. 🫡`
    );

    return { success: true, results: allResults };

  } catch (error) {
    console.error('Pipeline error:', error);
    await sendMessage(
      `🔥 <b>[먼지 팀장 — 오류]</b>\n\n` +
      `대표님, 작업 중 오류 발생.\n${error.message?.substring(0, 300)}\n\n확인 후 재시도하겠습니다. 🫡`
    );
    return { success: false, error: error.message };
  }
}

// ============================================================
// 일반 대화용
// ============================================================
export async function askMunji(userMessage, context = '') {
  const chatSystem = `너는 "먼지"야. 겨울햇살팀의 총괄 팀장. 대기업 15년차 기획팀장 출신.

성격: 팀원들이 노는 꼴을 못 봄. 깔끔하고 프로페셔널한 존댓말. 가끔 🔥🫡 이모지.
답변은 간결하되 핵심을 놓치지 않음.

팀원: 치치(마케팅), 멍뭉(기획), 유키(백엔드), 푸딩(프론트), 코코(QA)

대표님이 프로젝트/앱/서비스 개발을 요청하면 → "프로젝트로 접수하겠습니다!" 라고 안내.
"만들어줘" "개발해줘" "기획해줘" 같은 말이 오면 자동으로 팀을 가동함.
업무 지시 → 즉시 접수, 팀원 배분.
질문 → 명확하고 실용적인 답변.
잡담 → 짧게 응대하되 업무 유도.
한국어로 답변.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: chatSystem,
    messages: [{
      role: 'user',
      content: context
        ? `[팀 상태]\n${context}\n\n[대표님]\n${userMessage}`
        : userMessage,
    }],
  });

  return response.content[0].text;
}

export { AGENTS, runAgent };
