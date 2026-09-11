import type {ColumnTable} from 'arquero'
import type {
  BaseEntry,
  CellRuleChecks,
  CellRuleSpec,
  DefaultConditions,
  ErrorGroup,
  ErrorIndex,
  JobSpec,
  RenderedVariableSpec,
  RowRuleSpec,
  Settings,
  StringEntry,
  ValidationReport,
  ValidationSpec,
  VariableRuleChecks,
  VariableSpec,
  VariableType,
  VariableTypes,
  VariableTypeSummary,
} from './types'

export default class Validator {
  spec: ValidationSpec
  rendered_variables: {[key: string]: RenderedVariableSpec}
  variable_checks: VariableRuleChecks
  cell_checks: CellRuleChecks
  variable_types: string[]
  defaults: {settings: Settings; outputs: {[key: string]: {value: boolean | string | string[]}}}
  row_check: (variableMap: {[key: string]: string}, row: {[key: string]: string}) => string

  constructor(spec: ValidationSpec) {
    this.spec = spec
    this.rendered_variables = {}
    this.variable_checks = {}
    this.cell_checks = {}
    this.variable_types = []
    this.defaults = {
      settings: this.fillDefaults({}, 'settings'),
      outputs: this.fillDefaults({}, 'outputs'),
    }
    const variables = spec.job_spec.variables
    Object.keys(variables).forEach(type => {
      const variable = variables[type]
      this.variable_types.push(type)
      this.rendered_variables[type] = renderVariable(variable)
      this.variable_checks[type] = renderVariableRules(variable)
    })
    Object.keys(spec.cell_requirements).forEach(name => {
      this.cell_checks[name] = renderCellRules(spec.cell_requirements[name])
    })
    this.row_check = renderRowRules(spec.row_requirements)
  }
  validate(job: JobSpec, data: ColumnTable, skipValues?: boolean) {
    const report = skipValues && job.validation ? {...job.validation} : this.newReport()
    const {errors} = report
    const variables = this.fillVariables(job.variables || {}, data)
    job.variables = variables
    errors.variables = this.checkVariables(variables)
    if (!skipValues) {
      errors.values = this.checkCells(variables, data)
    }
    errors.rows = this.checkRows(variables, data)
    const groupCounts = this.countGroups(variables, data, job.settings)
    job.groups = groupCounts.objects() as {count: number}[]
    errors.groups = (
      groupCounts.filter(`d.count < ${this.spec.settings.min_group_size}`).objects() as ErrorGroup[]
    ).map((l, i) => {
      l.id = i
      return l
    })
    report.passed = errors.variables.length + errors.groups.length + errors.rows.length + errors.values.length === 0
    return report
  }
  newReport(): ValidationReport {
    return {
      spec_version: this.spec.version,
      passed: false,
      errors: {
        variables: [],
        values: [],
        rows: [],
        groups: [],
      },
    }
  }
  fillVariables(variables: VariableTypes, data: ColumnTable) {
    const newVariables: VariableTypes = {}
    data.columnNames().forEach(name => {
      newVariables[name] = this.structureVariable(name, '', variables[name])
    })
    return newVariables
  }
  fillDefaults(job: any, entry: 'settings' | 'outputs') {
    const output = job[entry] || {}
    const spec = this.spec.job_spec[entry]
    fillStructure(spec, output)
    return output
  }
  checkVariables(variables: VariableTypes) {
    const summary: VariableTypeSummary = {}
    const resses: string[] = []
    const specs = this.spec.job_spec.variables
    Object.values(variables).forEach(variable => {
      if (!(variable.type in summary)) summary[variable.type] = {count: 0, field_values: {}}
      const s = summary[variable.type]
      s.count++
      const variableSpec = specs[variable.type]
      const fieldSpecs: {[key: string]: any} = variableSpec ? variableSpec.fields : {}
      Object.keys(variable).forEach(field => {
        if (!(field in s.field_values)) s.field_values[field] = new Set()
        s.field_values[field].add(variable[field as 'name'])
        if (field in fieldSpecs) {
          if (fieldSpecs[field].required && variable[field as 'name'] === '') {
            resses.push(`${variable.type}: ${variable.name} ${fieldSpecs[field].label || field} is required`)
          }
        }
      })
    })
    for (const type in this.variable_checks) {
      const res = [...new Set(this.variable_checks[type].map(check => check(summary)))].filter(r => !!r)
      if (res.length) {
        resses.push(`${type}: ${res.join(', ')}`)
      }
    }
    if (!this.spec.settings.allow_unidentified_columns && summary.undefined) {
      resses.push(`unidentified variables: ${[...summary.undefined.field_values.name].join(', ')}`)
    }
    return resses
  }
  checkCells(variables: VariableTypes, data: ColumnTable) {
    const errors: ErrorIndex[] = []
    const colnames = data.columnNames()
    Object.values(variables).forEach(variable => {
      const col = variable.name
      if (!colnames.includes(col)) return
      const alias =
        variable.type === 'identifier' ? variable.alias
        : variable.type === 'year' ? 'year'
        : col
      if (alias in this.cell_checks) {
        this.cell_checks[alias].map(check =>
          data.scan(i => {
            const r = check(data.get(col, i))
            if (r) errors.push({id: 1 + (i as number), col, error: r})
          }),
        )
      }
    })
    return errors
  }
  checkRows(variables: VariableTypes, data: ColumnTable) {
    const variableMap: {[key: string]: string} = {}
    Object.values(variables).forEach(variable => {
      if (variable.type === 'identifier') {
        variableMap[variable.name] = variable.alias
      } else if (variable.type === 'year') {
        variableMap[variable.name] = 'year'
      }
    })
    const errors: ErrorIndex[] = []
    data.objects().forEach((row, id) => {
      const error = this.row_check(variableMap, row as {[key: string]: string})
      if (error) errors.push({id, error})
    })
    return errors
  }
  countGroups(variables: VariableTypes, data: ColumnTable, settings: Settings) {
    const groupVars: string[] = []
    Object.values(variables).forEach(variable => {
      if (variable.type === 'group') {
        groupVars.push(variable.name)
      }
    })
    return data.groupby(groupVars).count()
  }
  structureVariable(name: string, type?: string, existing?: VariableType): VariableType {
    if (type) {
      if (type in this.rendered_variables) {
        return this.rendered_variables[type].make(name)
      }
    } else if (existing) {
      if (existing.type in this.rendered_variables) {
        const base = this.rendered_variables[existing.type].make(name)
        Object.keys(existing).forEach(k => {
          if (k in base) base[k as 'name'] = existing[k as 'name']
        })
        return base
      }
    } else {
      for (const type in this.rendered_variables) {
        const {match, make} = this.rendered_variables[type]
        if (match(name)) return make(name)
      }
    }
    return {name, type: 'undefined'}
  }
  printJob(job: JobSpec) {
    const selectJob = {...job}
    selectJob.settings = clearDefaults(job.settings, this.defaults.settings, this.spec.job_spec.settings)
    selectJob.outputs = clearDefaults(job.outputs, this.defaults.outputs, this.spec.job_spec.outputs)
    return JSON.stringify(selectJob, null, 2)
  }
}

function clearDefaults(
  settings: {[key: string]: any},
  defaults: {[key: string]: any},
  spec: {[key: string]: BaseEntry},
) {
  const cleaned: {[key: string]: any} = {}
  Object.keys(defaults).forEach(k => {
    if (
      k in settings &&
      ((k in spec && spec[k].disable) ||
        (typeof defaults[k] !== typeof settings[k] || Array.isArray(defaults[k]) ?
          defaults[k].sort().join('') !== settings[k].sort().join('')
        : defaults[k] !== settings[k]))
    ) {
      cleaned[k] = settings[k]
    }
  })
  return cleaned
}

const baseTypeMap = {
  string: '',
  boolean: false,
  number: '',
}

function resolveDefaultCondition(entry: string, conditions: DefaultConditions<boolean | number | string | string[]>) {
  const n = conditions.length
  for (let i = 0; i < n; i++) {
    const condition = conditions[i]
    const value = Array.isArray(condition.value) ? [...condition.value] : condition.value
    if (condition.starts_with) {
      if (entry.startsWith(condition.starts_with)) {
        return value
      }
    } else if (condition.ends_with) {
      if (entry.endsWith(condition.ends_with)) {
        return value
      }
    } else if (condition.includes) {
      if (entry.includes(condition.includes)) {
        return value
      }
    } else {
      return value
    }
  }
}

function typeMap(entry: string, typeSpec: BaseEntry) {
  const hasDefault = 'default' in typeSpec
  if (typeSpec.type === 'array' || (typeSpec.type === 'string' && typeSpec.multi && !hasDefault)) return []
  if (typeSpec.type === 'object') return {}
  if (hasDefault) {
    const value = resolveDefaultCondition(entry, typeSpec.default || [])
    if ('undefined' !== typeof value) return value
  } else if (typeSpec.type === 'string' && typeof typeSpec.values === 'object' && entry in typeSpec.values) {
    return entry
  }
  return baseTypeMap[typeSpec.type as 'string']
}

function renderVariable({type, fields}: VariableSpec): RenderedVariableSpec {
  const structure: {[key: string]: any} = {}
  let match = (value: string) => false
  Object.keys(fields).forEach(entry => {
    const baseSpec = fields[entry]
    const activeSpec = 'values' in baseSpec && 'string' === typeof baseSpec.values ? fields[baseSpec.values] : baseSpec
    if (entry === 'name' && activeSpec.type === 'string') {
      if (activeSpec.values) {
        const values = activeSpec.values
        match = (value: string) => value in values
      } else if (activeSpec.prefix) {
        const prefix = activeSpec.prefix
        match = (value: string) => value.startsWith(prefix)
      }
    }
    structure[entry] = (name: string) => typeMap(name, activeSpec)
  })
  return {
    match,
    make: (name: string) => {
      const entry: {[key: string]: any} = {type}
      Object.keys(structure).forEach(key => {
        entry[key] = structure[key](name)
      })
      entry.name = name
      return entry as VariableType
    },
  }
}

function printStringList(l: string | string[]) {
  return Array.isArray(l) ? l.join(', ') : l
}

function renderVariableRules({type, rules}: VariableSpec) {
  const extract = (summary: VariableTypeSummary) => (type in summary ? summary[type] : {count: 0, field_values: {}})
  const checks = [
    (summary: VariableTypeSummary) => (extract(summary).count < (rules.n_min || 1) ? `too few ${type} variables` : ''),
  ]
  if ('n_max' in rules) {
    checks.push((summary: VariableTypeSummary) =>
      rules.n_max && extract(summary).count > rules.n_max ? `too many ${type} variables` : '',
    )
  }
  rules.fields &&
    Object.keys(rules.fields).forEach(field => {
      const rs = rules.fields[field]
      checks.push((summary: VariableTypeSummary) => {
        const s = extract(summary)
        const l = s.field_values && s.field_values[field]
        if (!l) return ''
        const resses = rs.map(r => {
          const res = {require: '', optional: '', exclude: ''}
          if (r.required) {
            const pass = Array.isArray(r.required) ? r.required.every(v => l.has(v)) : l.has(r.required)
            res.require = pass ? '' : `requires ${printStringList(r.required)}`
          }
          if (r.optional) {
            let count = 0
            if (Array.isArray(r.optional)) {
              r.optional.forEach(v => {
                count += +l.has(v)
              })
            } else {
              count += +l.has(r.optional)
            }
            if (r.n_min && count < r.n_min) {
              res.optional = `missing ${r.n_min - count} optional variables (${printStringList(r.optional)})`
            } else if (r.n_max && count > r.n_max) {
              res.optional = `${count - r.n_max} too many optional variables (${printStringList(r.optional)})`
            }
          }
          if (r.exclude) {
            let any = false
            if (Array.isArray(r.exclude)) {
              for (let i = r.exclude.length; i--; ) {
                if (l.has(r.exclude[i])) {
                  any = true
                  break
                }
              }
            } else {
              any = l.has(r.exclude)
            }
            res.exclude = any ? `variables are not allowed: ${printStringList(r.exclude)}` : ''
          }
          return res.require || res.exclude || res.optional
        })
        return resses.length && !resses.includes('') ? field + ': ' + resses.join(' or ') : ''
      })
    })

  return checks
}

function renderCellRules(rules: CellRuleSpec[]) {
  return rules.map(rule => {
    if (rule.type === 'length') {
      const min = rule.min
      const exact = rule.exact
      const max = rule.max
      return (
        rule.not ?
          exact ?
            (value: string) => {
              if (!value) return ''
              return value.length !== exact ? '' : `length of ${value} is ${exact}`
            }
          : (value: string) => {
              if (!value) return ''
              const l = value.length
              return (
                min && l > min ? `length of ${value} is over ${min}`
                : max && l < max ? `length of ${value} is under ${max}`
                : ''
              )
            }
        : exact ?
          (value: string) => {
            if (!value) return ''
            return value.length === exact ? '' : `length of ${value} is not ${exact}`
          }
        : (value: string) => {
            if (!value) return ''
            const l = value.length
            return (
              min && l < min ? `length of ${value} is under ${min}`
              : max && l > max ? `length of ${value} is over ${max}`
              : ''
            )
          }
      )
    }
    if (rule.type === 'pattern') {
      const pattern = new RegExp(rule.value)
      return rule.not ?
          (value: string) => (!value || !pattern.test(value) ? '' : `${value} matches ${rule.value}`)
        : (value: string) => (!value || pattern.test(value) ? '' : `${value} does not match ${rule.value}`)
    }
    if (rule.type === 'match') {
      const targetValue = rule.value
      return (
        rule.not ?
          Array.isArray(targetValue) ?
            (value: string) =>
              !value || !targetValue.includes(value) ? '' : `${value} is in ${printStringList(targetValue)}`
          : (value: string) => (!value || targetValue !== value ? '' : `${value} is not allowed`)
        : Array.isArray(targetValue) ?
          (value: string) =>
            !value || targetValue.includes(value) ? '' : `${value} is not in ${printStringList(targetValue)}`
        : (value: string) => (!value || targetValue === value ? '' : `${value} is not ${targetValue}`)
      )
    }
    if (rule.type === 'substring') {
      const targetValue = rule.value
      const range = rule.range
      return (
        rule.not ?
          Array.isArray(targetValue) ?
            (value: string) =>
              !value || !targetValue.includes(value.substring(range[0], range[1])) ?
                ''
              : `substring ${value.substring(range[0], range[1])} is in ${printStringList(targetValue)}`
          : (value: string) =>
              !value || targetValue !== value.substring(range[0], range[1]) ?
                ''
              : `substring ${value.substring(range[0], range[1])} is ${targetValue}`
        : Array.isArray(targetValue) ?
          (value: string) =>
            !value || targetValue.includes(value.substring(range[0], range[1])) ?
              ''
            : `substring ${value.substring(range[0], range[1])} is not in ${printStringList(targetValue)}`
        : (value: string) =>
            !value || targetValue === value.substring(range[0], range[1]) ?
              ''
            : `substring ${value.substring(range[0], range[1])} is not ${targetValue}`
      )
    }
    if (rule.type === 'date') {
      const min =
        rule.min ?
          rule.min === 'current' ?
            new Date()
          : new Date(rule.min)
        : null
      const max =
        rule.max ?
          rule.max === 'current' ?
            new Date()
          : new Date(rule.max)
        : null
      const pattern = new RegExp(rule.pattern)
      const tryDate = (date: string) => {
        try {
          return new Date(date)
        } catch {
          return false
        }
      }
      return (value: string) => {
        if (!value) return ''
        if (!pattern.test(value)) return `date string ${value} does not match ${rule.pattern}`
        const date = tryDate(value)
        if (!date) return `invalid date: ${value}`
        if (rule.not) {
          if ((min && date > min) || (max && date < max)) {
            return `date ${value} is out of range`
          }
        } else {
          if ((min && date < min) || (max && date > max)) {
            return `date ${value} is out of range`
          }
        }
        return ''
      }
    }
    return (value: string) => `unimplemented type in ${JSON.stringify(rule)}`
  })
}

function renderRowRules(rules: RowRuleSpec) {
  const minYears = rules.min_years
  const identifierSets = rules.present_identifiers.map(set => new Set(set))
  return (variableMap: {[key: string]: string}, row: {[key: string]: string}) => {
    let nYears = 0
    const identifiers: Set<string> = new Set()
    Object.keys(row).forEach(col => {
      if (!row[col] || !(col in variableMap)) return
      if (variableMap[col] === 'year') {
        nYears++
      } else {
        identifiers.add(variableMap[col])
      }
    })
    if (nYears < minYears) return `requires at least ${minYears} year${minYears === 1 ? '' : 's'}`
    if (!identifierSets.find(set => set.isSubsetOf(identifiers)))
      return `invalid combination of identifiers: ${[...identifiers].join(', ')}`
    return ''
  }
}

function fillStructure(spec: {[key: string]: BaseEntry}, output: {[key: string]: any}) {
  Object.keys(spec).forEach(entry => {
    const entrySpec = spec[entry]
    if (!(entry in output)) {
      output[entry] = typeMap(entry, entrySpec)
    }
    if (entrySpec.suboptions) {
      fillStructure(entrySpec.suboptions, output)
    }
  })
}
