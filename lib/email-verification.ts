import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const EMAIL_VERIFICATION_KEY = process.env.EMAIL_VERIFICATION_KEY;
if (!EMAIL_VERIFICATION_KEY) {
  throw new Error('EMAIL_VERIFICATION_KEY must be set');
}

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export function generateVerificationToken(email: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(EMAIL_VERIFICATION_KEY), iv);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 jours de validité

  const data = JSON.stringify({
    email,
    expiryDate: expiryDate.toISOString(),
  });

  let token = cipher.update(data, 'utf8', 'hex');
  token += cipher.final('hex');

  // Combine IV and encrypted data
  return `${iv.toString('hex')}:${token}`;
}

export function verifyToken(token: string): { email: string; expired: boolean } | null {
  try {
    const [ivHex, encryptedData] = token.split(':');
    
    if (!ivHex || !encryptedData) {
      return null;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(EMAIL_VERIFICATION_KEY), iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const { email, expiryDate } = JSON.parse(decrypted);
    const expired = new Date(expiryDate) < new Date();

    return { email, expired };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
  
  // Utiliser le service d'envoi d'email configuré (par exemple Resend)
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'noreply@leonaar.com',
    to: email,
    subject: 'Vérifiez votre adresse email',
    html: `
      <h1>Bienvenue sur 5A !</h1>
      <p>Pour vérifier votre adresse email, veuillez cliquer sur le lien ci-dessous :</p>
      <a href="${verificationUrl}">Vérifier mon email</a>
      <p>Ce lien est valable pendant 7 jours.</p>
      <p>Si vous n'avez pas créé de compte sur 5A, vous pouvez ignorer cet email.</p>
    `,
  });
} 