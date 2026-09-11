import {ThemeProvider} from '@mui/material/styles'
import type {Metadata} from 'next'
import theme from './theme'
import {StrictMode} from 'react'

export const metadata: Metadata = {
  title: 'SQS Validator',
  description: 'Secure query system (SQS) data validator',
}

export default function RootLayout({children}: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StrictMode>
          <ThemeProvider theme={theme} defaultMode="dark" noSsr>
            {children}
          </ThemeProvider>
        </StrictMode>
      </body>
    </html>
  )
}
