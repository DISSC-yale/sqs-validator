// Validator spec

import type {ColumnTable} from 'arquero'

export type CategoricalRule = {
  required?: string | string[]
  optional?: string | string[]
  exclude?: string | string[]
  n_min?: number
  n_max?: number
}

export type DefaultConditions<T> = {starts_with?: string; ends_with?: string; includes?: string; value: T}[]

export type StringEntry = {
  type: 'string'
  values?: {[key: string]: {label: string; description?: string; required?: boolean}}
  pattern?: string
  prefix?: string
  multi?: boolean
  default?: DefaultConditions<string | string[]>
}

export type BooleanEntry = {type: 'boolean'; default?: DefaultConditions<boolean>}
export type NumericEntry = {type: 'number' | 'year'; min?: string; max?: string; default?: DefaultConditions<number>}

export type BaseEntry = {
  label?: string
  description?: string
  required?: boolean
  disable?: boolean
  advanced?: boolean
  suboptions?: {[key: string]: BaseEntry}
} & (
  | BooleanEntry
  | NumericEntry
  | StringEntry
  | {type: 'array'; min_length?: number; max_length?: number}
  | {type: 'object'; structure: {[key: string]: BaseEntry}}
)

export type VariableRules = {
  n_min?: number
  n_max?: number
  fields: {[key: string]: CategoricalRule[]}
}
export type VariableSpec = {
  type: string
  description: string
  fields: {name: StringEntry; [key: string]: BaseEntry}
  rules: VariableRules
}

export type RenderedVariableSpec = {
  match: (value: string) => boolean
  make: (name: string) => VariableType
}

export type CellRuleSpec = {not?: boolean} & (
  | {type: 'length'; exact?: number; min?: number; max?: number}
  | {type: 'pattern'; value: string}
  | {type: 'match'; value: string | string[]}
  | {type: 'substring'; range: [number, number]; value: string | string[]}
  | {
      type: 'date'
      pattern: string
      min?: string
      max?: string
    }
)

export type RowRuleSpec = {
  present_identifiers: string[][]
  min_years: number
}

export type ValidationSpec = {
  version: string
  settings: {
    allow_unidentified_columns: boolean
    min_group_size: number
  }
  cell_requirements: {
    [key: string]: CellRuleSpec[]
  }
  row_requirements: RowRuleSpec
  job_spec: {
    variables: {[key: string]: VariableSpec}
    outputs: {[key: string]: BaseEntry}
    settings: {[key: string]: BaseEntry}
  }
}

// Data

export type DataObject = {file: File; data: ColumnTable}

export type DataEditAction = {
  type: 'replace'
  data: DataObject
}

// Job spec

export type ErrorIndex = {id: number; col?: string; error: string}
export type ErrorGroup = {[key: string]: string | number; id: number; count: number}

export type ValidationReport = {
  spec_version: string
  passed: boolean
  errors: {
    variables: string[]
    values: ErrorIndex[]
    rows: ErrorIndex[]
    groups: ErrorGroup[]
  }
}

export type VariableType = {name: string} & (
  | {
      type: 'identifier'
      alias: 'ssn' | 'ssn4' | 'fname' | 'lname' | 'dob' | 'yob' | 'zip5'
    }
  | {
      type: 'group'
      rollup: boolean
      priority: number
    }
  | {
      type: 'year'
      role: 'single' | 'range_start' | 'range_end'
    }
  | {type: 'undefined'}
)

export type VariableTypes = {[key: string]: VariableType}

export type Settings = {
  reference_tax_year?: number | number[] | {start?: number; end?: number}
  inflation_adjustment_year?: number
  group_by_tax_year?: boolean
  group_by_matching_strategy?: boolean
}

export type JobSpec = {
  variables: VariableTypes
  outputs: {[key: string]: boolean | string | string[]}
  settings: Settings
  validation?: ValidationReport
  groups?: {[key: string]: string | number; count: number}[]
}

export type VariableTypeSummary = {[key: string]: {count: number; field_values: {[key: string]: Set<string>}}}

export type VariableRuleChecks = {
  [key: string]: ((summary: VariableTypeSummary) => string)[]
}
export type CellRuleChecks = {
  [key: string]: ((value: string) => string)[]
}

export type JobSpecAction =
  | {
      type: 'replace'
      spec: JobSpec
    }
  | {type: 'set'; key: string; value: any}
  | {type: 'variable_edit'; id: string; field: string; value: string | number | boolean}
  | {type: 'settings_edit'; id: string; value?: string | number | boolean | string[]}
  | {type: 'outputs_edit'; id: string; value?: string | number | boolean | string[]}
  | {type: 'validation'; step: 'full' | 'reset' | 'variables' | 'values' | 'rows' | 'groups'}
