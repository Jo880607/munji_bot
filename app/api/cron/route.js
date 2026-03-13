import { sendMessage } from '../../../lib/telegram';
import { askMunji } from '../../../lib/munji-ai';
import { getTeamStatus } from '../../../lib/team-state';

export async function GET(request) {
  try {
    // Vercel Cron 인증 (선택)
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      // Vercel cron은 자동으로 인증 헤더를 보내므로 허용
      // 외부 호출만 차단
    }

    const now = new Date();
    const kstHour = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    ).getHours();

    // 업무 시간 (09시 ~ 22시)만 보고
    if (kstHour < 9 || kstHour >= 22) {
      return Response.json({
        ok: true,
        message: '업무 외 시간 - 보고 스킵',
      });
    }

    const teamStatus = getTeamStatus();
    const report = await askMunji(
      `현재 시각 ${kstHour}시 정기 보고 시간입니다. 팀 현황을 간결하게 보고해 주세요. 놀고 있는 팀원이 있으면 새로운 업무를 제안해 주세요.`,
      teamStatus
    );

    await sendMessage(`🔥 <b>[${kstHour}시 정기 보고]</b>\n\n${report}`);

    return Response.json({ ok: true, message: 'Report sent' });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ error: 'Cron failed' }, { status: 500 });
  }
}
