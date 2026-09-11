'use client'

import {createTheme} from '@mui/material/styles'

const theme = createTheme({
  colorSchemes: {
    dark: {
      palette: {
        mode: 'dark',
        primary: {main: '#a5cdff'},
        secondary: {main: '#68abff'},
        success: {main: '#80b2ff'},
        error: {main: '#ff7979'},
      },
    },
    light: {
      palette: {
        mode: 'light',
        primary: {main: '#041e42'},
        secondary: {main: '#63666A'},
        success: {main: '#004ec6'},
        error: {main: '#a70000'},
      },
    },
  },
})

export default theme
