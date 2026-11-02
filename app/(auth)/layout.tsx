// Render the sign in and sign up pages on request instead of at build time.
// They initialise Firebase, so building them in advance requires the Firebase keys,
// which Vercel only provides to production. This lets preview builds succeed too.
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
