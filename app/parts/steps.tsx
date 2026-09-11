import {Box, Stack, Tab, Tabs, Typography, useTheme} from '@mui/material'
import {useContext, useMemo, useState, type ReactElement} from 'react'
import {DataContext, JobContext} from './builders'
import {Close, Check, Info} from '@mui/icons-material'
import DefineVariables from './step_content/variables'
import CheckValues from './step_content/values'
import CheckRows from './step_content/rows'
import CheckGroups from './step_content/groups'
import SelectOutputs from './step_content/outputs'

function TabPanel({children, step, currentStep}: {children: ReactElement; step: string; currentStep: string}) {
  return (
    <div role="tabpanel" hidden={step !== currentStep} id={`step-panel-${step}`} aria-labelledby={`step-label-${step}`}>
      {step === currentStep && children}
    </div>
  )
}

const noData = (
  <Box>
    <Typography color="error">No data loaded.</Typography>
  </Box>
)

export default function Steps() {
  const data = useContext(DataContext)
  const job = useContext(JobContext)
  const {palette} = useTheme()
  const [currentStep, setCurrentStep] = useState('define')
  const tabs = useMemo(() => {
    const stepFailed = {
      define: !job.validation || !!job.validation.errors.variables.length,
      values: !job.validation || !!job.validation.errors.values.length,
      rows: !job.validation || !!job.validation.errors.rows.length,
      groups: !job.validation || !!job.validation.errors.groups.length,
    }
    const tabProps = (label: string, value: keyof typeof stepFailed | 'outputs') => {
      return {
        label: <Typography>{label}</Typography>,
        value,
        id: `step-label-${value}`,
        'aria-controls': `step-panel-${value}`,
        className:
          value === 'outputs' ? 'info'
          : stepFailed[value] ? 'error'
          : 'success',
        icon:
          value === 'outputs' ? <Info />
          : stepFailed[value] ? <Close />
          : <Check />,
      }
    }
    return (
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={currentStep}
        onChange={(_, newStep) => setCurrentStep(newStep)}
        aria-label="data validation steps"
        sx={{
          height: '100%',
          minWidth: 300,
          '& button': {justifyContent: 'flex-start', alignItems: 'center', display: 'flex'},
          '& .success': {color: palette.success.main},
          '& .error': {color: palette.error.main},
        }}
        textColor="inherit"
      >
        <Tab iconPosition="start" {...tabProps('1. Define Variables', 'define')} />
        <Tab iconPosition="start" {...tabProps('2. Check Values', 'values')} />
        <Tab iconPosition="start" {...tabProps('3. Check Rows', 'rows')} />
        <Tab iconPosition="start" {...tabProps('4. Check Group Counts', 'groups')} />
        <Tab iconPosition="start" {...tabProps('5. Select Outputs', 'outputs')} />
      </Tabs>
    )
  }, [currentStep, job.validation])
  return (
    <Stack component="main" direction="row" sx={{height: '100%'}}>
      <Box
        sx={{
          borderRight: 1,
          borderColor: 'divider',
          '& button': {alignItems: 'flex-start'},
        }}
      >
        {tabs}
      </Box>
      <Box
        sx={{
          p: 1,
          width: '100%',
          '& div[role="tabpanel"]': {height: '100%', width: '100%'},
        }}
      >
        <TabPanel step="define" currentStep={currentStep}>
          {data ?
            <DefineVariables />
          : noData}
        </TabPanel>
        <TabPanel step="values" currentStep={currentStep}>
          {data ?
            <CheckValues />
          : noData}
        </TabPanel>
        <TabPanel step="rows" currentStep={currentStep}>
          {data ?
            <CheckRows />
          : noData}
        </TabPanel>
        <TabPanel step="groups" currentStep={currentStep}>
          {data ?
            <CheckGroups />
          : noData}
        </TabPanel>
        <TabPanel step="outputs" currentStep={currentStep}>
          <SelectOutputs />
        </TabPanel>
      </Box>
    </Stack>
  )
}
