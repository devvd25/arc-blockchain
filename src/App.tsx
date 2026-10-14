import WalletBar from '@/components/WalletBar'
import SendForm from '@/components/SendForm'

export default function App() {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <WalletBar />
      <main className="pb-8">
        <SendForm />
      </main>
    </div>
  )
}
