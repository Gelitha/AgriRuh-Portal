import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import './index.css'
import './styles/ui.css'
import './styles/auth.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2f6b4f',
      light: '#4c8a69',
      dark: '#1e4b37',
      contrastText: '#fffaf5'
    },
    secondary: {
      main: '#55734e',
      light: '#73916c',
      dark: '#39503a',
      contrastText: '#f8f2ea'
    },
    success: {
      main: '#2f7d57',
      light: '#4d9a73',
      dark: '#21583d'
    },
    warning: {
      main: '#b38a2e',
      light: '#c9a555',
      dark: '#86661f'
    },
    error: {
      main: '#b3473a',
      light: '#cb6b5d',
      dark: '#822f24'
    },
    info: {
      main: '#55734e',
      light: '#73916c',
      dark: '#39503a'
    },
    background: {
      default: '#edf4ec',
      paper: '#fffdf9'
    },
    text: {
      primary: '#213328',
      secondary: '#5c6f61'
    }
  },
  typography: {
    fontFamily: '"Sora", "IBM Plex Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.05em' },
    h2: { fontWeight: 700, letterSpacing: '-0.05em' },
    h3: { fontWeight: 700, letterSpacing: '-0.05em' },
    h4: { fontWeight: 700, letterSpacing: '-0.04em' },
    h5: { fontWeight: 700, letterSpacing: '-0.03em' },
    h6: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { fontWeight: 600, textTransform: 'none' }
  },
  shape: {
    borderRadius: 18
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(34, 62, 42, 0.08)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          paddingInline: 18,
          minHeight: 44
        },
        contained: {
          boxShadow: 'none'
        },
        containedPrimary: {
          backgroundImage: 'linear-gradient(135deg, #2f6b4f 0%, #4c8a69 100%)'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(243, 248, 240, 0.92)'
        }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '14px',
            border: '1px solid rgba(47,107,79,0.12)',
            background: '#fffdf9',
            color: '#213328',
            boxShadow: '0 18px 48px rgba(34,62,42,0.14)'
          }
        }}
      />
    </ThemeProvider>
  </BrowserRouter>,
)
