import {useContext, useMemo, type ChangeEvent, type JSX} from 'react'
import {background, DataContext, JobContext, JobEditor} from '../builders'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import type {DataObject, VariableType} from '../../types'
import type Validator from '../../validator'
import {BaseTypeUI} from '../components/field_controls'

export default function DefineVariables() {
  const validator = background.validator as Validator
  const data = useContext(DataContext) as DataObject
  const job = useContext(JobContext)
  const editJob = useContext(JobEditor)

  const specUI = useMemo(() => {
    if (validator) {
      const typeOptions = [
        {type: 'undefined', description: 'undefined'},
        ...Object.values(validator.spec.job_spec.variables),
      ].map(({type, description}) => (
        <MenuItem value={type} disabled={type === 'undefined'}>
          <Tooltip placement="left" title={description}>
            <Typography sx={{width: '100%'}}>{type}</Typography>
          </Tooltip>
        </MenuItem>
      ))
      const fieldUIs: {[key: string]: (props: {variableSpec: VariableType; index: number}) => JSX.Element} = {}
      Object.values(validator.spec.job_spec.variables).forEach(({type, fields}) => {
        const fieldNames = Object.keys(fields).filter(n => n !== 'name')
        fieldUIs[type] = ({variableSpec, index}: {variableSpec: VariableType; index: number}) => {
          return (
            <>
              {fieldNames.map(field => {
                const fieldSpec = fields[field]
                const value = variableSpec[field as 'name']
                return BaseTypeUI(
                  `${field}-${index}`,
                  fieldSpec,
                  value,
                  (e: ChangeEvent | SelectChangeEvent, newValue?: string) => {
                    const value =
                      fieldSpec.type === 'boolean' ?
                        !variableSpec[field as 'name']
                      : newValue || (e.target as HTMLInputElement).value || ''
                    editJob({
                      type: 'variable_edit',
                      id: variableSpec.name,
                      field,
                      value,
                    })
                  },
                  variableSpec.name === value,
                )
              })}
            </>
          )
        }
      })
      return {typeOptions, fieldUIs}
    }
  }, [!validator])
  const variable_listing = useMemo(() => {
    if (data && specUI) {
      job.variables = validator.fillVariables(job.variables, data.data)
      return Object.values(job.variables).map((variable, i) => {
        const FieldControls = specUI.fieldUIs[variable.type]
        return (
          <Card key={i} sx={{maxWidth: 1000}} variant="outlined">
            <CardHeader
              title={<Typography variant="h5">{variable.name}</Typography>}
              action={
                <FormControl sx={{width: 130}}>
                  <InputLabel id={`type_select_${variable.name}_label`}>Type</InputLabel>
                  <Select
                    labelId={`type_select_${variable.name}_label`}
                    id={`type_select_${variable.name}`}
                    value={variable.type}
                    label="Type"
                    size="small"
                    error={variable.type === 'undefined'}
                    onChange={e => {
                      editJob({
                        type: 'variable_edit',
                        id: variable.name,
                        field: 'type',
                        value: e.target.value,
                      })
                    }}
                  >
                    {specUI.typeOptions}
                  </Select>
                </FormControl>
              }
              sx={{pl: 1, alignItems: 'flex-start'}}
            />
            <CardContent sx={{p: 2, pt: 0, pb: '16px !important'}}>
              <Stack direction="row" spacing={1}>
                {FieldControls && <FieldControls variableSpec={variable} index={i} />}
              </Stack>
            </CardContent>
          </Card>
        )
      })
    }
  }, [specUI, job.variables])
  return (
    <Box sx={{height: '100%'}}>
      <Box sx={{p: 1, height: 45}}>
        {job.validation && job.validation.errors.variables.length ?
          <Typography color="error">{job.validation.errors.variables}</Typography>
        : <Typography color="success">All variables are accounted for.</Typography>}
      </Box>
      <Box sx={{height: 'calc(100% - 37px)', overflowY: 'auto'}}>
        <Stack spacing={1}>{variable_listing}</Stack>
      </Box>
    </Box>
  )
}
