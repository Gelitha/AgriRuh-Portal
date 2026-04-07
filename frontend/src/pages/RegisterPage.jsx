import { useState } from 'react'
import { Card, CardContent, TextField, Button, Typography, Box, Alert, CircularProgress, Stack, Link, Grid, MenuItem, InputAdornment, FormControlLabel, Switch } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = '/api'
const degreeOptions = [
  {
    value: 'ARMT',
    label: 'ARMT',
    fullName: 'Agricultural Resource Management and Technology',
    indexCode: 'AT'
  },
  {
    value: 'AB',
    label: 'AB',
    fullName: 'Agribusiness Management',
    indexCode: 'AB'
  },
  {
    value: 'GT',
    label: 'GT',
    fullName: 'Green Technology',
    indexCode: 'GT'
  }
]
const yearOptions = ['2023', '2024', '2025', '2026']

const buildUniversityId = (degreeCode, admissionYear, suffix) => {
  const selectedDegree = degreeOptions.find((option) => option.value === degreeCode)
  const normalizedSuffix = String(suffix || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase()

  if (!selectedDegree || !admissionYear) {
    return normalizedSuffix
  }

  return `AG/${selectedDegree.indexCode}/${admissionYear}/${normalizedSuffix}`
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    degree_code: 'ARMT',
    admission_year: '2023',
    university_id_suffix: '',
    custom_university_id: '',
    manual_university_id: false,
    batch: '47'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedDegree = degreeOptions.find((option) => option.value === formData.degree_code)
  const generatedUniversityId = buildUniversityId(formData.degree_code, formData.admission_year, formData.university_id_suffix)
  const universityId = formData.manual_university_id ? formData.custom_university_id.trim().toUpperCase() : generatedUniversityId

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((current) => ({
      ...current,
      [name]: ['university_id_suffix', 'custom_university_id'].includes(name)
        ? value.replace(/[^0-9A-Za-z/]/g, '').toUpperCase()
        : value
    }))
    setError('')
  }

  const handleManualUniversityIdToggle = (event) => {
    const enabled = event.target.checked
    setFormData((current) => ({
      ...current,
      manual_university_id: enabled,
      custom_university_id: enabled ? current.custom_university_id || generatedUniversityId : ''
    }))
    setError('')
  }

  const handleClearUniversityId = () => {
    setFormData((current) => ({
      ...current,
      university_id_suffix: '',
      custom_university_id: ''
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!universityId) {
      setError(formData.manual_university_id ? 'Enter the full university ID' : 'Enter the last part of your university index number')
      setLoading(false)
      return
    }

    try {
      await axios.post(`${API_BASE}/auth/register`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        university_id: universityId,
        batch: formData.batch,
        degree_code: formData.degree_code,
        admission_year: formData.admission_year
      })

      toast.success('Registration successful! Please log in.')
      navigate('/login')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={3} alignItems="stretch" className="auth-layout">
      <Grid item xs={12} lg={5}>
        <Card className="auth-brand-panel">
          <CardContent className="auth-brand-content" sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              <Typography variant="overline" className="auth-eyebrow">
                AgriRuh Portal
              </Typography>
              <Typography variant="h2" sx={{ maxWidth: 520, fontSize: { xs: '2rem', sm: '2.4rem', md: '3rem' }, lineHeight: 1.1 }}>
                Register for access to the laboratory submission portal.
              </Typography>
              <Typography className="auth-copy">
                Student registration links your academic details to the Faculty of Agriculture submission and grading workflow.
              </Typography>
              <Box className="ui-info-box" sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                  Index examples
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ARMT: AG/AT/2023/xxxx
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AB: AG/AB/2024/xxxx
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  GT: AG/GT/year/xxxx
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={7}>
        <Box className="auth-center-shell">
          <Card className="auth-compact-card ui-surface-card">
            <CardContent className="auth-form-content" sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h4" sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}>
                Create account
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
                Enter your student details and generate your university index automatically
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    select
                    label="Degree Programme"
                    name="degree_code"
                    value={formData.degree_code}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    helperText={selectedDegree?.fullName || ''}
                  >
                    {degreeOptions.map((degree) => (
                      <MenuItem key={degree.value} value={degree.value}>
                        {`${degree.label} - ${degree.fullName}`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Admission / Index Year"
                        name="admission_year"
                        value={formData.admission_year}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        {yearOptions.map((year) => (
                          <MenuItem key={year} value={year}>
                            {year}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label="Batch"
                        name="batch"
                        value={formData.batch}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        {['44', '45', '46', '47', '48'].map((batch) => (
                          <MenuItem key={batch} value={batch}>
                            {`${batch}th batch`}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.manual_university_id}
                        onChange={handleManualUniversityIdToggle}
                        disabled={loading}
                      />
                    }
                    label="Manual university ID entry for batch-miss or special cases"
                  />
                  {formData.manual_university_id ? (
                    <TextField
                      fullWidth
                      label="University ID"
                      name="custom_university_id"
                      value={formData.custom_university_id}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="AG/AT/2023/0001"
                      helperText="Use this when the generated pattern does not match your official index."
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label="University Index Suffix"
                      name="university_id_suffix"
                      value={formData.university_id_suffix}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="0001"
                      helperText="Enter only the final number block. The prefix is generated for you."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {`AG/${selectedDegree?.indexCode || '--'}/${formData.admission_year}/`}
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                  <TextField
                    fullWidth
                    label="University ID"
                    value={universityId}
                    InputProps={{ readOnly: true }}
                    disabled={loading}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleClearUniversityId}
                    disabled={loading || (!formData.university_id_suffix && !formData.custom_university_id)}
                  >
                    Clear university ID
                  </Button>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    helperText="Minimum 6 characters"
                  />
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Create account'}
                  </Button>
                </Stack>
              </form>

              <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
                Already have an account?{' '}
                <Link onClick={() => navigate('/login')} className="auth-link">
                  Sign in here
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Grid>
    </Grid>
  )
}
