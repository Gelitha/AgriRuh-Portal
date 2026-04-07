import QRCode from 'qrcode';
import { QRCode as QRCodeModel, Session } from '../models/index.js';

const QR_EXPIRY_MINUTES = parseInt(process.env.QR_EXPIRY_MINUTES || '120', 10);
const SUBMISSION_URL = process.env.SUBMISSION_URL || 'http://localhost:5173/scanner';

class QRCodeService {
  static createQRData(sessionId) {
    return `${SUBMISSION_URL}?session=${sessionId}`;
  }

  static async generateQRCode(sessionId) {
    const session = await Session.findByPk(sessionId);

    if (!session) {
      throw {
        status: 404,
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found'
      };
    }

    const qrData = this.createQRData(sessionId);
    const qrImageUrl = await QRCode.toDataURL(qrData, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000);

    const qrCode = await QRCodeModel.create({
      session_id: sessionId,
      code: qrData,
      qr_image_url: qrImageUrl,
      generated_at: new Date(),
      expires_at: expiresAt,
      is_active: true,
      scan_count: 0
    });

    session.qr_code_id = qrCode.id;
    await session.save();

    return qrCode;
  }

  static async regenerateQRCode(sessionId) {
    const session = await Session.findByPk(sessionId);

    if (!session) {
      throw {
        status: 404,
        code: 'SESSION_NOT_FOUND',
        message: 'Session not found'
      };
    }

    if (session.qr_code_id) {
      const current = await QRCodeModel.findByPk(session.qr_code_id);
      if (current) {
        current.is_active = false;
        await current.save();
      }
    }

    return this.generateQRCode(sessionId);
  }

  static async deactivateQRCode(qrCodeId) {
    const qrCode = await QRCodeModel.findByPk(qrCodeId);

    if (!qrCode) {
      throw {
        status: 404,
        code: 'QR_NOT_FOUND',
        message: 'QR code not found'
      };
    }

    qrCode.is_active = false;
    await qrCode.save();
    return qrCode;
  }
}

export default QRCodeService;
