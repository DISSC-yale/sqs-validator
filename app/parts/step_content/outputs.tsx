import {useContext, useMemo, type ChangeEvent, type ReactElement} from 'react'
import {background, JobContext, JobEditor} from '../builders'
import type Validator from '@/app/validator'
import {BaseTypeUI} from '../components/field_controls'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import type {BaseEntry} from '@/app/types'
import {ExpandMore} from '@mui/icons-material'

export default function SelectOutputs() {
  const validator = background.validator as Validator
  const job = useContext(JobContext)
  const editJob = useContext(JobEditor)

  const menu = useMemo(() => {
    if (validator) {
      const renderOptionSet = (options: {[key: string]: BaseEntry}, set: 'settings' | 'outputs', parent?: string) => {
        const settings = job[set]
        const standard: ReactElement[] = []
        const advanced: ReactElement[] = []
        Object.keys(options).forEach((id, index) => {
          const spec = options[id]
          const value = settings[id as 'group_by_tax_year'] || ''
          const parentSet = !!parent && !settings[parent as 'group_by_tax_year']
          const outputSet = spec.advanced ? advanced : standard
          const control = BaseTypeUI(
            `${id}-${index}`,
            spec,
            value,
            (e: ChangeEvent | SelectChangeEvent, newValue?: string | string[] | ReactElement) => {
              const value =
                'string' === typeof newValue || Array.isArray(newValue) ? newValue
                : spec.type === 'boolean' ? !settings[id as 'group_by_tax_year']
                : (e.target as HTMLInputElement).value || ''
              if (spec.type === 'string' && spec.values && Array.isArray(value) && value.length) {
                Object.keys(spec.values).forEach(k => {
                  if (spec.values && spec.values[k].required && !value.includes(k)) value.splice(0, 0, k)
                })
              }
              editJob({
                type: `${set}_edit`,
                id,
                value,
              })
            },
            parentSet,
          )
          if (spec.suboptions) {
            const suboptions = spec.suboptions
            outputSet.push(
              <Card key={`${id}-card`} variant="outlined">
                <CardHeader title={control} sx={{pt: 1, pb: 1}} />
                <CardContent>
                  <Stack spacing={1}>{renderOptionSet(suboptions, set, id)}</Stack>
                </CardContent>
              </Card>,
            )
          } else {
            outputSet.push(control)
          }
        })
        return (
          <>
            {standard}
            {advanced.length ?
              <Accordion variant="outlined">
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`${set}-advanced-content`}
                  id={`${set}-advanced-header`}
                >
                  <Typography>Advanced</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>{advanced}</Stack>
                </AccordionDetails>
              </Accordion>
            : <></>}
          </>
        )
      }
      return {
        settings: renderOptionSet(validator.spec.job_spec.settings, 'settings'),
        outputs: renderOptionSet(validator.spec.job_spec.outputs, 'outputs'),
      }
    }
  }, [job, !validator])

  return (
    <Box sx={{height: '100%', overflowY: 'auto'}}>
      {menu && (
        <Stack spacing={1}>
          <Card>
            <CardHeader title="Settings" sx={{pt: 1, pb: 1}} />
            <CardContent sx={{height: 'calc(100% - 48px)', pt: 1, pb: 1}}>
              <Stack spacing={1}>{menu.settings}</Stack>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Outputs" sx={{pt: 1, pb: 1}} />
            <CardContent sx={{height: 'calc(100% - 48px)', pt: 1, pb: 1}}>
              <Stack spacing={1}>{menu.outputs}</Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  )
}
