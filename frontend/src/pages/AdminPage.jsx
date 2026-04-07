import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  MenuItem,
  Switch,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  RestartAlt as ResetIcon,
  QrCode2 as QrCodeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import api from '../services/api'
import '../styles/AdminPage.css'

const initialDepartmentForm = { id: '', name: '' }
const initialStaffAccountForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'lecturer',
  department_id: 'BL',
  confirm_admin_password: ''
}
const initialSessionForm = {
  subject: '',
  session_title: '',
  department_id: 'BL',
  batch: 'all',
  semester: 'Semester 1',
  attendance_mode: 'individual',
  enrollment_text: '',
  available_from: '',
  submission_deadline: '',
  late_submission_deadline: '',
  notes: '',
  instructions: ''
}
const initialFilters = {
  status: 'all',
  department_id: 'all',
  session_id: 'all',
  search: ''
}
const initialGradeForm = {
  obtained_marks: '',
  total_marks: '100',
  penalties: '0',
  feedback: '',
  visibility_to_student: false
}
const roleOptions = ['student', 'representative', 'lecturer', 'demonstrator', 'admin']
const batchOptions = ['44', '45', '46', '47', '48']
const semesterOptions = ['Semester 1', 'Semester 2']
const departmentScopedRoles = ['lecturer', 'demonstrator']
const globalAccessRoles = ['admin']
const roleNeedsDepartment = (role) => departmentScopedRoles.includes(role) || globalAccessRoles.includes(role)
const attendanceModeOptions = [
  { value: 'individual', label: 'Individual submissions' },
  { value: 'representative_batch', label: 'Representative confirms batch attendance' }
]

const parseEnrollmentText = (value) => (
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [idPart, ...nameParts] = line.split('-')
      const id = idPart?.trim() || `entry-${index + 1}`
      const name = nameParts.join('-').trim() || id
      return { id, name }
    })
)

const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

const statusColorMap = {
  on_time: 'success',
  late: 'warning',
  closed: 'default',
  pending: 'default',
  published: 'success',
  draft: 'warning'
}

const getWorkspaceTabs = (role) => (
  globalAccessRoles.includes(role)
    ? [
        { value: 'overview', label: 'Overview' },
        { value: 'sessions', label: 'Sessions' },
        { value: 'review', label: 'Review' },
        { value: 'setup', label: 'Departments' },
        { value: 'access', label: 'Access' }
      ]
    : [
        { value: 'overview', label: 'Overview' },
        { value: 'sessions', label: 'Sessions' },
        { value: 'review', label: 'Review' }
      ]
)

export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [overview, setOverview] = useState(null)
  const [departments, setDepartments] = useState([])
  const [sessions, setSessions] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [staffAccountForm, setStaffAccountForm] = useState(initialStaffAccountForm)
  const [departmentForm, setDepartmentForm] = useState(initialDepartmentForm)
  const [sessionForm, setSessionForm] = useState(initialSessionForm)
  const [filters, setFilters] = useState(initialFilters)
  const [loading, setLoading] = useState(true)
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [submittingDepartment, setSubmittingDepartment] = useState(false)
  const [submittingSession, setSubmittingSession] = useState(false)
  const [submittingStaffAccount, setSubmittingStaffAccount] = useState(false)
  const [submittingGrade, setSubmittingGrade] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [editingDepartmentId, setEditingDepartmentId] = useState(null)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState('')
  const [gradingSubmission, setGradingSubmission] = useState(null)
  const [gradeForm, setGradeForm] = useState(initialGradeForm)
  const [reportSummary, setReportSummary] = useState(null)
  const [latestRecoveryKey, setLatestRecoveryKey] = useState(null)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('overview')
  const isDepartmentLocked = departmentScopedRoles.includes(user?.role)
  const canManageDepartments = globalAccessRoles.includes(user?.role)
  const workspaceTabs = getWorkspaceTabs(user?.role)
  const isOverviewTab = activeWorkspaceTab === 'overview'
  const isSessionsTab = activeWorkspaceTab === 'sessions'
  const isReviewTab = activeWorkspaceTab === 'review'
  const isSetupTab = activeWorkspaceTab === 'setup'
  const isAccessTab = activeWorkspaceTab === 'access'

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    loadSubmissions(filters)
  }, [filters.status, filters.department_id, filters.session_id, filters.search, user])

  useEffect(() => {
    if (!user) {
      return
    }

    if (departmentScopedRoles.includes(user.role)) {
      setFilters((current) => ({ ...current, department_id: user.department_id || 'BL' }))
      setSessionForm((current) => ({ ...current, department_id: user.department_id || current.department_id || 'BL' }))
    }
  }, [user])

  useEffect(() => {
    if (!user?.role) {
      return
    }

    setActiveWorkspaceTab(globalAccessRoles.includes(user.role) ? 'overview' : 'review')
  }, [user?.role])

  const loadAdminData = async () => {
    setLoading(true)
    setError('')

    try {
      const [userRes, overviewRes, departmentsRes, sessionsRes, reportSummaryRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/admin/overview'),
        api.get('/admin/departments'),
        api.get('/admin/sessions'),
        api.get('/staff/reports/summary')
      ])

      const departmentList = departmentsRes.data.data || []
      setUser(userRes.data.data)
      setOverview(overviewRes.data.data)
      setDepartments(departmentList)
      setSessions(sessionsRes.data.data || [])
      setReportSummary(reportSummaryRes.data.data || null)

      if (userRes.data.data?.role === 'admin') {
        const usersRes = await api.get('/admin/users')
        setUsers(usersRes.data.data || [])
      } else {
        setUsers([])
      }

      if (departmentList.length > 0) {
        setSessionForm((current) => ({
          ...current,
          department_id: current.department_id || departmentList[0].id
        }))
        setStaffAccountForm((current) => ({
          ...current,
          department_id: current.department_id || departmentList[0].id
        }))
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 403) {
        setError('This account does not have admin access.')
      } else {
        setError(err.response?.data?.error?.message || 'Failed to load admin data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUserAccessChange = async (targetUser, updates) => {
    setUpdatingUserId(targetUser.id)
    setError('')
    setMessage(null)

    try {
      const response = await api.put(`/admin/users/${targetUser.id}/role`, {
        role: updates.role ?? targetUser.role,
        department_id: roleNeedsDepartment(updates.role ?? targetUser.role)
          ? updates.department_id ?? targetUser.department_id
          : null,
        batch: updates.batch ?? targetUser.batch ?? '47'
      })

      setUsers((current) => current.map((userRecord) => (
        userRecord.id === targetUser.id ? response.data.data : userRecord
      )))
      setMessage({ type: 'success', text: `${targetUser.first_name} ${targetUser.last_name} access settings were updated.` })
      toast.success('User access updated')
    } catch (err) {
      const nextError = err.response?.data?.error?.message || 'Failed to update user access'
      setError(nextError)
      toast.error(nextError)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const loadSubmissions = async (nextFilters = filters) => {
    setLoadingSubmissions(true)

    try {
      const response = await api.get('/admin/submissions', { params: nextFilters })
      setSubmissions(response.data.data || [])
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load submissions')
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleCreateDepartment = async (event) => {
    event.preventDefault()
    setSubmittingDepartment(true)
    setError('')
    setMessage(null)

    try {
      const response = editingDepartmentId
        ? await api.put(`/admin/departments/${editingDepartmentId}`, {
            name: departmentForm.name
          })
        : await api.post('/admin/departments', {
            id: departmentForm.id,
            name: departmentForm.name
          })
      setDepartments(response.data.data || [])
      setDepartmentForm(initialDepartmentForm)
      setEditingDepartmentId(null)
      setMessage({ type: 'success', text: editingDepartmentId ? 'Department updated.' : 'Department added.' })
      toast.success(editingDepartmentId ? 'Department updated' : 'Department saved')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to add department')
    } finally {
      setSubmittingDepartment(false)
    }
  }

  const handleCreateSession = async (event) => {
    event.preventDefault()
    setSubmittingSession(true)
    setError('')
    setMessage(null)

    try {
      const response = editingSessionId
        ? await api.put(`/admin/sessions/${editingSessionId}`, {
            ...sessionForm,
            enrolled_students: parseEnrollmentText(sessionForm.enrollment_text)
          })
        : await api.post('/admin/sessions', {
            ...sessionForm,
            enrolled_students: parseEnrollmentText(sessionForm.enrollment_text),
            generate_qr: true
          })

      setSessions((current) => (
        editingSessionId
          ? current.map((session) => (session.id === editingSessionId ? response.data.data : session))
          : [response.data.data, ...current]
      ))
      resetSessionForm()
      setMessage({ type: 'success', text: editingSessionId ? 'Session updated.' : 'Session created and QR generated.' })
      toast.success(editingSessionId ? 'Session updated' : 'Session created')
      await Promise.all([loadAdminData(), loadSubmissions(filters)])
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create session')
    } finally {
      setSubmittingSession(false)
    }
  }

  const handleCreateStaffAccount = async (event) => {
    event.preventDefault()
    setSubmittingStaffAccount(true)
    setError('')
    setMessage(null)

    try {
      const response = await api.post('/admin/users', {
        ...staffAccountForm,
        department_id: roleNeedsDepartment(staffAccountForm.role) ? staffAccountForm.department_id : null
      })

      setUsers((current) => [response.data.data, ...current])
      setLatestRecoveryKey({
        name: `${response.data.data.first_name} ${response.data.data.last_name}`,
        role: response.data.data.role,
        key: response.data.data.recovery_key
      })
      setStaffAccountForm((current) => ({
        ...initialStaffAccountForm,
        department_id: current.department_id || departments[0]?.id || 'BL'
      }))
      setMessage({ type: 'success', text: `${response.data.data.first_name} ${response.data.data.last_name} account created.` })
      toast.success('Staff account created')
    } catch (err) {
      const nextError = err.response?.data?.error?.message || 'Failed to create staff account'
      setError(nextError)
      toast.error(nextError)
    } finally {
      setSubmittingStaffAccount(false)
    }
  }

  const handleRegenerateQr = async (sessionId) => {
    setError('')
    setMessage(null)

    try {
      const response = await api.post(`/admin/sessions/${sessionId}/qr`)
      const updatedSession = response.data.data.session
      setSessions((current) => current.map((session) => (
        session.id === sessionId ? updatedSession : session
      )))
      setMessage({ type: 'success', text: 'QR code regenerated.' })
      toast.success('QR regenerated')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to regenerate QR code')
    }
  }

  const handleCopyQrLink = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('QR link copied')
    } catch (err) {
      toast.error('Failed to copy QR link')
    }
  }

  const resetDepartmentForm = () => {
    setDepartmentForm(initialDepartmentForm)
    setEditingDepartmentId(null)
  }

  const resetSessionForm = () => {
    setSessionForm((current) => ({
      ...initialSessionForm,
      department_id: isDepartmentLocked ? user?.department_id || departments[0]?.id || 'BL' : current.department_id || departments[0]?.id || 'BL'
    }))
    setEditingSessionId(null)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
  }

  const startEditDepartment = (department) => {
    setEditingDepartmentId(department.id)
    setDepartmentForm({
      id: department.id,
      name: department.name
    })
  }

  const startEditSession = (session) => {
    setEditingSessionId(session.id)
    setSessionForm({
      subject: session.subject || '',
      session_title: session.session_title || '',
      department_id: session.department_id || departments[0]?.id || 'BL',
      batch: session.batch || 'all',
      semester: session.semester || 'Semester 1',
      attendance_mode: session.attendance_mode || 'individual',
      enrollment_text: Array.isArray(session.enrolled_students)
        ? session.enrolled_students.map((entry) => `${entry.id} - ${entry.name}`).join('\n')
        : '',
      available_from: session.available_from ? new Date(session.available_from).toISOString().slice(0, 16) : '',
      submission_deadline: session.submission_deadline ? new Date(session.submission_deadline).toISOString().slice(0, 16) : '',
      late_submission_deadline: session.late_submission_deadline ? new Date(session.late_submission_deadline).toISOString().slice(0, 16) : '',
      notes: session.notes || '',
      instructions: session.instructions || ''
    })
  }

  const openGradeDialog = (submission) => {
    setGradingSubmission(submission)
    setGradeForm({
      obtained_marks: submission.marks?.obtained_marks?.toString() || submission.marks_value?.toString() || '',
      total_marks: submission.marks?.total_marks?.toString() || '100',
      penalties: submission.marks?.penalties?.toString() || '0',
      feedback: submission.marks?.feedback || '',
      visibility_to_student: Boolean(submission.marks?.visibility_to_student)
    })
  }

  const closeGradeDialog = () => {
    setGradingSubmission(null)
    setGradeForm(initialGradeForm)
  }

  const handleGradeChange = (field, value) => {
    setGradeForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleSaveGrade = async () => {
    if (!gradingSubmission) {
      return
    }

    setSubmittingGrade(true)
    setError('')
    setMessage(null)

    try {
      await api.post(`/admin/submissions/${gradingSubmission.id}/marks`, {
        obtained_marks: Number(gradeForm.obtained_marks),
        total_marks: Number(gradeForm.total_marks),
        penalties: Number(gradeForm.penalties || 0),
        feedback: gradeForm.feedback,
        visibility_to_student: gradeForm.visibility_to_student
      })

      toast.success(gradeForm.visibility_to_student ? 'Grade saved and published' : 'Grade saved as draft')
      setMessage({
        type: 'success',
        text: gradeForm.visibility_to_student ? 'Grade saved and published to the student.' : 'Grade saved as draft.'
      })
      closeGradeDialog()
      await Promise.all([loadSubmissions(filters), loadAdminData()])
    } catch (err) {
      const nextError = err.response?.data?.error?.message || 'Failed to save grade'
      setError(nextError)
      toast.error(nextError)
    } finally {
      setSubmittingGrade(false)
    }
  }

  const handleDownloadReport = async (type) => {
    try {
      const response = await api.get(`/staff/reports/export?type=${type}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-report.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`${type} report downloaded`)
    } catch (err) {
      toast.error('Failed to download report')
    }
  }

  const handleDeleteGrade = async () => {
    if (!gradingSubmission) {
      return
    }

    setSubmittingGrade(true)
    setError('')
    setMessage(null)

    try {
      await api.delete(`/admin/submissions/${gradingSubmission.id}/marks`)
      toast.success('Grade reset successfully')
      setMessage({ type: 'success', text: 'Grade removed. The submission is back in pending review.' })
      closeGradeDialog()
      await Promise.all([loadSubmissions(filters), loadAdminData()])
    } catch (err) {
      const nextError = err.response?.data?.error?.message || 'Failed to reset grade'
      setError(nextError)
      toast.error(nextError)
    } finally {
      setSubmittingGrade(false)
    }
  }

  const obtainedMarksValue = Number(gradeForm.obtained_marks || 0)
  const totalMarksValue = Number(gradeForm.total_marks || 0)
  const penaltiesValue = Number(gradeForm.penalties || 0)
  const gradePercentage = totalMarksValue > 0 ? Math.max((obtainedMarksValue / totalMarksValue) * 100, 0) : 0
  const finalMarksPreview = Math.max(obtainedMarksValue - penaltiesValue, 0)

  const filteredSummary = {
    total: submissions.length,
    pending: submissions.filter((submission) => submission.review_status === 'pending').length,
    published: submissions.filter((submission) => submission.review_status === 'published').length,
    late: submissions.filter((submission) => submission.status === 'late').length
  }
  const workspaceFocusCards = canManageDepartments
    ? [
        {
          title: 'Platform control',
          value: `${users.length} users`,
          description: 'Manage roles, access, and department setup across the faculty.'
        },
        {
          title: 'Session operations',
          value: `${sessions.length} windows`,
          description: 'Create semester windows, regenerate QR links, and keep deadlines tidy.'
        },
        {
          title: 'Review queue',
          value: `${filteredSummary.pending} pending`,
          description: 'Jump into grading and release work that still needs attention.'
        }
      ]
    : [
        {
          title: 'Review queue',
          value: `${filteredSummary.pending} pending`,
          description: 'Prioritize grading and publishing for your department.'
        },
        {
          title: 'Session delivery',
          value: `${sessions.length} windows`,
          description: 'Update department submission windows, QR access, and representative batches.'
        },
        {
          title: 'Reporting',
          value: `${reportSummary?.submissions_by_status?.length || 0} status views`,
          description: 'Export submission and attendance reports for academic follow-up.'
        }
      ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !user) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Stack spacing={3} className="page-stack admin-page">
      <Box className="ui-hero-card admin-hero">
        <Stack spacing={2} className="admin-hero-content">
          <Chip
            label={globalAccessRoles.includes(user?.role) ? 'Faculty workspace' : 'Department workspace'}
            className="admin-hero-chip"
          />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }} className="admin-hero-title">
              Operations, sessions, and review
            </Typography>
            <Typography className="admin-hero-copy">
              Manage semester-based submission windows, department-scoped review, and role-based academic access from one organized workspace.
            </Typography>
          </Box>
          {user && (
            <Typography variant="body2" className="admin-hero-meta">
              Signed in as {user.first_name} {user.last_name} ({user.role})
            </Typography>
          )}
        </Stack>
      </Box>

      {message && <Alert severity={message.type}>{message.text}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {latestRecoveryKey && (
        <Alert severity="warning">
          Recovery key for {latestRecoveryKey.name} ({latestRecoveryKey.role}): <strong>{latestRecoveryKey.key}</strong> . Save it now and share it securely. It will not be shown again.
        </Alert>
      )}

      <Card className="ui-surface-card admin-panel">
        <CardContent className="admin-panel-body admin-tabs-shell">
          <Stack spacing={1.5}>
            <Typography variant="overline" className="admin-metric-label">
              Workspace Navigation
            </Typography>
            <Tabs
              value={activeWorkspaceTab}
              onChange={(_, nextValue) => setActiveWorkspaceTab(nextValue)}
              variant="scrollable"
              allowScrollButtonsMobile
              className="admin-workspace-tabs"
            >
              {workspaceTabs.map((tab) => (
                <Tab key={tab.value} value={tab.value} label={tab.label} />
              ))}
            </Tabs>
          </Stack>
        </CardContent>
      </Card>

      {isOverviewTab && (
        <Stack spacing={3}>
          <Grid container spacing={2} alignItems="stretch">
            {workspaceFocusCards.map((item) => (
              <Grid item xs={12} md={4} key={item.title}>
                <Card className="ui-surface-card admin-panel admin-focus-card">
                  <CardContent className="admin-panel-body">
                    <Stack spacing={1}>
                      <Typography variant="overline" className="admin-metric-label">
                        {item.title}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }} className="admin-metric-value">
                        {item.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} alignItems="stretch">
            {[
              { label: 'Departments', value: overview?.departments || 0, hint: 'Active academic groups' },
              { label: 'Sessions', value: overview?.sessions || 0, hint: 'Published submission windows' },
              { label: 'Submissions', value: overview?.submissions || 0, hint: 'Student submissions received' },
              { label: 'Pending Review', value: overview?.pending_reviews || 0, hint: 'Need grading or release' }
            ].map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.label}>
                <Card className="ui-metric-card admin-metric-card">
                  <CardContent className="admin-metric-body">
                    <Typography variant="overline" className="admin-metric-label">
                      {item.label}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }} className="admin-metric-value">
                      {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.hint}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {reportSummary && (
            <Card className="ui-surface-card admin-panel">
              <CardContent className="admin-panel-body">
                <Stack spacing={2}>
                  <Box className="admin-review-header">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                        Semester reports
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                        Quick reporting for lecturers and demonstrators, with downloadable submission and attendance exports.
                      </Typography>
                    </Box>
                    <Box className="admin-actions">
                      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownloadReport('submissions')}>
                        Download submissions
                      </Button>
                      <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownloadReport('attendance')}>
                        Download attendance
                      </Button>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {reportSummary.submissions_by_status?.map((item) => (
                      <Grid item xs={12} sm={4} key={item.label}>
                        <Card className="ui-metric-card">
                          <CardContent>
                            <Typography variant="overline">{item.label.replace('_', ' ')}</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {isSetupTab && canManageDepartments && (
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={4}>
            <Card className="ui-surface-card admin-panel">
              <CardContent className="admin-panel-body">
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                      Department setup
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                      Keep department codes short and stable so student routing remains predictable.
                    </Typography>
                  </Box>
                  <Box component="form" onSubmit={handleCreateDepartment}>
                    <Stack spacing={2}>
                      <TextField
                        label="Department Code"
                        value={departmentForm.id}
                        onChange={(event) => setDepartmentForm((current) => ({ ...current, id: event.target.value.toUpperCase() }))}
                        placeholder="BL"
                        required
                        disabled={Boolean(editingDepartmentId)}
                      />
                      <TextField
                        label="Department Name"
                        value={departmentForm.name}
                        onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Agricultural Biology"
                        required
                      />
                      <Button type="submit" variant="contained" size="large" disabled={submittingDepartment} startIcon={<AddIcon />}>
                        {submittingDepartment ? 'Saving...' : editingDepartmentId ? 'Update Department' : 'Add Department'}
                      </Button>
                      <Button type="button" variant="outlined" size="large" startIcon={<ResetIcon />} onClick={resetDepartmentForm}>
                        Reset
                      </Button>
                    </Stack>
                  </Box>

                  <Divider />

                  <Box className="admin-chip-grid">
                    {departments.map((department) => (
                      <Button
                        key={department.id}
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => startEditDepartment(department)}
                        sx={{ justifyContent: 'flex-start', borderRadius: 999 }}
                      >
                        {`${department.name} | ${department.id}`}
                      </Button>
                    ))}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card className="ui-surface-card admin-panel admin-role-tip">
              <CardContent className="admin-panel-body">
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                    Department administration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                    This tab is meant for faculty-level administration. Add departments here first, then use the Sessions and Access tabs to assign workspaces and staff ownership cleanly.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {isSessionsTab && (
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={12}>
          <Card className="ui-surface-card admin-panel">
            <CardContent className="admin-panel-body">
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                    Create a submission window
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                    Sessions appear only for the matching department and batch. Use semester targeting so the right students see the right work.
                  </Typography>
                </Box>

                <Box component="form" onSubmit={handleCreateSession}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Module / Subject"
                        value={sessionForm.subject}
                        onChange={(event) => setSessionForm((current) => ({ ...current, subject: event.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Department"
                        value={sessionForm.department_id}
                        onChange={(event) => setSessionForm((current) => ({ ...current, department_id: event.target.value }))}
                        required
                        disabled={isDepartmentLocked}
                      >
                        {departments.map((department) => (
                          <MenuItem key={department.id} value={department.id}>
                            {department.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Session Title"
                        value={sessionForm.session_title}
                        onChange={(event) => setSessionForm((current) => ({ ...current, session_title: event.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Attendance / Submission Mode"
                        value={sessionForm.attendance_mode}
                        onChange={(event) => setSessionForm((current) => ({ ...current, attendance_mode: event.target.value }))}
                      >
                        {attendanceModeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Batch"
                        value={sessionForm.batch}
                        onChange={(event) => setSessionForm((current) => ({ ...current, batch: event.target.value }))}
                        helperText="Choose All for cross-batch sessions"
                      >
                        <MenuItem value="all">All batches</MenuItem>
                        {batchOptions.map((batch) => (
                          <MenuItem key={batch} value={batch}>
                            {`${batch}th batch`}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Semester"
                        value={sessionForm.semester}
                        onChange={(event) => setSessionForm((current) => ({ ...current, semester: event.target.value }))}
                      >
                        {semesterOptions.map((semester) => (
                          <MenuItem key={semester} value={semester}>
                            {semester}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Submission Opens"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.available_from}
                        onChange={(event) => setSessionForm((current) => ({ ...current, available_from: event.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Submission Deadline"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.submission_deadline}
                        onChange={(event) => setSessionForm((current) => ({ ...current, submission_deadline: event.target.value }))}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        type="datetime-local"
                        label="Late Deadline"
                        InputLabelProps={{ shrink: true }}
                        value={sessionForm.late_submission_deadline}
                        onChange={(event) => setSessionForm((current) => ({ ...current, late_submission_deadline: event.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={5}
                        label="Enrolled Student List"
                        placeholder={'BL-2024-001 - Student Name\nBL-2024-002 - Student Name'}
                        value={sessionForm.enrollment_text}
                        onChange={(event) => setSessionForm((current) => ({ ...current, enrollment_text: event.target.value }))}
                        helperText="Needed when a representative confirms whole-batch attendance."
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Instructions"
                        value={sessionForm.instructions}
                        onChange={(event) => setSessionForm((current) => ({ ...current, instructions: event.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Notes"
                        value={sessionForm.notes}
                        onChange={(event) => setSessionForm((current) => ({ ...current, notes: event.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box className="admin-actions">
                        <Button type="submit" variant="contained" size="large" disabled={submittingSession} startIcon={<QrCodeIcon />}>
                          {submittingSession ? 'Saving...' : editingSessionId ? 'Update Session' : 'Create Session'}
                        </Button>
                        <Button variant="outlined" size="large" startIcon={<RefreshIcon />} onClick={loadAdminData}>
                          Refresh Data
                        </Button>
                        <Button variant="outlined" size="large" startIcon={<ResetIcon />} onClick={resetSessionForm}>
                          Reset Form
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      )}

      {isAccessTab && user?.role === 'admin' && (
        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={4}>
            <Card className="ui-surface-card admin-panel">
              <CardContent className="admin-panel-body">
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                      Create staff or admin account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                      This form is only available to logged-in admins. Confirm your own password before a lecturer, demonstrator, or admin account is created.
                    </Typography>
                  </Box>

                  <Box component="form" onSubmit={handleCreateStaffAccount}>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={staffAccountForm.first_name}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, first_name: event.target.value }))}
                        required
                        disabled={submittingStaffAccount}
                      />
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={staffAccountForm.last_name}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, last_name: event.target.value }))}
                        required
                        disabled={submittingStaffAccount}
                      />
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={staffAccountForm.email}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, email: event.target.value }))}
                        required
                        disabled={submittingStaffAccount}
                      />
                      <TextField
                        fullWidth
                        select
                        label="Role"
                        value={staffAccountForm.role}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, role: event.target.value }))}
                        disabled={submittingStaffAccount}
                      >
                        <MenuItem value="lecturer">lecturer</MenuItem>
                        <MenuItem value="demonstrator">demonstrator</MenuItem>
                        <MenuItem value="admin">admin</MenuItem>
                      </TextField>
                      <TextField
                        fullWidth
                        select
                        label="Department"
                        value={staffAccountForm.department_id}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, department_id: event.target.value }))}
                        disabled={submittingStaffAccount || !roleNeedsDepartment(staffAccountForm.role)}
                        helperText={staffAccountForm.role === 'admin' ? 'Admins can still be assigned a home department.' : 'Required for department-scoped staff accounts.'}
                      >
                        {departments.map((department) => (
                          <MenuItem key={department.id} value={department.id}>
                            {department.name}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth
                        label="Temporary Password"
                        type="password"
                        value={staffAccountForm.password}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, password: event.target.value }))}
                        helperText="Share this securely with the staff member after creation."
                        required
                        disabled={submittingStaffAccount}
                      />
                      <TextField
                        fullWidth
                        label="Confirm Your Admin Password"
                        type="password"
                        value={staffAccountForm.confirm_admin_password}
                        onChange={(event) => setStaffAccountForm((current) => ({ ...current, confirm_admin_password: event.target.value }))}
                        helperText="Required before the account is created."
                        required
                        disabled={submittingStaffAccount}
                      />
                      <Button type="submit" variant="contained" disabled={submittingStaffAccount}>
                        {submittingStaffAccount ? 'Creating...' : 'Create Account'}
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card className="ui-surface-card admin-panel">
              <CardContent className="admin-panel-body">
                <Stack spacing={3}>
                  <Box className="admin-review-header">
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                        User management
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                        Promote registered users and control access. Students and representatives keep a batch value, while staff and admin roles stay department-scoped.
                      </Typography>
                    </Box>
                    <Box className="admin-summary-chips">
                      <Chip label={`${users.length} users`} />
                      <Chip label={`${users.filter((entry) => entry.role === 'admin').length} admins`} color="success" />
                      <Chip label={`${users.filter((entry) => entry.role === 'representative').length} representatives`} color="warning" />
                      <Chip label={`${users.filter((entry) => entry.role === 'lecturer').length} lecturers`} color="info" />
                      <Chip label={`${users.filter((entry) => entry.role === 'demonstrator').length} demonstrators`} color="default" />
                    </Box>
                  </Box>

                  {users.length === 0 ? (
                    <Alert severity="info">No users available yet.</Alert>
                  ) : (
                    <Box className="admin-table-shell">
                      <TableContainer className="admin-scroll-area ui-responsive-table">
                        <Table stickyHeader className="admin-table">
                          <TableHead className="admin-table-head">
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>University ID</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Batch</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Current Role</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Access Controls</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {users.map((userRecord) => (
                              <TableRow key={userRecord.id} hover>
                                <TableCell className="admin-cell-wrap">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {userRecord.first_name} {userRecord.last_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {userRecord.email}
                                  </Typography>
                                </TableCell>
                                <TableCell className="admin-cell-wrap">{userRecord.university_id || '-'}</TableCell>
                                <TableCell className="admin-cell-top">
                                  {roleNeedsDepartment(userRecord.role) ? (
                                    <TextField
                                      select
                                      size="small"
                                      value={userRecord.department_id || 'BL'}
                                      disabled={updatingUserId === userRecord.id}
                                      onChange={(event) => handleUserAccessChange(userRecord, { department_id: event.target.value })}
                                      sx={{ minWidth: 180 }}
                                    >
                                      {departments.map((department) => (
                                        <MenuItem key={department.id} value={department.id}>
                                          {department.name}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      Not restricted
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell className="admin-cell-top">
                                  <TextField
                                    select
                                    size="small"
                                    value={userRecord.batch || '47'}
                                    disabled={updatingUserId === userRecord.id || !['student', 'representative'].includes(userRecord.role)}
                                    onChange={(event) => handleUserAccessChange(userRecord, { batch: event.target.value })}
                                    sx={{ minWidth: 150 }}
                                  >
                                    {batchOptions.map((batch) => (
                                      <MenuItem key={batch} value={batch}>
                                        {`${batch}th`}
                                      </MenuItem>
                                    ))}
                                  </TextField>
                                </TableCell>
                                <TableCell className="admin-cell-top">
                                  <Chip 
                                    label={userRecord.role} 
                                    color={userRecord.role === 'admin' ? 'success' : userRecord.role === 'representative' ? 'warning' : userRecord.role === 'lecturer' ? 'info' : 'default'} 
                                    size="small" 
                                    sx={{ borderRadius: 999 }} 
                                  />
                                </TableCell>
                                <TableCell className="admin-cell-wrap">{formatDateTime(userRecord.last_login || userRecord.createdAt)}</TableCell>
                                <TableCell className="admin-cell-top">
                                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <TextField
                                      select
                                      size="small"
                                      value={userRecord.role}
                                      disabled={updatingUserId === userRecord.id}
                                      onChange={(event) => handleUserAccessChange(userRecord, { role: event.target.value })}
                                      sx={{ minWidth: 180 }}
                                    >
                                      {roleOptions.map((role) => (
                                        <MenuItem key={role} value={role}>
                                          {role}
                                        </MenuItem>
                                      ))}
                                    </TextField>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {(isSessionsTab || isReviewTab) && (
        <Grid container spacing={3} alignItems="stretch">
        {isSessionsTab && (
        <Grid item xs={12} xl={5}>
          <Card className="ui-surface-card admin-panel">
            <CardContent className="admin-panel-body">
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                    Session catalogue
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                    Quick access to timings and QR links for each submission window.
                  </Typography>
                </Box>

                {sessions.length === 0 && (
                  <Alert severity="info">No sessions yet. Create the first one above.</Alert>
                )}

                <Stack spacing={2} className="admin-scroll-area admin-session-list">
                  {sessions.map((session) => (
                    <Box key={session.id} className="admin-session-card">
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.5}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {session.session_title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {session.subject} | {session.department_name} | {session.semester || 'Semester 1'} | {session.batch === 'all' ? 'All batches' : `${session.batch}th batch`} | {session.attendance_mode === 'representative_batch' ? 'Rep confirmation' : 'Individual'}
                            </Typography>
                          </Box>
                          <Chip
                            label={session.status}
                            color={session.status === 'active' ? 'success' : 'default'}
                            sx={{ alignSelf: 'flex-start', borderRadius: 999 }}
                          />
                        </Stack>

                        <Grid container spacing={1.5}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">Opens</Typography>
                            <Typography variant="body2">{formatDateTime(session.available_from)}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">Deadline</Typography>
                            <Typography variant="body2">{formatDateTime(session.submission_deadline)}</Typography>
                          </Grid>
                        </Grid>

                        {session.qr_code ? (
                          <Box className="admin-session-actions">
                            <Button variant="contained" onClick={() => startEditSession(session)} startIcon={<EditIcon />}>
                              Edit Session
                            </Button>
                            <Button variant="outlined" onClick={() => handleRegenerateQr(session.id)}>
                              Regenerate QR
                            </Button>
                            <Button
                              variant="text"
                              startIcon={<CopyIcon />}
                              onClick={() => handleCopyQrLink(session.qr_code.code)}
                            >
                              Copy QR Link
                            </Button>
                          </Box>
                        ) : (
                          <Box className="admin-session-actions">
                            <Button variant="contained" onClick={() => startEditSession(session)} startIcon={<EditIcon />}>
                              Edit Session
                            </Button>
                            <Button variant="outlined" onClick={() => handleRegenerateQr(session.id)}>
                              Generate QR
                            </Button>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        )}

        {isReviewTab && (
        <Grid item xs={12} xl={isSessionsTab ? 7 : 12}>
          <Card className="ui-surface-card admin-panel">
            <CardContent className="admin-panel-body">
              <Stack spacing={3}>
                <Box className="admin-review-header">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} className="admin-section-heading">
                      Submission review
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="admin-section-copy">
                      Filter by department, session, or student to find the submissions that need attention.
                    </Typography>
                  </Box>
                  <Box className="admin-summary-chips">
                    <Chip label={`${filteredSummary.total} total`} sx={{ maxWidth: '100%' }} />
                    <Chip label={`${filteredSummary.pending} pending`} color="warning" sx={{ maxWidth: '100%' }} />
                    <Chip label={`${filteredSummary.published} published`} color="success" sx={{ maxWidth: '100%' }} />
                    <Chip label={`${filteredSummary.late} late`} color="error" sx={{ maxWidth: '100%' }} />
                  </Box>
                </Box>

                <Box className="admin-filter-grid">
                  <Box className="admin-filter-item">
                    <TextField
                      fullWidth
                      select
                      label="Status"
                      value={filters.status}
                      onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="on_time">On time</MenuItem>
                      <MenuItem value="late">Late</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                    </TextField>
                  </Box>
                  <Box className="admin-filter-item">
                    <TextField
                      fullWidth
                      select
                      label="Department"
                      value={filters.department_id}
                      onChange={(event) => setFilters((current) => ({ ...current, department_id: event.target.value }))}
                      disabled={isDepartmentLocked}
                    >
                      {!isDepartmentLocked && <MenuItem value="all">All</MenuItem>}
                      {departments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                        ))}
                      </TextField>
                  </Box>
                  <Box className="admin-filter-item">
                    <TextField
                      fullWidth
                      select
                      label="Session"
                      value={filters.session_id}
                      onChange={(event) => setFilters((current) => ({ ...current, session_id: event.target.value }))}
                    >
                      <MenuItem value="all">All</MenuItem>
                      {sessions.map((session) => (
                        <MenuItem key={session.id} value={session.id}>
                          {session.session_title}
                        </MenuItem>
                        ))}
                      </TextField>
                  </Box>
                  <Box className="admin-filter-item">
                    <TextField
                      fullWidth
                      label="Search Student"
                      placeholder="Name, email, or ID"
                      value={filters.search}
                      onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                    />
                  </Box>
                </Box>
                <Box className="admin-actions">
                  <Button variant="outlined" startIcon={<ResetIcon />} onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </Box>

                {loadingSubmissions ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={28} />
                  </Box>
                ) : submissions.length === 0 ? (
                  <Alert severity="info">No submissions matched the current filters.</Alert>
                ) : (
                  <Box className="admin-table-shell">
                    <TableContainer className="admin-scroll-area admin-table-scroll ui-responsive-table">
                      <Table stickyHeader className="admin-table">
                        <TableHead className="admin-table-head">
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Review</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {submissions.map((submission) => (
                          <TableRow key={submission.id} hover>
                            <TableCell className="admin-cell-wrap">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {submission.student_name || '-'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {submission.student?.email}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {submission.student?.university_id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {submission.student?.batch ? `${submission.student.batch}th batch` : 'No batch set'}
                              </Typography>
                            </TableCell>
                            <TableCell className="admin-cell-wrap">
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {submission.session?.session_title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {submission.session?.subject} | {submission.session?.semester || 'Semester 1'}
                              </Typography>
                            </TableCell>
                            <TableCell className="admin-cell-wrap">{submission.department_name}</TableCell>
                            <TableCell className="admin-cell-wrap">{formatDateTime(submission.submission_time)}</TableCell>
                            <TableCell className="admin-cell-top">
                              <Chip
                                label={submission.status.replace('_', ' ')}
                                color={statusColorMap[submission.status] || 'default'}
                                size="small"
                                sx={{ borderRadius: 999 }}
                              />
                            </TableCell>
                            <TableCell className="admin-cell-top">
                              <Chip
                                label={submission.review_status}
                                color={statusColorMap[submission.review_status] || 'default'}
                                size="small"
                                sx={{ borderRadius: 999 }}
                              />
                            </TableCell>
                            <TableCell className="admin-cell-top">
                              {submission.marks ? (
                                <Box className="admin-grade-summary">
                                  <Typography variant="body2" className="admin-grade-value">
                                    {submission.marks.final_marks ?? submission.marks.obtained_marks} / {submission.marks.total_marks}
                                  </Typography>
                                  <Typography component="span" className="admin-grade-meta">
                                    {submission.marks.percentage}% {Number(submission.marks.penalties || 0) > 0 ? `| Penalty ${submission.marks.penalties}` : ''}
                                  </Typography>
                                  <Typography component="span" className="admin-feedback-preview">
                                    {submission.marks.feedback || 'No feedback added yet.'}
                                  </Typography>
                                </Box>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="admin-cell-top">
                              <Button
                                variant={submission.marks ? 'outlined' : 'contained'}
                                size="small"
                                onClick={() => openGradeDialog(submission)}
                              >
                                {submission.marks ? 'Edit Grade' : 'Grade'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        )}
      </Grid>
      )}

      <Dialog
        open={Boolean(gradingSubmission)}
        onClose={closeGradeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {gradingSubmission?.marks ? 'Update Grade' : 'Grade Submission'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {gradingSubmission && (
              <Box className="ui-info-box" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                  {gradingSubmission.student_name || 'Student'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {gradingSubmission.student?.email} | {gradingSubmission.student?.university_id}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {gradingSubmission.session?.session_title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {gradingSubmission.session?.subject} | Submitted {formatDateTime(gradingSubmission.submission_time)}
                </Typography>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Obtained Marks"
                  type="number"
                  value={gradeForm.obtained_marks}
                  onChange={(event) => handleGradeChange('obtained_marks', event.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Marks"
                  type="number"
                  value={gradeForm.total_marks}
                  onChange={(event) => handleGradeChange('total_marks', event.target.value)}
                  inputProps={{ min: 1, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Penalty"
                  type="number"
                  value={gradeForm.penalties}
                  onChange={(event) => handleGradeChange('penalties', event.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Percentage"
                  value={`${Number.isFinite(gradePercentage) ? gradePercentage.toFixed(2) : '0.00'}%`}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Final Marks"
                  value={Number.isFinite(finalMarksPreview) ? finalMarksPreview.toFixed(2) : '0.00'}
                  InputProps={{
                    readOnly: true,
                    endAdornment: <InputAdornment position="end">after penalty</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Feedback"
                  value={gradeForm.feedback}
                  onChange={(event) => handleGradeChange('feedback', event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={gradeForm.visibility_to_student}
                      onChange={(event) => handleGradeChange('visibility_to_student', event.target.checked)}
                    />
                  }
                  label="Publish grade to student immediately"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeGradeDialog} disabled={submittingGrade}>Cancel</Button>
          {gradingSubmission?.marks && (
            <Button color="error" onClick={handleDeleteGrade} disabled={submittingGrade}>
              Reset Grade
            </Button>
          )}
          <Button onClick={handleSaveGrade} variant="contained" disabled={submittingGrade}>
            {submittingGrade ? 'Saving...' : gradeForm.visibility_to_student ? 'Save and Publish' : 'Save Draft'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
