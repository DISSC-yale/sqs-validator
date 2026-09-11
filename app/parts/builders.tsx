import {createContext, useEffect, useReducer, useState, type ReactNode} from 'react'
import type {DataEditAction, DataObject, JobSpec, JobSpecAction, ValidationSpec} from '../types'
import Validator from '../validator'

const defaultJobSpec: JobSpec = {
  variables: {},
  settings: {},
  outputs: {},
}

export const DataContext = createContext<null | DataObject>(null)
export const DataEditor = createContext((action: DataEditAction) => {})
export const JobContext = createContext(defaultJobSpec)
export const JobEditor = createContext((action: JobSpecAction) => {})

export const background: {validator: Validator | null} = {validator: null}

export function BuildingContext({children}: {children: ReactNode}) {
  const [data, setData] = useState<null | DataObject>(null)
  const editJobSpec = (state: JobSpec, action: JobSpecAction) => {
    const validator = background.validator as Validator
    if (action.type === 'replace') {
      action.spec.settings = validator.fillDefaults(state, 'settings')
      action.spec.outputs = validator.fillDefaults(state, 'outputs')
      action.spec.validation = data ? validator.validate(action.spec, data.data) : validator.newReport()
      return action.spec
    }
    state.settings = validator.fillDefaults(state, 'settings')
    state.outputs = validator.fillDefaults(state, 'outputs')
    if (action.type === 'variable_edit') {
      if (action.field === 'type') {
        const newSpec = validator.structureVariable(action.id, action.value as string)
        state.variables[action.id] = newSpec
      } else {
        state.variables[action.id] = {
          ...state.variables[action.id],
          [action.field as 'name']: action.value as string,
        }
      }
      state.variables = {...state.variables}
      state.validation = data ? validator.validate(state, data.data) : validator.newReport()
    } else if (action.type === 'settings_edit') {
      if ('value' in action) {
        state.settings[action.id as 'group_by_tax_year'] = action.value as boolean
      } else {
        delete state.settings[action.id as 'group_by_tax_year']
      }
      state.settings = {...state.settings}
      if (data && action.id.startsWith('group_by')) {
        state.validation = validator.validate(state, data.data)
      }
    } else if (action.type === 'outputs_edit') {
      if ('value' in action) {
        state.outputs[action.id] = action.value as string
      } else {
        delete state.outputs[action.id]
      }
      state.outputs = {...state.outputs}
    } else if (action.type === 'validation') {
      if (action.step == 'full') {
        state.validation = data ? validator.validate(state, data.data) : validator.newReport()
      } else if (action.step == 'reset') {
        state.validation = validator.newReport()
      } else {
        const report = state.validation || validator.newReport()
        if (action.step === 'variables') {
          report.errors[action.step] = validator.checkVariables(state.variables)
        } else if (data && action.step === 'values') {
          report.errors[action.step] = validator.checkCells(state.variables, data.data)
        } else {
          report.errors[action.step] = []
        }
        state.validation = report
      }
    }
    return {...state}
  }
  const [job, jobAction] = useReducer(editJobSpec, JSON.parse(JSON.stringify(defaultJobSpec)))
  useEffect(() => {
    fetch('validation_spec.json.gz')
      .then(async res => {
        const blob = await res.blob()
        const spec = (await new Response(
          await blob.stream().pipeThrough(new DecompressionStream('gzip')),
        ).json()) as ValidationSpec
        background.validator = new Validator(spec)
        jobAction({type: 'replace', spec: job})
      })
      .catch(e => {
        console.error(e)
      })
  }, [])
  return (
    <DataContext.Provider value={data}>
      <DataEditor.Provider
        value={(action: DataEditAction) => {
          if (action.type === 'replace') {
            setData(action.data)
            jobAction({type: 'validation', step: 'full'})
          }
        }}
      >
        <JobContext.Provider value={job}>
          <JobEditor.Provider value={jobAction}>{children}</JobEditor.Provider>
        </JobContext.Provider>
      </DataEditor.Provider>
    </DataContext.Provider>
  )
}
