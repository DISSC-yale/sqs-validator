import {FileDownload, FileUpload} from '@mui/icons-material'
import {Alert, Button, Stack} from '@mui/material'
import {useContext, type ChangeEvent, type DragEvent} from 'react'
import {background, DataContext, JobContext, JobEditor} from './builders'
import type {JobSpec} from '../types'
import {HiddenInput} from './load_data'
import type Validator from '../validator'

export default function SpecIO() {
  const data = useContext(DataContext)
  const job = useContext(JobContext)
  const editJob = useContext(JobEditor)
  const onLoad = (result: string) => {
    const spec = JSON.parse(result) as JobSpec
    editJob({type: 'replace', spec})
  }
  const passing = job.validation && job.validation.passed
  return (
    <Stack
      direction="row"
      spacing={1}
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
            onLoad(reader.result as string)
          }
          reader.readAsText(file)
        }
      }}
      sx={{p: 2, justifyContent: 'space-between'}}
    >
      <Button variant="outlined" component="label" startIcon={<FileUpload />} className="dropzone">
        Load Job Spec
        <HiddenInput
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length) {
              const file = e.target.files[0]
              const reader = new FileReader()
              reader.onload = () => {
                onLoad(reader.result as string)
                e.target.value = ''
              }
              reader.readAsText(file)
            }
          }}
        />
      </Button>
      <Stack direction="row" spacing={1}>
        {passing ?
          <Alert severity="success">Job is valid</Alert>
        : data ?
          <Alert severity="error">Job is not valid</Alert>
        : <Alert severity="info">Load data to validate</Alert>}
        <Button
          variant="contained"
          component="label"
          startIcon={<FileDownload />}
          color={passing ? 'primary' : 'error'}
          onClick={() => {
            const a = document.createElement('a')
            a.setAttribute(
              'href',
              URL.createObjectURL(
                new Blob([(background.validator as Validator).printJob(job)], {type: 'application/json'}),
              ),
            )
            a.setAttribute('download', 'sqs_job.json')
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
          }}
        >
          Download Job Spec
        </Button>
      </Stack>
    </Stack>
  )
}
