import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography
} from '@mui/material'
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  QrCode2 as QrIcon,
  Description as FileIcon,
  Grade as GradeIcon,
  Home as HomeIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'
import axios from 'axios'

const API_BASE = '/api'
const adminWorkspaceRoles = ['admin', 'lecturer', 'demonstrator']
const studentWorkspaceRoles = ['student', 'representative']

export default function AppHeader() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [location.pathname])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setUser(null)
      return
    }

    try {
      const response = await axios.get(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data.data)
    } catch (err) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setAnchorEl(null)
    navigate('/login')
  }

  const baseMenuItems = [
    { icon: <HomeIcon fontSize="small" />, label: 'Home', path: '/' }
  ]
  const studentMenuItems = [
    { icon: <DashboardIcon fontSize="small" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <QrIcon fontSize="small" />, label: 'Scanner', path: '/scanner' },
    { icon: <FileIcon fontSize="small" />, label: 'Submissions', path: '/submissions' },
    { icon: <GradeIcon fontSize="small" />, label: 'Grades', path: '/grades' }
  ]
  const adminMenuItems = [
    { icon: <AdminIcon fontSize="small" />, label: 'Admin', path: '/admin' }
  ]
  const activeItems = user
    ? [
        ...baseMenuItems,
        ...(studentWorkspaceRoles.includes(user.role) ? studentMenuItems : []),
        ...(adminWorkspaceRoles.includes(user.role) ? adminMenuItems : [])
      ]
    : baseMenuItems

  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        sx={{
          px: { xs: 1, md: 2 },
          pt: { xs: 1, md: 1.5 },
          pb: { xs: 1, md: 1.5 },
          bgcolor: 'transparent'
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: '64px !important', md: '72px !important' },
            borderRadius: 3,
            border: '1px solid var(--color-border)',
            bgcolor: 'rgba(250,253,249,0.92)',
            boxShadow: 'var(--shadow-soft)',
            backdropFilter: 'blur(10px)',
            px: { xs: 1.5, md: 2.25 }
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
                color: 'common.white',
                fontWeight: 700
              }}
            >
              A
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                AgriRuh Lab Portal
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Faculty of Agriculture, University of Ruhuna
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', lg: 'flex' }, mr: 1.5 }}>
            {activeItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Button
                  key={item.path}
                  startIcon={item.icon}
                  onClick={() => navigate(item.path)}
                  variant={active ? 'contained' : 'text'}
                  color={active ? 'primary' : 'inherit'}
                  sx={{
                    color: active ? 'common.white' : 'text.primary',
                    borderRadius: 1.5,
                    px: 2
                  }}
                >
                  {item.label}
                </Button>
              )
            })}
          </Stack>

          {user ? (
            <Stack direction="row" spacing={1} alignItems="center">
              {adminWorkspaceRoles.includes(user.role) && (
                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    borderRadius: 1.5,
                    bgcolor: 'rgba(47, 107, 79, 0.12)',
                    color: 'primary.main'
                  }}
                />
              )}
              <Button
                onClick={(event) => setAnchorEl(event.currentTarget)}
                sx={{ borderRadius: 1.5, color: 'text.primary', px: 1 }}
              >
                <Avatar sx={{ width: 34, height: 34, mr: 1, bgcolor: 'secondary.main' }}>
                  {user.first_name?.charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                    {user.first_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user.role}
                  </Typography>
                </Box>
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button onClick={() => navigate('/login')}>Login</Button>
              <Button variant="contained" onClick={() => navigate('/register')}>
                Register
              </Button>
            </Stack>
          )}

          <IconButton
            sx={{ display: { xs: 'inline-flex', lg: 'none' }, ml: 1 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: 2 }}>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Navigation
            </Typography>
            {user && (
              <Typography variant="body2" color="text.secondary">
                {user.first_name} {user.last_name}
              </Typography>
            )}
          </Stack>
          <List sx={{ p: 0 }}>
            {activeItems.map((item) => (
              <ListItemButton
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setDrawerOpen(false)
                }}
                sx={{ borderRadius: 1.5, mb: 0.5 }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {user ? (
              <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1.5, mt: 1.5, color: 'error.main' }}>
                <LogoutIcon fontSize="small" style={{ marginRight: 12 }} />
                <ListItemText primary="Sign out" />
              </ListItemButton>
            ) : (
              <>
                <ListItemButton onClick={() => { navigate('/login'); setDrawerOpen(false) }} sx={{ borderRadius: 1.5, mt: 1.5 }}>
                  <ListItemText primary="Login" />
                </ListItemButton>
                <ListItemButton onClick={() => { navigate('/register'); setDrawerOpen(false) }} sx={{ borderRadius: 1.5 }}>
                  <ListItemText primary="Register" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); navigate(adminWorkspaceRoles.includes(user?.role) ? '/admin' : '/dashboard') }}>
          Open workspace
        </MenuItem>
        <MenuItem onClick={handleLogout}>Sign out</MenuItem>
      </Menu>
    </>
  )
}
