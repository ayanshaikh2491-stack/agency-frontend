import './globals.css'

export const metadata = {
  title: 'Agency Control Center',
  description: 'AI Marketing Agency — Control Panel',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
