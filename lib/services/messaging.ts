type Channel = 'sms' | 'whatsapp' | 'email'

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  mock?: boolean
}

// ── Template variable substitution ───────────────────────────────────────────

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ── SMS via Twilio ────────────────────────────────────────────────────────────

async function sendSMS(to: string, body: string): Promise<SendResult> {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_FROM_SMS

  if (!sid || !token || !from) {
    console.log(`[SMS MOCK → ${to}]\n${body}\n`)
    return { success: true, mock: true }
  }

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(sid, token)
    const msg = await client.messages.create({ to, from, body })
    return { success: true, messageId: msg.sid }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── Phone number normalisation ────────────────────────────────────────────────
// Converts local Ghanaian format (0XX…) to international (233XX…).
// Strips all non-digits then applies country-code logic.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '233' + digits.slice(1)
  if (digits.startsWith('233')) return digits
  return digits
}

// ── WhatsApp via Railway (Baileys) ────────────────────────────────────────────

async function sendWhatsAppViaRailway(to: string, body: string): Promise<SendResult> {
  const baseUrl   = process.env.RAILWAY_WHATSAPP_URL
  const sessionId = process.env.RAILWAY_WHATSAPP_SESSION ?? 'default'
  if (!baseUrl) return { success: false, error: 'RAILWAY_WHATSAPP_URL not set' }

  try {
    const res = await fetch(`${baseUrl}/api/whatsapp/send`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, number: normalizePhone(to), message: body }),
      signal:  AbortSignal.timeout(8000),
    })
    const data = await res.json() as any
    if (!res.ok || !data.ok) return { success: false, error: data.error ?? 'Railway WA error' }
    return { success: true }
  } catch (err: any) {
    const msg = err.name === 'TimeoutError' ? 'WhatsApp service timed out — check Railway connection' : err.message
    return { success: false, error: msg }
  }
}

// ── WhatsApp via Meta Cloud API ───────────────────────────────────────────────

async function sendWhatsApp(to: string, body: string): Promise<SendResult> {
  // Prefer Railway (Baileys) if configured
  if (process.env.RAILWAY_WHATSAPP_URL) {
    return sendWhatsAppViaRailway(to, body)
  }

  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const accessToken   = process.env.META_WHATSAPP_ACCESS_TOKEN

  // Fallback to Twilio if Meta not configured
  if (!phoneNumberId || !accessToken) {
    const sid   = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from  = process.env.TWILIO_FROM_WHATSAPP ?? 'whatsapp:+14155238886'
    if (!sid || !token) {
      console.log(`[WHATSAPP MOCK → ${to}]\n${body}\n`)
      return { success: true, mock: true }
    }
    const twilio = (await import('twilio')).default
    const client = twilio(sid, token)
    const toWa   = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
    const msg    = await client.messages.create({ to: toWa, from, body })
    return { success: true, messageId: msg.sid }
  }

  // Strip leading + and spaces — Meta requires plain E.164 digits
  const toNumber = to.replace(/^\+/, '').replace(/\D/g, '')

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:   toNumber,
        type: 'text',
        text: { body },
      }),
    })
    const data = await res.json() as any
    if (!res.ok) return { success: false, error: data.error?.message ?? 'Meta API error' }
    return { success: true, messageId: data.messages?.[0]?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── Email via Resend ──────────────────────────────────────────────────────────

function bookingEmailHtml(opts: {
  clientName: string
  services: string
  date: string
  time: string
  salonName: string
  salonPhone?: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">✨ StitchDesk</p>
            <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">Booking Confirmation</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${opts.clientName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">Your booking request has been received. We'll confirm it shortly.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:600;">Service</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${opts.services}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:600;">Date</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${opts.date}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:600;">Time</p>
                  <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${opts.time}</p>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">Questions? Contact <strong>${opts.salonName}</strong>${opts.salonPhone ? ` at <a href="tel:${opts.salonPhone}" style="color:#0d9488;">${opts.salonPhone}</a>` : ''}.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Powered by <a href="https://stitchdeskapp.online" style="color:#0d9488;text-decoration:none;">StitchDesk</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, body: string, htmlOpts?: Parameters<typeof bookingEmailHtml>[0]): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM ?? 'StitchDesk <hello@stitchdeskapp.online>'

  if (!apiKey) {
    console.log(`[EMAIL MOCK → ${to}]\nSubject: ${subject}\n${body}\n`)
    return { success: true, mock: true }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const html   = htmlOpts ? bookingEmailHtml(htmlOpts) : `<pre style="font-family:sans-serif">${body.replace(/\n/g, '<br>')}</pre>`
    const { data, error } = await resend.emails.send({ from, to, subject, html, text: body })
    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ── Unified send function ─────────────────────────────────────────────────────

export async function sendMessage(
  channel: Channel,
  recipient: string,
  message: string,
  subject?: string,
): Promise<SendResult> {
  switch (channel) {
    case 'sms':       return sendSMS(recipient, message)
    case 'whatsapp':  return sendWhatsApp(recipient, message)
    case 'email':     return sendEmail(recipient, subject ?? 'Order update', message)
    default:          return { success: false, error: `Unknown channel: ${channel}` }
  }
}
