export type PaystackConfig = {
  enabled: boolean
  publicKey: string | null
}

export function getPaystackConfig(): PaystackConfig {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? null
  return { enabled: !!publicKey, publicKey }
}

export type InitializePaymentResult = {
  success: boolean
  authorizationUrl?: string
  reference?: string
  mock?: boolean
  error?: string
}

export async function initializePayment(data: {
  email: string
  amountGHS: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, string>
}): Promise<InitializePaymentResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    // Mock mode — log and return a fake reference
    console.log('[Paystack MOCK] Would initialize payment:', data)
    return {
      success: true,
      authorizationUrl: '#mock-paystack',
      reference: data.reference,
      mock: true,
    }
  }

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email:        data.email,
      amount:       Math.round(data.amountGHS * 100), // Paystack uses kobo (pesewas for GHS)
      reference:    data.reference,
      callback_url: data.callbackUrl,
      currency:     'GHS',
      metadata:     data.metadata ?? {},
    }),
  })

  const json = await res.json()
  if (!res.ok || !json.status) {
    return { success: false, error: json.message ?? 'Payment initialization failed' }
  }

  return {
    success:          true,
    authorizationUrl: json.data.authorization_url,
    reference:        json.data.reference,
  }
}

export async function verifyPayment(reference: string): Promise<{
  success: boolean; paid: boolean; amount: number; error?: string
}> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) {
    return { success: true, paid: true, amount: 0, error: 'Mock mode' }
  }

  const res  = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  })
  const json = await res.json()

  if (!res.ok || !json.status) {
    return { success: false, paid: false, amount: 0, error: json.message }
  }

  return {
    success: true,
    paid:    json.data.status === 'success',
    amount:  json.data.amount / 100,
  }
}

// ── MoMo payout recipients ────────────────────────────────────────────────────

const NETWORK_CODES: Record<string, string> = {
  mtn: 'MTN', vodafone: 'VOD', airteltigo: 'ATL',
}

export async function createTransferRecipient(data: {
  name: string; momoNumber: string; network: string
}): Promise<{ success: boolean; recipientCode?: string; error?: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return { success: false, error: 'Payment not configured' }

  const res = await fetch('https://api.paystack.co/transferrecipient', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type:           'mobile_money',
      name:           data.name,
      account_number: data.momoNumber.replace(/\D/g, ''),
      bank_code:      NETWORK_CODES[data.network] ?? 'MTN',
      currency:       'GHS',
    }),
  })
  const json = await res.json()
  if (!res.ok || !json.status) return { success: false, error: json.message ?? 'Failed to create recipient' }
  return { success: true, recipientCode: json.data.recipient_code }
}

export async function initiateTransfer(data: {
  amountGHS: number; recipientCode: string; reason: string; reference?: string
}): Promise<{ success: boolean; transferCode?: string; error?: string }> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey) return { success: false, error: 'Payment not configured' }

  const res = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source:    'balance',
      amount:    Math.round(data.amountGHS * 100),
      recipient: data.recipientCode,
      reason:    data.reason,
      reference: data.reference,
      currency:  'GHS',
    }),
  })
  const json = await res.json()
  if (!res.ok || !json.status) return { success: false, error: json.message ?? 'Transfer failed' }
  return { success: true, transferCode: json.data.transfer_code }
}
