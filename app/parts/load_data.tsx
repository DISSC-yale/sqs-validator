import {FileUpload} from '@mui/icons-material'
import {Alert, Box, Button, Stack, styled, Typography} from '@mui/material'
import {useContext, useState, type ChangeEvent, type DragEvent} from 'react'
import {DataContext, DataEditor} from './builders'
import {fromCSV} from 'arquero'

export const HiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

export default function LoadData() {
  const data = useContext(DataContext)
  const editData = useContext(DataEditor)
  const [error, setError] = useState(false)
  const onLoad = (file: File, result: string) => {
    const data = file.type === 'text/csv' ? fromCSV(result, {autoType: false}) : null
    if (!data) {
      setError(true)
      setTimeout(() => setError(false), 5e3)
    } else {
      editData({type: 'replace', data: {file, data}})
    }
  }
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{p: 1, pl: 2, height: '100%', alignItems: 'center'}}
      className="dropzone"
      onDragOver={(e: DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDrop={(e: DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
          const file = e.dataTransfer.files[0]
          const reader = new FileReader()
          reader.onload = () => {
            onLoad(file, reader.result as string)
          }
          reader.readAsText(file)
        }
      }}
    >
      <Box>
        <Button
          variant={data && data.data ? 'outlined' : 'contained'}
          component="label"
          startIcon={<FileUpload />}
          className="dropzone"
        >
          Load Data
          <HiddenInput
            type="file"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files && e.target.files.length) {
                const file = e.target.files[0]
                const reader = new FileReader()
                reader.onload = () => {
                  onLoad(file, reader.result as string)
                  e.target.value = ''
                }
                reader.readAsText(file)
              }
            }}
          />
        </Button>
      </Box>
      {error ?
        <Alert severity="error">File not recognized as a CSV.</Alert>
      : data && (
          <Box>
            <Box>
              <Typography>{data.file.name}</Typography>
            </Box>
          </Box>
        )
      }
    </Stack>
  )
}
