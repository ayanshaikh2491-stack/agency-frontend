'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, ArrowLeft, ExternalLink } from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const linkId = searchParams.get('link_id') || ''
  const orderId = searchParams.get('order_id') || ''
  const status = searchParams.get('status') || 'success'

  const [verifying, setVerifying] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState(status)
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!linkId && !orderId) {
      setVerifying(false)
      return
    }

    // Try to verify payment with backend
    const verifyPayment = async () => {
      try {
        const orderToCheck = orderId || linkId
        const res = await fetch(
          `https://18.213.66.136:8000/api/cashfree/payment-status/${orderToCheck}`
        )
        const data = await res.json()
        if (data.success) {
          setPaymentStatus(data.status === 'SUCCESS' ? 'success' : 'pending')
          setPaymentData(data)
        }
      } catch (e) {
        console.log('Payment verification unavailable:', e)
      }
      setVerifying(false)
    }

    const timer = setTimeout(verifyPayment, 1500)
    return () => clearTimeout(timer)
  }, [linkId, orderId])

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 text-[#b86533] animate-spin" />
        <p className="text-muted-foreground">Verifying your payment...</p>
      </div>
    )
  }

  if (paymentStatus === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center gap-6">
        <div className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Successful! 🎉</h1>
          <p className="text-muted-foreground">
            Your payment has been received. We'll start working on your project right away.
          </p>
          {paymentData?.amount && (
            <p className="text-lg font-semibold text-foreground mt-4">
              ₹{paymentData.amount.toLocaleString('en-IN')} paid
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-5 py-2.5 bg-[#b86533] text-white rounded-lg text-sm font-medium hover:bg-[#a55a2e] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center gap-6">
        <div className="size-20 rounded-full bg-red-500/20 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Failed</h1>
          <p className="text-muted-foreground">
            Something went wrong with your payment. Please try again or use a different payment method.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-accent/50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Try Again
        </button>
      </div>
    )
  }

  // Default: show pending / thank you page
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center gap-6">
      <div className="size-20 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Processing</h1>
        <p className="text-muted-foreground">
          Your payment is being processed. You'll receive a confirmation email shortly.
        </p>
      </div>
      <button
        onClick={() => router.push('/admin/dashboard')}
        className="px-5 py-2.5 bg-[#b86533] text-white rounded-lg text-sm font-medium hover:bg-[#a55a2e] transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#b86533] animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  )
}
