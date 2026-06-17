'use client'
export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Delivery Policy</h1>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p><strong>1. Digital Services:</strong> NexusAI provides digital marketing services. All deliverables are provided electronically — no physical goods are shipped.</p>
          <p><strong>2. Delivery Timeline:</strong> Project timelines and milestones are specified in the service agreement provided after payment confirmation.</p>
          <p><strong>3. Delivery Method:</strong> All deliverables (reports, content, designs, campaign setups) are shared via email and/or shared dashboards.</p>
          <p><strong>4. Revision Period:</strong> Clients may request revisions within 7 days of receiving deliverables. Revision requests after this period may incur additional charges.</p>
          <p><strong>5. Communication:</strong> Project updates and deliverables are communicated via the email address provided during checkout.</p>
          <p className="mt-8 text-xs text-muted-foreground">Last updated: June 2026</p>
        </div>
      </div>
    </div>
  )
}
