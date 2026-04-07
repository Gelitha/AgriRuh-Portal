import { useMemo, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Grid, Link, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../styles/auth.css'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const resetToken = searchParams.get('token') || ''
  const emailFromLink = searchParams.get('email') || ''
  const isResetMode = Boolean(resetToken && emailFromLink)

  const [requestEmail, setRequestEmail] = useState(emailFromLink)
  const [resetForm, setResetForm] = useState({
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const pageCopy = useMemo(() => (
    isResetMode
      ? {
          eyebrow: 'Reset Link',
          title: 'Choose a new password.',
          copy: 'This secure link is connected to your account email and will only work for a limited time.'
        }
      : {
          eyebrow: 'Account Recovery',
          title: 'Get a reset link by email.',
          copy: 'Enter the email address linked to your account and we will send a password reset link there.'
        }
  ), [isResetMode])

  const handleRequestSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.post('/auth/forgot-password/request', {
        email: requestEmail
      })
      setSuccess('If an account exists for that email, a reset link has been sent.')
      toast.success('Reset link request sent')
    } catch (err) {
      const nextError = err.response?.data?.error?.message || 'Failed to request password reset'
      setError(nextError)
      toast.error(nextError)
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (resetForm.new_password !== resetForm.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/forgot-password/reset', {
        email: emailFromLink,
        token: resetToken,
        new_password: resetForm.new_password
      })
      setSuccess('Password reset successfully. You can sign in now.')
      toast.success('Password reset successful')
    } catch (err) {
      const nextError = err.response?.data?.error?.message || 'Failed to reset password'
      setError(nextError)
      toast.error(nextError)
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
                {pageCopy.eyebrow}
              </Typography>
              <Typography variant="h2" sx={{ maxWidth: 520, fontSize: { xs: '2rem', sm: '2.4rem', md: '3rem' }, lineHeight: 1.1 }}>
                {pageCopy.title}
              </Typography>
              <Typography className="auth-copy">
                {pageCopy.copy}
              </Typography>
              <Box className="ui-info-box" sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Security note
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)' }}>
                  Reset links expire after 30 minutes. For staff accounts, use a protected institutional email inbox and keep recovery keys archived by admins.
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
                {isResetMode ? 'Set new password' : 'Forgot password'}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'text.secondary' }}>
                {isResetMode ? `Resetting password for ${emailFromLink}` : 'We will send the password reset link to your email'}
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              {isResetMode ? (
                <form onSubmit={handleResetSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={resetForm.new_password}
                      onChange={(event) => setResetForm((current) => ({ ...current, new_password: event.target.value }))}
                      required
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      value={resetForm.confirm_password}
                      onChange={(event) => setResetForm((current) => ({ ...current, confirm_password: event.target.value }))}
                      required
                      disabled={loading}
                    />
                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                      Reset password
                    </Button>
                  </Stack>
                </form>
              ) : (
                <form onSubmit={handleRequestSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={requestEmail}
                      onChange={(event) => setRequestEmail(event.target.value)}
                      required
                      disabled={loading}
                    />
                    <Button type="submit" variant="contained" size="large" disabled={loading}>
                      Send reset link
                    </Button>
                  </Stack>
                </form>
              )}

              <Typography variant="body2" sx={{ textAlign: 'center', mt: 3 }}>
                Remembered it?{' '}
                <Link onClick={() => navigate('/login')} className="auth-link">
                  Back to sign in
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Grid>
    </Grid>
  )
}
