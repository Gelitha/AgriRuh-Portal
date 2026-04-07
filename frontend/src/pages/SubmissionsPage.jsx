import { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Button, Chip, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const getStatusColor = (status) => {
  switch (status) {
    case 'on_time': return 'success'
    case 'late': return 'warning'
    case 'closed': return 'error'
    default: return 'default'
  }
}

export default function SubmissionsPage() {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState({})

  useEffect(() => {
    fetchSubmissions()
    fetchSessions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await api.get('/my-submissions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubmissions(response.data.data || [])
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to load submissions'
      setError(message)
      if (err.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions')
      const sessionsMap = {}
      response.data.data?.forEach((session) => {
        sessionsMap[session.id] = session.session_title || session.lab_name || `Lab ${session.id}`
      })
      setSessions(sessionsMap)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="page-stack">
      <Stack direction="row" justifyContent="space-between" alignItems="center" className="page-header">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }} className="page-title">My Submissions</Typography>
          <Typography variant="body2" className="page-subtitle">
            Review submission times, grades, and notes from one consistent table.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/dashboard')}>
          Open Submission Panel
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {submissions.length === 0 ? (
        <Card className="ui-empty-state">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              No submissions yet
            </Typography>
            <Button variant="contained" onClick={() => navigate('/dashboard')}>
              Open Available Submissions
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card} className="ui-table-shell">
          <Table>
            <TableHead className="ui-table-head">
              <TableRow>
                <TableCell>Lab</TableCell>
                <TableCell>Submitted On</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Marks</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>{sessions[submission.session_id] || `Lab ${submission.session_id}`}</TableCell>
                  <TableCell>{new Date(submission.submission_time).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={submission.status.replace('_', ' ')} color={getStatusColor(submission.status)} size="small" />
                  </TableCell>
                  <TableCell>{submission.marks !== null ? submission.marks : '-'}</TableCell>
                  <TableCell>{submission.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
