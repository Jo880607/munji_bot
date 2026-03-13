import { getTeamStatus, getTeamSummary } from '../../../lib/team-state';

export async function GET() {
  const status = getTeamStatus();
  const summary = getTeamSummary();

  return Response.json({
    team: '겨울햇살팀',
    leader: '먼지',
    summary,
    members: status,
    timestamp: new Date().toISOString(),
  });
}
