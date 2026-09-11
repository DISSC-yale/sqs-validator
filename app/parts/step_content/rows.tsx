import {useContext, useMemo} from 'react'
import {JobContext} from '../builders'
import {Box, Typography} from '@mui/material'
import {from} from 'arquero'
import {DataGrid} from '@mui/x-data-grid'

const columns = [
  {field: 'id', headerName: 'Row', width: 70},
  {field: 'error', headerName: 'Error', flex: 1},
]

export default function CheckRows() {
  const job = useContext(JobContext)
  const errors = job.validation ? job.validation.errors.rows : []
  const table = useMemo(() => {
    if (errors.length) {
      const errorTable = from(errors).orderby('id')
      return (
        <DataGrid
          sx={{minHeight: '140px', width: '100%'}}
          rows={errorTable.objects()}
          columns={columns}
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
          <Typography color="error">Invalid rows found:</Typography>
        : <Typography color="success">All rows are valid.</Typography>}
      </Box>
      <Box sx={{height: 'calc(100% - 37px)', overflowY: 'auto'}}>{table}</Box>
    </Box>
  )
}
