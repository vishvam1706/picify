import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import logger from './logger';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

function compileTemplate(templateName, variables) {
  const templatePath = path.join(process.cwd(), 'emails', 'templates', `${templateName}.hbs`);
  const source = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(source);
  return template(variables);
}

export async function sendEmail({ to, subject, templateName, variables, html }) {
  try {
    const transport = getTransporter();
    const htmlContent = templateName ? compileTemplate(templateName, variables) : html;
    await transport.sendMail({
      from: `"Picify" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    logger.info(`[Email] Sent "${subject}" to ${to}`);
  } catch (err) {
    logger.error(`[Email] Failed to send to ${to}: ${err.message}`);
    throw err;
  }
}
