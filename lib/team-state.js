// 팀원 업무 상태 관리 (메모리 기반 - 추후 Firebase 연동 가능)
// Vercel Serverless는 stateless이므로 간단한 상태는 env/KV로 관리

const teamMembers = {
  munji: {
    name: '먼지',
    role: '총괄 팀장',
    emoji: '🔥',
    status: 'active',
    currentTask: '팀 현황 관리 및 보고',
    tasks: [],
  },
  chichi: {
    name: '치치',
    role: '홍보 마케팅 기획',
    emoji: '🎯',
    status: 'standby',
    currentTask: '대기 중 (체력 충전)',
    tasks: [],
    skills: ['한국어', '중국어', '일본어', '마케팅', '브랜딩', 'SNS'],
  },
  mungmung: {
    name: '멍뭉',
    role: '전략기획 & 개발가이드',
    emoji: '📋',
    status: 'standby',
    currentTask: '대기 중 (체력 충전)',
    tasks: [],
    skills: ['PRD', '기획서', '개발이관', '전략기획'],
  },
  yuki: {
    name: '유키',
    role: '백엔드 개발 10년차',
    emoji: '⚙️',
    status: 'standby',
    currentTask: '대기 중 (체력 충전)',
    tasks: [],
    skills: ['Node.js', 'Python', 'Java', 'Firebase', 'DB', 'API', '서버'],
  },
  pudding: {
    name: '푸딩',
    role: '프론트엔드 개발 7년차',
    emoji: '🎨',
    status: 'standby',
    currentTask: '대기 중 (체력 충전)',
    tasks: [],
    skills: ['React', 'Next.js', 'UI/UX', '디자인', 'CSS', '반응형'],
  },
  coco: {
    name: '코코',
    role: 'QA 테스트 20년차',
    emoji: '🔍',
    status: 'standby',
    currentTask: '대기 중 (체력 충전)',
    tasks: [],
    skills: ['QA', 'E2E테스트', '회귀테스트', '크로스브라우저', '모바일'],
  },
};

export function getTeamStatus() {
  const lines = Object.values(teamMembers).map(
    (m) => `${m.emoji} ${m.name} (${m.role}): ${m.currentTask}`
  );
  return lines.join('\n');
}

export function getTeamSummary() {
  const active = Object.values(teamMembers).filter((m) => m.status === 'active').length;
  const standby = Object.values(teamMembers).filter((m) => m.status === 'standby').length;
  const total = Object.values(teamMembers).length;
  return { total, active, standby };
}

export { teamMembers };
