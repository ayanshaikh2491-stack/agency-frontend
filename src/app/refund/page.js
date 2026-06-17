'use client'
export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Refund and Cancellation Policy</h1>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p><strong>1. Satisfaction Guarantee:</strong> We stand by the quality of our work. If you're not satisfied with the initial deliverables, we'll revise them at no extra cost.</p>
          <p><strong>2. Cancellation:</strong> Projects can be cancelled within 48 hours of payment for a full refund. After 48 hours, refunds are processed on a pro-rata basis for work not yet completed.</p>
          <p><strong>3. Refund Processing:</strong> Approved refunds are processed within 5-7 business days to the original payment method.</p>
          <p><strong>4. Dispute Resolution:</strong> If you have concerns about a charge, please contact us at ayanagency@gmail.com before filing a dispute. We're committed to resolving issues fairly.</p>
          <p><strong>5. Non-Refundable Items:</strong> Ad spend, third-party tool subscriptions, and domain registrations are non-refundable once purchased on your behalf.</p>
          <p className="mt-8 text-xs text-muted-foreground">Last updated: June 2026</p>
        </div>
      </div>
    </div>
  )
}
