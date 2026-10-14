import { CheckCircle, ExternalLink, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { buildTxExplorerUrl } from '@/onchain-facts'

const TARGET_CHAIN_ID = 5042002 // Arc Testnet

interface TxStatusProps {
  hash: `0x${string}` | undefined
  isSuccess: boolean
  isError: boolean
  errorMessage: string | null
  onReset: () => void
}

export default function TxStatus({ hash, isSuccess, isError, errorMessage, onReset }: TxStatusProps) {
  if (!isSuccess && !isError) return null

  const explorerUrl = hash ? buildTxExplorerUrl(TARGET_CHAIN_ID, hash) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-3 rounded-2xl p-4"
      style={{
        background: isSuccess
          ? 'rgba(26, 128, 71, 0.06)'
          : 'rgba(186, 43, 76, 0.06)',
        border: `1px solid ${isSuccess ? 'rgba(26,128,71,0.2)' : 'rgba(186,43,76,0.2)'}`,
      }}
    >
      {isSuccess && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle
              className="mt-0.5 size-5 shrink-0"
              style={{ color: 'var(--success)' }}
            />
            <div>
              <p className="text-sm font-600" style={{ color: 'var(--success)' }}>
                Giao dịch thành công!
              </p>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                  style={{ color: 'var(--accent-hover)' }}
                >
                  Xem trên Arc Explorer
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onReset}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-500 transition-colors"
            style={{
              background: 'rgba(26,128,71,0.12)',
              color: 'var(--success)',
            }}
          >
            Gửi tiếp
          </button>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-2.5">
          <XCircle
            className="mt-0.5 size-5 shrink-0"
            style={{ color: 'var(--danger)' }}
          />
          <div>
            <p className="text-sm font-600" style={{ color: 'var(--danger)' }}>
              Giao dịch thất bại
            </p>
            {errorMessage && (
              <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                {errorMessage}
              </p>
            )}
            <button
              onClick={onReset}
              className="mt-2 text-xs font-500 underline underline-offset-2"
              style={{ color: 'var(--accent-hover)' }}
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
