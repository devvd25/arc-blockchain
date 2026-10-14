import { useState, useCallback } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useConnect,
} from 'wagmi'
import { isAddress, erc20Abi } from 'viem'
import { TokenUSDC } from '@web3icons/react'
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react'
import { getUsdc } from '@/onchain-facts'
import { Amount, parseAmount, usdcDecimalsFor } from '@/onchain-money'
import TxStatus from './TxStatus'

const TARGET_CHAIN_ID = 5042002 // Arc Testnet

const usdcFact = getUsdc(TARGET_CHAIN_ID)!

function parseOnchainError(error: unknown): string {
  const message = (error as { message?: string })?.message?.toLowerCase() ?? ''
  if (message.includes('user rejected') || (error as { code?: number })?.code === 4001)
    return ''
  if (message.includes('insufficient funds') || message.includes('exceeds balance'))
    return 'Số dư không đủ. Vui lòng nạp thêm USDC.'
  if (message.includes('reverted')) return 'Giao dịch bị từ chối bởi hợp đồng.'
  if (message.includes('network') || message.includes('timeout'))
    return 'Lỗi mạng. Kiểm tra kết nối và thử lại.'
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

const QUICK_AMOUNTS = ['0.10', '0.50', '1.00', '5.00']

export default function SendForm() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { connect, connectors, isPending: isConnecting } = useConnect()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [txError, setTxError] = useState<string | null>(null)

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID

  // Read USDC balance
  const { data: rawBalance } = useReadContract({
    address: usdcFact.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const balanceAmount =
    rawBalance !== undefined
      ? Amount.fromRaw(rawBalance, usdcDecimalsFor(TARGET_CHAIN_ID))
      : null

  const formattedBalance = balanceAmount ? balanceAmount.toFixed(2) : null

  // Write contract
  const {
    writeContract,
    data: hash,
    isPending,
    reset: resetWrite,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Validation
  const recipientValid = recipient !== '' && isAddress(recipient)
  const amountNum = parseFloat(amount)
  const amountValid =
    amount !== '' &&
    !Number.isNaN(amountNum) &&
    amountNum > 0 &&
    /^\d*\.?\d{0,6}$/.test(amount)

  const hasInsufficientFunds =
    amountValid && balanceAmount !== null
      ? (() => {
          try {
            const parsed = parseAmount(TARGET_CHAIN_ID, amount)
            return parsed.gt(balanceAmount)
          } catch {
            return false
          }
        })()
      : false

  const canSend =
    isConnected &&
    !isWrongChain &&
    recipientValid &&
    amountValid &&
    !hasInsufficientFunds &&
    !isPending &&
    !isConfirming &&
    !isSuccess

  const handleSend = useCallback(() => {
    if (!canSend) return
    setTxError(null)
    try {
      const parsed = parseAmount(TARGET_CHAIN_ID, amount)
      writeContract({
        address: usdcFact.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipient, parsed.raw],
        chainId: TARGET_CHAIN_ID,
      })
    } catch (err) {
      const msg = parseOnchainError(err)
      if (msg) setTxError(msg)
    }
  }, [canSend, amount, recipient, writeContract])

  const handleReset = () => {
    resetWrite()
    setTxError(null)
    setAmount('')
    setRecipient('')
  }

  const setMax = () => {
    if (balanceAmount) setAmount(balanceAmount.toFixed(6))
  }

  const injectedConnector = connectors[0]

  return (
    <div className="mx-auto w-full max-w-md px-4">
      {/* Hero balance card */}
      <section
        className="rounded-3xl p-5"
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(18,45,69,0.06)',
        }}
      >
        <div className="mb-1 flex items-center gap-1.5">
          <div
            className="flex size-5 items-center justify-center rounded-md"
            style={{ background: 'rgba(26,128,71,0.12)' }}
          >
            <TokenUSDC variant="branded" size={12} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Số dư của bạn
          </span>
        </div>

        {isConnected ? (
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
              {formattedBalance ?? '...'}
            </span>
            <span className="text-xl font-medium" style={{ color: 'var(--subtle)' }}>
              USDC
            </span>
          </div>
        ) : (
          <div className="mt-2">
            <span className="display text-5xl font-bold" style={{ color: 'var(--border-strong)' }}>
              —
            </span>
          </div>
        )}

        <p className="mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
          {isConnected ? 'Arc Testnet · Cập nhật trực tiếp' : 'Kết nối ví để xem số dư'}
        </p>
      </section>

      {/* Send form */}
      <section
        className="mt-4 rounded-3xl p-5"
        style={{
          background: 'var(--surface)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(18,45,69,0.06)',
        }}
      >
        <h2 className="display mb-4 text-base font-semibold" style={{ color: 'var(--ink)' }}>
          Gửi USDC
        </h2>

        {/* Recipient input */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Địa chỉ nhận
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.trim())}
            placeholder="0x..."
            disabled={isSuccess}
            className="mono w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-300"
            style={{
              background: 'var(--surface-muted)',
              color: 'var(--ink)',
              border: `1px solid ${recipient && !recipientValid ? 'var(--danger)' : 'transparent'}`,
            }}
          />
          {recipient && !recipientValid && (
            <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--danger)' }}>
              <AlertCircle className="size-3" />
              Địa chỉ không hợp lệ
            </p>
          )}
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Số tiền
          </label>
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'var(--surface-muted)',
              border: `1px solid ${hasInsufficientFunds ? 'var(--danger)' : 'transparent'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  if (val === '' || /^\d*\.?\d{0,6}$/.test(val)) setAmount(val)
                }}
                placeholder="0.00"
                disabled={isSuccess}
                className="display min-w-0 flex-1 bg-transparent text-4xl font-bold tabular-nums outline-none placeholder:text-slate-300"
                style={{ color: 'var(--ink)' }}
              />
              <div className="flex items-center gap-1.5">
                <TokenUSDC variant="branded" size={20} />
                <span className="text-base font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              {hasInsufficientFunds ? (
                <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--danger)' }}>
                  <AlertCircle className="size-3" />
                  Số dư không đủ
                </p>
              ) : (
                <span />
              )}
              <button
                disabled={!formattedBalance || isSuccess}
                onClick={setMax}
                className="text-xs font-semibold disabled:opacity-40"
                style={{ color: 'var(--accent-hover)' }}
              >
                {formattedBalance ? `Max: ${formattedBalance}` : 'Chưa kết nối'}
              </button>
            </div>
          </div>

          {/* Quick amount chips */}
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                disabled={isSuccess}
                className="rounded-xl px-3 py-1 text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                style={{
                  background: amount === q ? 'var(--accent)' : 'var(--surface-muted)',
                  color: amount === q ? '#fff' : 'var(--muted)',
                  border: `1px solid ${amount === q ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                ${q}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: injectedConnector })}
            disabled={isConnecting || !injectedConnector}
            className="mt-4 w-full rounded-2xl py-4 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Đang kết nối...
              </span>
            ) : (
              'Kết nối MetaMask'
            )}
          </button>
        ) : isWrongChain ? (
          <button
            onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
            disabled={isSwitching}
            className="mt-4 w-full rounded-2xl py-4 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{ background: 'var(--danger)' }}
          >
            {isSwitching ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Đang chuyển mạng...
              </span>
            ) : (
              'Chuyển sang Arc Testnet'
            )}
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="mt-4 w-full rounded-2xl py-4 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Xác nhận trong ví...
              </span>
            ) : isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Đang xác nhận...
              </span>
            ) : isSuccess ? (
              'Đã gửi thành công'
            ) : (
              <span className="flex items-center justify-center gap-2">
                Gửi USDC <ArrowRight className="size-4" />
              </span>
            )}
          </button>
        )}

        {/* Tx status */}
        <TxStatus
          hash={hash}
          isSuccess={isSuccess}
          isError={!!txError}
          errorMessage={txError}
          onReset={handleReset}
        />

        {/* Info footer */}
        {!isSuccess && (
          <p className="mt-4 text-center text-xs" style={{ color: 'var(--subtle)' }}>
            Giao dịch trên Arc Testnet — không dùng tiền thật.{' '}
            <span style={{ color: 'var(--muted)' }}>Phí gas tính bằng USDC.</span>
          </p>
        )}
      </section>

      {/* Explainer cards for beginners */}
      <section className="mt-4 grid grid-cols-2 gap-3 pb-8">
        {[
          {
            title: 'Ví (Wallet)',
            body: 'Địa chỉ 0x... là tài khoản của bạn trên blockchain. Không ai kiểm soát được ngoài bạn.',
          },
          {
            title: 'Gas = USDC',
            body: 'Trên Arc, phí giao dịch (gas) trả bằng USDC. Không cần ETH hay token khác.',
          },
          {
            title: 'Finality tức thì',
            body: 'Giao dịch xác nhận dưới 1 giây trên Arc — nhanh hơn quẹt thẻ.',
          },
          {
            title: 'USDC Stablecoin',
            body: '1 USDC = 1 USD. Do Circle phát hành, được đảm bảo bằng tài sản thực.',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl p-3.5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <p className="display text-xs font-semibold" style={{ color: 'var(--ink)' }}>
              {card.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              {card.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  )
}
