'use client'
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Terms and Conditions</h1>
        <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p><strong>1. Services:</strong> NexusAI provides digital marketing services including but not limited to SEO, social media management, content writing, and ad campaign management.</p>
          <p><strong>2. Payment:</strong> All payments are processed through Instamojo. Services commence after payment confirmation.</p>
          <p><strong>3. Scope of Work:</strong> Specific deliverables and timelines are outlined in the project agreement provided via email.</p>
          <p><strong>4. Client Responsibilities:</strong> Clients must provide necessary access, content, and approvals in a timely manner to ensure project completion.</p>
          <p><strong>5. Intellectual Property:</strong> Upon full payment, clients retain ownership of all deliverables created specifically for their project.</p>
          <p><strong>6. Limitation of Liability:</strong> NexusAI is not liable for indirect damages or loss of business resulting from service delivery.</p>
          <p><strong>7. Modifications:</strong> These terms may be updated at any time. Continued use of services constitutes acceptance of new terms.</p>
          <p className="mt-8 text-xs text-muted-foreground">Last updated: June 2026</p>
        </div>
      </div>
    </div>
  )
}
