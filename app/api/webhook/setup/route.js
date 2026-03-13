import { setWebhook } from '../../../../lib/telegram';

export async function GET(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const webhookUrl = `${baseUrl}/api/webhook`;

  const result = await setWebhook(webhookUrl);

  return Response.json({
    message: 'Webhook setup attempted',
    webhookUrl,
    result,
  });
}
