import { useAccount, useReadContract, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { erc20Abi } from 'viem'
import { TokenUSDC } from '@web3icons/react'
import { LogOut, AlertTriangle } from 'lucide-react'
import { getUsdc, requireChain } from '@/onchain-facts'
import { Amount, usdcDecimalsFor } from '@/onchain-money'

const TARGET_CHAIN_ID = 5042002 // Arc Testnet

const usdcFact = getUsdc(TARGET_CHAIN_ID)!
const chain = requireChain(TARGET_CHAIN_ID)

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function WalletBar() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect({
    mutation: {
      onSuccess() {
        // Auto-switch to Arc Testnet after connecting
        switchChain({ chainId: TARGET_CHAIN_ID })
      },
    },
  })
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID

  const { data: rawBalance } = useReadContract({
    address: usdcFact.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance =
    rawBalance !== undefined
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
      : null

  const injectedConnector = connectors[0]

  return (
    <header className="w-full px-4 py-4">
      <div
        className="mx-auto flex max-w-md items-center justify-between rounded-2xl px-4 py-3"
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(18,45,69,0.06)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent)' }}
          >
            <TokenUSDC variant="mono" size={16} />
          </div>
          <span className="display text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Arc Pay
          </span>
        </div>

        {/* Right side */}
        {isConnected && address ? (
          <div className="flex items-center gap-2">
            {/* Wrong chain warning */}
            {isWrongChain && (
              <button
                onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
                disabled={isSwitching}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}
              >
                <AlertTriangle className="size-3" />
                {isSwitching ? 'Đang chuyển...' : 'Switch sang Arc'}
              </button>
            )}

            {/* Balance pill — only show on correct chain */}
            {!isWrongChain && (
              <div
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{ background: 'var(--surface-muted)' }}
              >
                <TokenUSDC variant="branded" size={14} />
                <span className="mono text-xs font-medium tabular-nums" style={{ color: 'var(--ink-2)' }}>
                  {formattedBalance ?? '...'}
                </span>
              </div>
            )}

            {/* Address */}
            <span
              className="mono rounded-xl px-3 py-1.5 text-xs"
              style={{
                background: 'var(--surface-muted)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {formatAddress(address)}
            </span>

            {/* Disconnect */}
            <button
              onClick={() => disconnect()}
              title="Ngắt kết nối"
              className="flex size-8 items-center justify-center rounded-xl transition-colors hover:bg-red-50"
              style={{ color: 'var(--muted)' }}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => connect({ connector: injectedConnector })}
            disabled={isPending || !injectedConnector}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {isPending ? 'Đang kết nối...' : 'Kết nối MetaMask'}
          </button>
        )}
      </div>

      {/* Testnet badge */}
      <p className="mt-2 text-center text-xs" style={{ color: 'var(--subtle)' }}>
        {chain.name} · Testnet · USDC là gas token
      </p>
    </header>
  )
}
