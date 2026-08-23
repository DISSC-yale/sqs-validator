'use client'

import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode} from 'react'

const theme = createTheme({
  colorSchemes: {
    dark: {palette: {mode: 'dark', primary: {main: '#a5cdff'}, secondary: {main: '#68abff'}}},
    light: {
      palette: {mode: 'light', primary: {main: '#041e42'}, secondary: {main: '#63666A'}},
    },
  },
})

export default function Home() {
  return (
    <StrictMode>
      <ThemeProvider theme={theme} defaultMode="dark" noSsr>
        <div suppressHydrationWarning={true}>
          <CssBaseline enableColorScheme />
        </div>
      </ThemeProvider>
    </StrictMode>
  )
}