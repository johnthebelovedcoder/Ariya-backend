import nodemailer from 'nodemailer';
import { env, isDevelopment } from './env';
import Logger from './logger-service';

/**
 * Email service for sending transactional emails
 * Supports SMTP and console logging for development
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // In development, use console logging or ethereal email
    if (isDevelopment) {
      Logger.info('Email service running in development mode - emails will be logged to console');
      return;
    }

    // In production, use SMTP configuration
    if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT),
        secure: parseInt(env.SMTP_PORT) === 465, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });

      Logger.info('Email service initialized with SMTP configuration');
    } else {
      Logger.warn('SMTP configuration not found - emails will be logged to console');
    }
  }

  /**
   * Send an email
   */
  async send(options: EmailOptions): Promise<boolean> {
    try {
      // In development or when SMTP is not configured, log to console
      if (!this.transporter) {
        Logger.info('Email would be sent:', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) || options.html.substring(0, 100),
        });
        return true;
      }

      // Send actual email
      const info = await this.transporter.sendMail({
        from: env.SMTP_FROM || `"Ariya" <${env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      Logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      Logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${env.NEXTAUTH_URL}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Ariya!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for registering with Ariya. Please verify your email address to get started.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with Ariya, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariya. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to Ariya!
      
      Hi ${name},
      
      Thank you for registering with Ariya. Please verify your email address to get started.
      
      Click this link to verify your email: ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with Ariya, please ignore this email.
    `;

    return this.send({
      to: email,
      subject: 'Verify your Ariya account',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${env.NEXTAUTH_URL}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password for your Ariya account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <div class="warning">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariya. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Password Reset Request
      
      Hi ${name},
      
      We received a request to reset your password for your Ariya account.
      
      Click this link to reset your password: ${resetUrl}
      
      This link will expire in 1 hour.
      
      Security Notice: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    `;

    return this.send({
      to: email,
      subject: 'Reset your Ariya password',
      html,
      text,
    });
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Ariya! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Your email has been verified successfully! You're all set to start planning amazing events.</p>
              <p>Here's what you can do with Ariya:</p>
              <ul>
                <li>Create and manage events</li>
                <li>Find and book vendors</li>
                <li>Track your budget</li>
                <li>Manage guest lists</li>
                <li>Get AI-powered planning assistance</li>
              </ul>
              <a href="${env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariya. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Welcome to Ariya! 🎉
      
      Hi ${name},
      
      Your email has been verified successfully! You're all set to start planning amazing events.
      
      Here's what you can do with Ariya:
      - Create and manage events
      - Find and book vendors
      - Track your budget
      - Manage guest lists
      - Get AI-powered planning assistance
      
      Visit your dashboard: ${env.NEXTAUTH_URL}/dashboard
    `;

    return this.send({
      to: email,
      subject: 'Welcome to Ariya!',
      html,
      text,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
