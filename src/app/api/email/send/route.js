import { NextResponse } from 'next/server'

/**
 * POST /api/email/send
 * Sends transactional emails via Gmail SMTP.
 * Templates: welcome, onboarding-complete, report-ready
 * Non-blocking — called from signup, hermes workflows, etc.
 */
export async function POST(request) {
  try {
    const { to, template, name, industry, reportType } = await request.json()

    if (!to || !template) {
      return NextResponse.json({ success: false, error: 'Missing required fields: to, template' }, { status: 400 })
    }

    const GMAIL_ADDRESS = process.env.GMAIL_ADDRESS
    const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

    if (!GMAIL_ADDRESS || !GMAIL_APP_PASSWORD) {
      console.warn(`Email not sent to ${to}: Gmail SMTP not configured`)
      return NextResponse.json({
        success: false,
        error: 'Gmail SMTP not configured. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD env vars.',
        config_hint: 'Create Gmail App Password: https://myaccount.google.com/apppasswords',
      }, { status: 200 }) // 200 so caller doesn't error — email is non-critical
    }

    // Build email content based on template
    let subject, html
    switch (template) {
      case 'welcome':
        subject = `Welcome to NexusAI, ${name || 'there'}! 🚀`
        html = getWelcomeHtml(name)
        break
      case 'onboarding-complete':
        subject = `Your ${industry || 'marketing'} setup is complete, ${name || 'there'}! ✅`
        html = getOnboardingHtml(name, industry)
        break
      case 'report-ready':
        subject = `Your ${reportType || 'report'} is ready, ${name || 'there'}! 📊`
        html = getReportHtml(name, reportType)
        break
      default:
        return NextResponse.json({ success: false, error: `Unknown template: ${template}` }, { status: 400 })
    }

    // Send via Gmail SMTP using fetch to a lightweight send endpoint
    // For now, log the email (actual sending requires SMTP credentials)
    console.log(`📧 Email prepared — To: ${to}, Subject: ${subject}`)

    // If SMTP credentials exist, send via the backend email_sender
    if (GMAIL_ADDRESS && GMAIL_APP_PASSWORD) {
      const backendUrl = process.env.BACKEND_API_URL
      if (!backendUrl) {
        console.warn('Email not sent: BACKEND_API_URL not set')
        return NextResponse.json({ success: false, error: 'BACKEND_API_URL not configured' }, { status: 200 })
      }
      const emailRes = await fetch(`${backendUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      }).catch(err => {
        console.error('Backend email send failed:', err.message)
      })
    }

    return NextResponse.json({ success: true, message: `Email ${template} prepared for ${to}` })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getWelcomeHtml(name) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://int-ayanshaikh2491-stacks-projects.vercel.app'
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#010102;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#010102;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1e;border-radius:12px;border:1px solid #2a2a2e;">
<tr><td style="padding:40px 32px 20px;text-align:center;border-bottom:1px solid #2a2a2e;">
<h1 style="color:#b86533;font-size:24px;margin:0;">NexusAI</h1></td></tr>
<tr><td style="padding:32px;color:#e8e6e3;font-size:15px;line-height:1.6;">
<p style="font-size:18px;margin:0 0 20px;">Hey ${name || 'there'},</p>
<p style="margin:0 0 20px;">Welcome to <strong style="color:#b86533;">NexusAI</strong>! Your AI-powered marketing agency is now live.</p>
<p style="margin:0 0 20px;">Here's what you can do next:</p>
<table width="100%" cellpadding="12" cellspacing="0">
<tr><td style="border-left:3px solid #b86533;background:#222226;border-radius:6px;">
<strong>🔗 Connect Social Accounts</strong><br><span style="color:#aaa;">Link Facebook & Instagram for auto-posting</span></td></tr>
<tr><td style="border-left:3px solid #b86533;background:#222226;border-radius:6px;">
<strong>📊 View Analytics</strong><br><span style="color:#aaa;">See social media performance in real-time</span></td></tr>
<tr><td style="border-left:3px solid #b86533;background:#222226;border-radius:6px;">
<strong>💬 Chat with AI Agents</strong><br><span style="color:#aaa;">Get content, reports, and marketing help instantly</span></td></tr>
</table>
<p style="margin:20px 0;">Visit your dashboard: <a href="${appUrl}/client" style="color:#b86533;">NexusAI Portal</a></p>
<p style="margin:0;">Your dedicated AI team is ready 24/7.<br>Let's grow your business! 🚀</p>
</td></tr>
<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #2a2a2e;color:#888;font-size:12px;">
<p style="margin:0;">NexusAI — AI-Powered Marketing Agency</p></td></tr>
</table></td></tr></table></body></html>`
}

function getOnboardingHtml(name, industry) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#010102;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#010102;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1e;border-radius:12px;border:1px solid #2a2a2e;">
<tr><td style="padding:32px;color:#e8e6e3;font-size:15px;line-height:1.6;">
<p style="font-size:18px;margin:0 0 20px;">Great news, ${name || 'there'}! 🎉</p>
<p style="margin:0 0 20px;">Your <strong>${industry || 'marketing'}</strong> setup is complete. Our AI agents are now working on:</p>
<ul style="color:#ccc;"><li>Social media content calendar</li><li>Audience research & targeting</li><li>Campaign strategy & creative</li></ul>
<p style="margin:0;">We'll notify you as soon as your first content batch is ready!</p>
</td></tr></table></td></tr></table></body></html>`
}

function getReportHtml(name, reportType) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://int-ayanshaikh2491-stacks-projects.vercel.app'
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#010102;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#010102;"><tr><td align="center" style="padding:40px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1e;border-radius:12px;border:1px solid #2a2a2e;">
<tr><td style="padding:32px;color:#e8e6e3;font-size:15px;line-height:1.6;">
<p style="font-size:18px;margin:0 0 20px;">Hey ${name || 'there'},</p>
<p style="margin:0 0 20px;">Your <strong>${reportType || 'report'}</strong> is ready!</p>
<p style="margin:0 0 20px;">See performance metrics, AI recommendations, and growth opportunities.</p>
<p style="text-align:center;margin:30px 0;">
<a href="${appUrl}/client/reports" style="background:#b86533;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">View Report →</a></p>
</td></tr></table></td></tr></table></body></html>`
}
