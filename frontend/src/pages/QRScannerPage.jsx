import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, Typography, Box, Button, TextField, Stack, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Camera as CameraIcon } from '@mui/icons-material'
import jsQR from 'jsqr'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function QRScannerPage() {
  const [searchParams] = useSearchParams()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [sessions, setSessions] = useState([])
  const [formData, setFormData] = useState({ session_id: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions')
      const nextSessions = response.data.data || []
      setSessions(nextSessions)

      const sessionFromUrl = searchParams.get('session')
      if (sessionFromUrl) {
        setFormData((current) => ({ ...current, session_id: sessionFromUrl }))
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      toast.error('Failed to load sessions')
    }
  }

  const startScanning = async () => {
    setScanning(true)
    setLoading(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        scanQRCode()
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      toast.error('Unable to access camera. Please check permissions.')
      setScanning(false)
      setLoading(false)
    }
  }

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
    }
    setScanning(false)
    setScannedData(null)
  }

  const scanQRCode = () => {
    const canvas = canvasRef.current
    if (!canvas || !videoRef.current) return

    const context = canvas.getContext('2d')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight

    const drawImage = () => {
      context.drawImage(videoRef.current, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code) {
        setScannedData(code.data)
        setLoading(false)

        try {
          const parsed = new URL(code.data)
          const sessionId = parsed.searchParams.get('session')
          if (sessionId) {
            setFormData((current) => ({ ...current, session_id: sessionId }))
          }
        } catch {
          // Ignore unreadable QR payloads
        }
      } else if (scanning) {
        requestAnimationFrame(drawImage)
      }
    }

    drawImage()
  }

  const handleSubmit = async () => {
    if (!formData.session_id) {
      toast.error('Please select a session')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/submissions', {
        session_id: formData.session_id,
        notes: formData.notes || null,
        device_info: {
          source: scannedData ? 'qr_scan' : 'manual_selection'
        }
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      })

      toast.success('Submission successful!')
      stopScanning()
      setFormData((current) => ({ ...current, notes: '' }))
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Submission failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>QR Code Scanner</Typography>

      {!scanning ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CameraIcon sx={{ fontSize: 80, color: 'primary.light', mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 3, color: 'textSecondary' }}>
              Scan a generated session QR code or choose an active session manually.
            </Typography>
            <Button variant="contained" size="large" onClick={startScanning}>
              Start Camera
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              )}

              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  maxHeight: 400,
                  borderRadius: 8,
                  border: '2px solid rgba(47, 107, 79, 0.22)'
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {scannedData && (
                <Alert severity="success">
                  QR code detected. Session has been selected automatically if the payload was valid.
                </Alert>
              )}

              <FormControl fullWidth>
                <InputLabel>Select Lab Session</InputLabel>
                <Select
                  value={formData.session_id}
                  onChange={(event) => setFormData((current) => ({ ...current, session_id: event.target.value }))}
                  label="Select Lab Session"
                >
                  {sessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>
                      {session.session_title || session.lab_name || `Lab ${session.id}`} - {new Date(session.date || session.submission_deadline).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Submission Notes (Optional)"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Add any notes for your submission"
              />

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={submitting || !formData.session_id}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={stopScanning}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
