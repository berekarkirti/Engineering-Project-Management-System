import Script from "next/script"
import "./globals.css"
import SessionProvider from "@/components/SessionProvider"

export const metadata = {
  title: "Engineering Project Management System",
  description: "Comprehensive project management system for engineering projects",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
          strategy="beforeInteractive"
        />
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
