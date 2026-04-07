import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Typography, Box, CircularProgress, Button, Stack, Grid, Alert, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { QrCode2 as QrIcon, Edit as EditIcon } from '@mui/icons-material'
import toast from 'react-hot-toast'
import api from '../services/api'

const getStatusColor = (status) => {
  if (status === 'on_time') return 'success'
  if (status === 'late') return 'warning'
  if (status === 'closed') return 'error'
  return 'default'
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [availableSessions, setAvailableSessions] = useState([])
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState({})
  const [representativeSessions, setRepresentativeSessions] = useState([])
  const [attendanceDialog, setAttendanceDialog] = useState(null)
  const [attendanceForm, setAttendanceForm] = useState([])
  const [attendanceNotes, setAttendanceNotes] = useState('')
  const [savingAttendance, setSavingAttendance] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token')

      const userResponse = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(userResponse.data.data)

      const [submissionsResponse, sessionsResponse, availableSessionsResponse] = await Promise.all([
        api.get('/my-submissions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/sessions'),
        api.get('/student/available-sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setSubmissions(submissionsResponse.data.data || [])
      setAvailableSessions(availableSessionsResponse.data.data || [])

      if (userResponse.data.data?.role === 'representative') {
        const representativeSessionsResponse = await api.get('/representative/attendance-sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setRepresentativeSessions(representativeSessionsResponse.data.data || [])
      } else {
        setRepresentativeSessions([])
      }

      const sessionsMap = {}
      sessionsResponse.data.data?.forEach((session) => {
        sessionsMap[session.id] = session.session_title || session.lab_name || `Lab ${session.id}`
      })
      setSessions(sessionsMap)
    } catch (requestError) {
      console.error('Error fetching data:', requestError)
      if (requestError.response?.status === 401) {
        navigate('/login')
      } else {
        setError('Error loading dashboard')
        toast.error('Failed to load dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDirectSubmit = async (sessionId) => {
    try {
      const token = localStorage.getItem('access_token')
      await api.post('/submissions', {
        session_id: sessionId,
        device_info: {
          source: 'dashboard_direct_submit'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Submission successful')
      await fetchData()
    } catch (requestError) {
      toast.error(requestError.response?.data?.error?.message || 'Submission failed')
    }
  }

  const openAttendanceDialog = async (sessionId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await api.get(`/representative/sessions/${sessionId}/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const details = response.data.data
      const existingRecords = details.attendance_submission?.attendance_records || []
      const recordsMap = existingRecords.reduce((acc, record) => {
        acc[record.id] = Boolean(record.present)
        return acc
      }, {})

      setAttendanceDialog(details)
      setAttendanceForm((details.enrolled_students || []).map((student) => ({
        ...student,
        present: recordsMap[student.id] ?? true
      })))
      setAttendanceNotes(details.attendance_submission?.notes || '')
    } catch (requestError) {
      toast.error(requestError.response?.data?.error?.message || 'Failed to load attendance list')
    }
  }

  const handleAttendanceToggle = (studentId) => {
    setAttendanceForm((current) => current.map((student) => (
      student.id === studentId ? { ...student, present: !student.present } : student
    )))
  }

  const handleSaveAttendance = async () => {
    if (!attendanceDialog?.session) {
      return
    }

    setSavingAttendance(true)

    try {
      const token = localStorage.getItem('access_token')
      await api.post(`/representative/sessions/${attendanceDialog.session.id}/attendance`, {
        attendance_records: attendanceForm,
        confirmation_status: 'confirmed',
        notes: attendanceNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Batch attendance confirmed')
      setAttendanceDialog(null)
      setAttendanceForm([])
      setAttendanceNotes('')
      await fetchData()
    } catch (requestError) {
      toast.error(requestError.response?.data?.error?.message || 'Failed to save attendance')
    } finally {
      setSavingAttendance(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Alert severity="error">Unable to load user data. Please log in again.</Alert>
  }

  return (
    <Box className="page-stack">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card className="ui-hero-card" sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(31,79,57,0.98) 0%, rgba(47,107,79,0.94) 56%, rgba(154,182,127,0.82) 100%)', color: 'white' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'center', md: 'flex-start' }}>
            <Avatar sx={{ width: 100, height: 100, background: 'rgba(247, 255, 244, 0.24)', fontSize: 40 }}>
              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Welcome, {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                Email: {user.email}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                University ID: {user.university_id}
              </Typography>
            </Box>
            <Stack spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{submissions.length}</Typography>
              <Typography variant="body2">Submissions</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Button variant="contained" size="large" startIcon={<QrIcon />} onClick={() => navigate('/scanner')} sx={{ flex: 1 }}>
          QR Scanner
        </Button>
        <Button variant="outlined" size="large" startIcon={<EditIcon />} onClick={() => navigate('/submissions')} sx={{ flex: 1 }}>
          View All Submissions
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate('/grades')} sx={{ flex: 1 }}>
          View Grades
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>{submissions.length}</Typography><Typography variant="body2" color="textSecondary">Total Submissions</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>{submissions.filter((s) => s.status === 'on_time' || s.status === 'late').length}</Typography><Typography variant="body2" color="textSecondary">Completed</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>{submissions.filter((s) => s.status === 'draft' || s.status === 'closed').length}</Typography><Typography variant="body2" color="textSecondary">Needs Attention</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="ui-metric-card"><CardContent sx={{ textAlign: 'center' }}><Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>{submissions.reduce((sum, s) => sum + Number(s.marks || 0), 0)}</Typography><Typography variant="body2" color="textSecondary">Total Marks</Typography></CardContent></Card>
        </Grid>
      </Grid>

      {user.role === 'representative' && (
        <>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }} className="page-title">Representative Batch Confirmation</Typography>
          {representativeSessions.length === 0 ? (
            <Card className="ui-empty-state" sx={{ mb: 4 }}>
              <CardContent>
                <Typography color="textSecondary">No representative attendance sessions are assigned to your batch right now.</Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {representativeSessions.map((session) => (
                <Grid item xs={12} md={6} key={session.id}>
                  <Card className="ui-surface-card">
                    <CardContent>
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {session.session_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {session.subject} | {session.semester} | {session.batch === 'all' ? 'All batches' : `${session.batch}th batch`}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          Enrolled list: {session.enrolled_count} students
                        </Typography>
                        {session.representative_submission && (
                          <Chip
                            label={`Confirmed: ${session.representative_submission.confirmation_status}`}
                            color="success"
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        )}
                        <Button variant="contained" onClick={() => openAttendanceDialog(session.id)}>
                          {session.representative_submission ? 'Review Confirmation' : 'Confirm Batch Attendance'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }} className="page-title">Available Submissions</Typography>
      {availableSessions.length === 0 ? (
        <Card className="ui-empty-state" sx={{ mb: 4 }}>
          <CardContent>
            <Typography color="textSecondary">No submission windows are open for your batch right now.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {availableSessions.map((session) => (
            <Grid item xs={12} md={6} key={session.id}>
              <Card className="ui-surface-card">
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {session.session_title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {session.subject} | {session.department_name}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      Opens: {new Date(session.available_from).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      Deadline: {new Date(session.submission_deadline).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={session.availability} color={session.availability === 'open' ? 'success' : session.availability === 'scheduled' ? 'warning' : 'default'} size="small" />
                      {session.has_submitted && <Chip label="submitted" color="info" size="small" />}
                    </Stack>
                    <Button
                      variant="contained"
                      disabled={!session.can_submit}
                      onClick={() => handleDirectSubmit(session.id)}
                    >
                      {session.has_submitted ? 'Already Submitted' : session.availability === 'scheduled' ? 'Not Open Yet' : session.availability === 'closed' ? 'Closed' : 'Submit Now'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }} className="page-title">Recent Submissions</Typography>
      {submissions.length === 0 ? (
        <Card className="ui-empty-state">
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="textSecondary">No submissions yet. Use an open submission window above to submit directly.</Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Card} className="ui-table-shell">
          <Table>
            <TableHead className="ui-table-head">
              <TableRow>
                <TableCell>Lab</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Marks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.slice(0, 5).map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>{sessions[submission.session_id] || `Lab ${submission.session_id}`}</TableCell>
                  <TableCell>{new Date(submission.submission_time).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={submission.status.replace('_', ' ')} color={getStatusColor(submission.status)} size="small" />
                  </TableCell>
                  <TableCell>{submission.marks !== null ? submission.marks : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(attendanceDialog)} onClose={() => setAttendanceDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Batch Attendance</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {attendanceDialog?.session?.session_title} | {attendanceDialog?.session?.subject}
            </Typography>
            {attendanceForm.map((student) => (
              <FormControlLabel
                key={student.id}
                control={
                  <Checkbox
                    checked={Boolean(student.present)}
                    onChange={() => handleAttendanceToggle(student.id)}
                  />
                }
                label={`${student.id} - ${student.name}`}
              />
            ))}
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Representative Notes"
              value={attendanceNotes}
              onChange={(event) => setAttendanceNotes(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAttendance} disabled={savingAttendance}>
            {savingAttendance ? 'Saving...' : 'Confirm Attendance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
