'use client'
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Contact Us</h1>
        <div className="space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Email:</strong> ayanagency@gmail.com</p>
          <p><strong className="text-foreground">Response Time:</strong> Within 24 hours</p>
          <p><strong className="text-foreground">Business Hours:</strong> Mon-Sat, 10 AM - 7 PM IST</p>
          <p className="mt-8 text-sm">For support inquiries, please email us and we'll get back to you promptly.</p>
        </div>
      </div>
    </div>
  )
}
