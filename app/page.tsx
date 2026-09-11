'use client'

import {AppBar, Box, IconButton, Paper, Toolbar, Typography, useColorScheme} from '@mui/material'
import CssBaseline from '@mui/material/CssBaseline'
import {BuildingContext} from './parts/builders'
import type {DragEvent} from 'react'
import Steps from './parts/steps'
import LoadData from './parts/load_data'
import {DarkMode, LightMode} from '@mui/icons-material'
import SpecIO from './parts/spec_io'

export default function Home() {
  const {mode, setMode} = useColorScheme()
  return (
    <>
      <CssBaseline />
      <Box
        sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'}}
        onDragOver={(e: DragEvent) => {
          e.preventDefault()
          if (e.dataTransfer && e.target && !(e.target as HTMLElement).classList.contains('dropzone')) {
            e.dataTransfer.dropEffect = 'none'
          }
        }}
      >
        <AppBar component="nav">
          <Toolbar variant="dense" sx={{justifyContent: 'space-between'}}>
            <Typography>SQS Validator</Typography>
            <IconButton
              onClick={() => {
                setMode(mode === 'dark' ? 'light' : 'dark')
              }}
            >
              {mode === 'dark' ?
                <LightMode />
              : <DarkMode sx={{color: '#fff'}} />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <BuildingContext>
          <Box sx={{position: 'absolute', top: 48, left: 0, right: 0, height: 80}}>
            <Paper sx={{height: '100%'}}>
              <LoadData />
            </Paper>
          </Box>
          <Box sx={{position: 'absolute', top: 128, left: 0, right: 0, bottom: 80}}>
            <Steps />
          </Box>
          <Box sx={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 80}}>
            <Paper>
              <SpecIO />
            </Paper>
          </Box>
        </BuildingContext>
      </Box>
    </>
  )
}
