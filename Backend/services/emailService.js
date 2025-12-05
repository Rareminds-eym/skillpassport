import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Note: Environment variables are loaded by server.js

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!config.auth.user || !config.auth.pass) {
    console.error('❌ Email credentials not configured!');
    console.error('Please set SMTP_USER and SMTP_PASS in .env file');
    return null;
  }

  transporter = nodemailer.createTransport(config);
  return transporter;
}

/**
 * Load email template and replace placeholders
 */
function loadTemplate(templateNumber, replacements) {
  try {
    const templatePath = join(__dirname, '..', 'templates', `email${templateNumber}-template.html`);
    let template = readFileSync(templatePath, 'utf-8');

    // Replace all placeholders
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, replacements[key]);
    });

    return template;
  } catch (error) {
    console.error(`❌ Error loading template ${templateNumber}:`, error.message);
    return null;
  }
}

/**
 * Get email subject based on template number
 */
function getEmailSubject(templateNumber, studentName, currentStreak) {
  const subjects = {
    1: `${studentName}, your streak misses you! 🥺`,
    2: `${studentName}, umm... everything okay? 🤔`,
    3: `🚨 STREAK EMERGENCY! This is not a drill! 🚨`,
    4: `💀 We tried to warn you... (Last chance, ${studentName}!)`,
  };

  return subjects[templateNumber] || `Streak Reminder - ${studentName}`;
}

/**
 * Send streak reminder email
 * @param {Object} student - Student object with email, name, etc.
 * @param {number} templateNumber - Which template to use (1-4)
 * @returns {Promise<Object>} - Result object with success status
 */
export async function sendStreakReminderEmail(student, templateNumber) {
  try {
    const transport = getTransporter();
    if (!transport) {
      throw new Error('Email transporter not configured');
    }

    const { email, name, current_streak = 0 } = student;

    if (!email) {
      throw new Error('Student email is missing');
    }

    // Calculate hours remaining until midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const hoursRemaining = Math.ceil((midnight - now) / (1000 * 60 * 60));

    // Prepare template replacements
    const replacements = {
      studentName: name || 'Student',
      currentStreak: current_streak,
      hoursRemaining: hoursRemaining,
      dashboardLink: `${process.env.FRONTEND_URL}/dashboard`,
      coursesLink: `${process.env.FRONTEND_URL}/courses`,
      unsubscribeLink: `${process.env.FRONTEND_URL}/settings/notifications`,
      currentYear: new Date().getFullYear(),
    };

    // Load template
    const htmlContent = loadTemplate(templateNumber, replacements);
    if (!htmlContent) {
      throw new Error(`Failed to load template ${templateNumber}`);
    }

    // Get subject line
    const subject = getEmailSubject(templateNumber, replacements.studentName, current_streak);

    // Email options
    const mailOptions = {
      from: {
        name: process.env.FROM_NAME || 'Skill Passport Team',
        address: process.env.FROM_EMAIL || process.env.SMTP_USER,
      },
      to: email,
      subject: subject,
      html: htmlContent,
      text: `Hi ${replacements.studentName},\n\nYou haven't completed your learning activity today. Your current streak is ${current_streak} days. Visit ${replacements.dashboardLink} to keep your streak alive!\n\nBest regards,\nSkill Passport Team`,
    };

    // Send email
    console.log(`📧 Sending email #${templateNumber} to ${email}...`);
    const info = await transport.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${email}`);
    console.log(`Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      email: email,
      templateNumber: templateNumber,
    };

  } catch (error) {
    console.error(`❌ Error sending email to ${student.email}:`, error.message);
    return {
      success: false,
      error: error.message,
      email: student.email,
      templateNumber: templateNumber,
    };
  }
}

/**
 * Test email configuration
 */
export async function testEmailConnection() {
  try {
    const transport = getTransporter();
    if (!transport) {
      return false;
    }

    await transport.verify();
    console.log('✅ Email server connection successful');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

export default {
  sendStreakReminderEmail,
  testEmailConnection,
};
