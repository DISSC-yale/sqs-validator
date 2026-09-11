import {useContext, useMemo} from 'react'
import {JobContext} from '../builders'
import {Box, Typography} from '@mui/material'
import {from} from 'arquero'
import {DataGrid} from '@mui/x-data-grid'

export default function CheckGroups() {
  const job = useContext(JobContext)
  const errors = job.validation ? job.validation.errors.groups : []
  const table = useMemo(() => {
    if (errors.length) {
      const errorTable = from(errors)
      return (
        <DataGrid
          sx={{minHeight: '140px', width: '100%'}}
          rows={errorTable.objects()}
          columns={errorTable
            .columnNames()
            .filter(field => field !== 'id')
            .map(field => {
              return {field, flex: field === 'count' ? 0 : 1}
            })
            .reverse()}
          disableRowSelectionOnClick
          disableDensitySelector
          disableColumnMenu
          pageSizeOptions={[50]}
          initialState={{pagination: {paginationModel: {pageSize: 50}}}}
          density="compact"
        />
      )
    }
  }, [errors])
  return (
    <Box sx={{height: '100%'}}>
      <Box sx={{p: 1, height: 45}}>
        {errors.length ?
          <Typography color="error">Groups with insufficent observations found:</Typography>
        : <Typography color="success">All groups of sufficient size.</Typography>}
      </Box>
      <Box sx={{height: 'calc(100% - 37px)', overflowY: 'auto'}}>{table}</Box>
    </Box>
  )
}
