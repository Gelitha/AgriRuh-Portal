import { useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Link,
  Stack,
  TextField,
  Typography,
  Divider
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = '/api'
const adminWorkspaceRoles = ['admin', 'lecturer', 'demonstrator']
const demoAccounts = [
  { role: 'Admin', email: 'admin.portal@agri.demo', password: 'Demo@123' },
  { role: 'Lecturer', email: 'lecturer.crop@agri.demo', password: 'Demo@123' },
  { role: 'Demonstrator', email: 'demo.soil@agri.demo', password: 'Demo@123' },
  { role: 'Representative', email: 'rep.batch47@agri.demo', password: 'Demo@123' },
  { role: 'Student', email: 'anudi.peiris@agri.demo', password: 'Demo@123' }
]

const carouselData = Array.from({ length: 10 }, (_, i) => ({
  title: 'Faculty of Agriculture',
  description: 'University of Ruhuna – Excellence in Agriculture & Innovation.',
  image: `https://www.agri.ruh.ac.lk/assets/img/${i + 1}.jpg`
}))

export default function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselData.length)
        setFade(true)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value })
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: formData.email,
        password: formData.password
      })

      const { access_token, refresh_token, user } = response.data.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      toast.success('Welcome to AgriRuh Portal')
      navigate(adminWorkspaceRoles.includes(user?.role) ? '/admin' : '/dashboard')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Invalid email or password.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const slide = carouselData[currentSlide]

  return (
    <Grid container sx={{ minHeight: '100vh', overflow: 'hidden' }}>
      
      {/* --- LEFT SIDE: CAROUSEL --- */}
      <Grid item xs={12} lg={7} sx={{ position: 'relative', display: { xs: 'none', lg: 'block' } }}>
        <Box
          sx={{
            height: '100%',
            backgroundImage: `url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'flex-end',
            p: 8,
            color: '#fff',
            opacity: fade ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
        >
          {/* Neutral Dark Overlay (No Green Tint) */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(20,54,38,0.88) 0%, rgba(47,107,79,0.34) 58%, rgba(12,12,12,0.12) 100%)',
              zIndex: 0
            }}
          />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
              AgriRuh Lab Portal
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, fontWeight: 300, opacity: 0.8 }}>
              {slide.title} — {slide.description}
            </Typography>

            <Stack direction="row" spacing={1.5}>
              {carouselData.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  sx={{
                    width: i === currentSlide ? 32 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: i === currentSlide ? '#f7fff4' : 'rgba(247,255,244,0.34)',
                    transition: 'all 0.4s ease',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Grid>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <Grid
        item
        xs={12}
        lg={5}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f7fbf4'
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Card
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 440,
              background: 'transparent'
            }}
          >
            <CardContent>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please enter your credentials to access your dashboard.
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  alignItems: 'flex-start',
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Demo logins for client testing
                </Typography>
                <Stack spacing={1.25}>
                  {demoAccounts.map((account) => (
                    <Box
                      key={account.email}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.68)',
                        border: '1px solid rgba(47, 107, 79, 0.12)'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {account.role}
                      </Typography>
                      <Typography variant="caption" display="block">
                        {account.email}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Password: {account.password}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Alert>

              <form onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    fullWidth
                    variant="outlined"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                    <Link
                      onClick={() => navigate('/forgot-password')}
                      sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.8,
                      borderRadius: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 8px 24px rgba(47, 107, 79, 0.25)',
                      background: 'linear-gradient(135deg, #2f6b4f 0%, #4c8a69 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1e4b37 0%, #2f6b4f 100%)',
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Portal'}
                  </Button>
                </Stack>
              </form>

              <Divider sx={{ my: 4 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>

              <Typography variant="body2" textAlign="center" color="text.secondary">
                Don’t have an account?{' '}
                <Link
                  onClick={() => navigate('/register')}
                  sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Create an Account
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* --- CREDITS FOOTER --- */}
        <Box sx={{ p: 4, textAlign: 'center', borderTop: '1px solid rgba(47, 107, 79, 0.12)', bgcolor: '#f9fdf7' }}>
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            <strong>AgriRuh Lab Portal</strong>
            <br />
            Developed by <strong>Gelitha Jayawickram</strong> (47th Batch)
            <br />
            Faculty of Agriculture, University of Ruhuna
          </Typography>
        </Box>
      </Grid>
    </Grid>
  )
}
