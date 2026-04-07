import { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Grid, LinearProgress, Chip, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = '/api'

export default function GradesPage() {
  const navigate = useNavigate()
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState({})

  useEffect(() => {
    fetchMarks()
    fetchSessions()
  }, [])

  const fetchMarks = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await axios.get(`${API_BASE}/my-marks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMarks(response.data.data || [])
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to load marks'
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
      const response = await axios.get(`${API_BASE}/sessions`)
      const sessionsMap = {}
      response.data.data?.forEach((session) => {
        sessionsMap[session.id] = session.session_title || session.lab_name || `Lab ${session.id}`
      })
      setSessions(sessionsMap)
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }

  const getPercentage = (mark) => Number(mark.percentage || 0)
  const getMarksValue = (mark) => Number(mark.marks || 0)
  const averagePercentage = marks.length ? Math.round(marks.reduce((sum, mark) => sum + getPercentage(mark), 0) / marks.length) : 0

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box className="page-stack">
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }} className="page-title">Your Grades</Typography>
        <Typography variant="body2" className="page-subtitle">
          Track released marks with the same card and table styling used across the student pages.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {marks.length === 0 ? (
        <Card className="ui-empty-state">
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="textSecondary">
              No grades available yet. Submit assignments and they will appear here once released.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h5">{marks.length}</Typography><Typography color="text.secondary">Released Grades</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h5">{marks.reduce((sum, mark) => sum + getMarksValue(mark), 0)}</Typography><Typography color="text.secondary">Total Marks</Typography></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h5">{averagePercentage}%</Typography><Typography color="text.secondary">Average Percentage</Typography></CardContent></Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 1 }}>
            {marks.map((mark) => (
              <Grid item xs={12} md={6} key={`summary-${mark.id}`}>
                <Card className="ui-surface-card">
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" spacing={1.5} alignItems="center">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="h6" className="ui-wrap">
                            {sessions[mark.submission?.session_id] || `Lab ${mark.submission?.session_id}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" className="ui-wrap">
                            Released score with published feedback
                          </Typography>
                        </Box>
                        <Chip label={`${getMarksValue(mark)} marks`} color="primary" variant="outlined" />
                      </Stack>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                          Feedback
                        </Typography>
                        <Typography variant="body2" className="ui-wrap">
                          {mark.feedback || 'No written feedback was provided for this submission.'}
                        </Typography>
                      </Box>
                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                          <Typography variant="body2" color="text.secondary">
                            Performance
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {getPercentage(mark)}%
                          </Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={getPercentage(mark)} sx={{ height: 8, borderRadius: 999 }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card className="ui-surface-card">
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Submission Breakdown</Typography>
              <TableContainer className="ui-responsive-table">
                <Table>
                  <TableHead className="ui-table-head">
                    <TableRow>
                      <TableCell>Lab Session</TableCell>
                      <TableCell>Marks</TableCell>
                      <TableCell>Percentage</TableCell>
                      <TableCell>Feedback</TableCell>
                      <TableCell>Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map((mark) => (
                      <TableRow key={mark.id} hover>
                        <TableCell className="ui-wrap">{sessions[mark.submission?.session_id] || `Lab ${mark.submission?.session_id}`}</TableCell>
                        <TableCell>
                          <Chip label={getMarksValue(mark)} color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{getPercentage(mark)}%</TableCell>
                        <TableCell className="ui-wrap">{mark.feedback || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ minWidth: 120 }}>
                            <LinearProgress variant="determinate" value={getPercentage(mark)} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
