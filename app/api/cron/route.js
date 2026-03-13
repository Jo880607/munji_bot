// 추후 정기 보고용 (현재 비활성)
export async function GET() {
  return Response.json({ ok: true, message: 'Cron disabled' });
}
