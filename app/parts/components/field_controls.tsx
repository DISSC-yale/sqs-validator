import type {BaseEntry} from '@/app/types'
import {
  Autocomplete,
  Box,
  Chip,
  FormControlLabel,
  Switch,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material'
import type {ChangeEvent} from 'react'
import {CheckBox, CheckBoxOutlineBlank} from '@mui/icons-material'

export function BaseTypeUI(
  key: string,
  spec: BaseEntry,
  value: boolean | number | string | string[],
  onChange: (e: ChangeEvent | SelectChangeEvent) => void,
  disabled?: boolean,
) {
  const type = spec.type
  const label = spec.label || key
  let control = <Box></Box>
  if (type === 'boolean') {
    control = (
      <FormControlLabel
        label={label}
        labelPlacement="end"
        control={<Switch checked={value as boolean} onChange={onChange} />}
        disabled={disabled || spec.disable}
      />
    )
  } else if (type === 'number') {
    control = (
      <TextField
        value={value as number}
        size="small"
        type="number"
        label={label}
        onChange={onChange}
        disabled={disabled || spec.disable}
        error={!!spec.required && value === ''}
        fullWidth
      ></TextField>
    )
  } else if (type === 'year') {
    const props: {min?: number; max?: number; step: number} = {step: 1}
    if (spec.min) {
      props.min = spec.min === 'current' ? new Date().getFullYear() : new Date('' + spec.min).getFullYear()
    }
    if (spec.max) {
      props.max = spec.max === 'current' ? new Date().getFullYear() : new Date('' + spec.max).getFullYear()
    }
    control = (
      <TextField
        value={value as number}
        size="small"
        type="number"
        label={label}
        onChange={onChange}
        disabled={disabled || spec.disable}
        error={!!spec.required && value === ''}
        slotProps={{htmlInput: props}}
        fullWidth
      ></TextField>
    )
  } else if (type === 'string') {
    const values = spec.values || {}
    const requiredOptions: {[key: string]: boolean} = {}
    Object.keys(values).forEach(k => {
      if (values[k].required) requiredOptions[k] = true
    })
    if (spec.multi) {
      control = (
        <Autocomplete
          size="small"
          fullWidth
          multiple
          options={Object.keys(values)}
          value={(Array.isArray(value) ? value : [value]) as string[]}
          color={!!spec.required && value === '' ? 'error' : 'success'}
          onChange={onChange as any}
          disabled={disabled || spec.disable}
          disableCloseOnSelect
          getOptionLabel={option => values[option].label}
          getOptionDisabled={option =>
            option in requiredOptions && !!value && Array.isArray(value) && value.includes(option) && value.length > 1
          }
          renderValue={(set, getItemProps) =>
            set.map((option, index) => {
              const {key, ...itemProps} = getItemProps({index})
              return (
                <Chip
                  key={key}
                  label={values[option].label}
                  {...itemProps}
                  disabled={option in requiredOptions && (value as string).length > 1}
                />
              )
            })
          }
          renderOption={(props, option, {selected}) => {
            const {key, ...optionProps} = props
            const SelectionIcon = selected ? CheckBox : CheckBoxOutlineBlank
            const valueSpec = values[option]
            return (
              <li key={key} {...optionProps}>
                <SelectionIcon fontSize="small" style={{marginRight: 8, padding: 9, boxSizing: 'content-box'}} />
                {valueSpec.description ?
                  <Tooltip placement="right" title={valueSpec.description}>
                    <Box sx={{width: '100%'}}>{valueSpec.label}</Box>
                  </Tooltip>
                : valueSpec.label}
              </li>
            )
          }}
          renderInput={params => <TextField {...params} label={label} />}
        />
      )
    } else {
      control = (
        <Autocomplete
          size="small"
          fullWidth
          options={Object.keys(values)}
          value={value as string}
          color={!!spec.required && !(value as string).length ? 'error' : 'success'}
          onChange={onChange as any}
          disabled={disabled || spec.disable}
          getOptionLabel={option => option && values[option].label}
          renderInput={params => <TextField {...params} label={label} />}
        />
      )
    }
  } else {
    return <Typography key={key}>Type {type} not yet supported.</Typography>
  }
  return spec.description ?
      <Tooltip key={key} placement="left" title={spec.description}>
        <Box sx={{maxWidth: 500, minWidth: 250}}>{control}</Box>
      </Tooltip>
    : <Box key={key} sx={{maxWidth: 500, minWidth: 250}}>
        {control}
      </Box>
}
