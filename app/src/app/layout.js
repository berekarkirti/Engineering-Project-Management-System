import Script from "next/script"
import "./globals.css"
import SessionProvider from "@/components/SessionProvider"
import ErrorBoundary from "@/components/ErrorBoundary"

export const metadata = {
  title: "Engineering Project Management System",
  description: "Comprehensive project management system for engineering projects",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        <ErrorBoundary>
          <SessionProvider>
            {children}
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
