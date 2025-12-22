import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // ==========================
  // 1️⃣ SEND EMPLOYEE CREDENTIALS
  // ==========================
  async sendEmployeeCredentials(email: string, password: string) {
    await this.transporter.sendMail({
      to: email,
      subject: 'Your Robomanthan Account Credentials',
      html: `
        <p>Your employee account has been created.</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Password:</b> ${password}</p>
        <p>Please login and change your password.</p>
      `,
    });
  }

  // ==========================
  // 2️⃣ PASSWORD RESET LINK
  // ==========================
  async sendPasswordResetLink(email: string, resetLink: string) {
    await this.transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    });
  }

  // ==========================
  // 3️⃣ LEAVE REQUEST → HR / MANAGER
  // ==========================
  async sendLeaveRequestToApprover(data: {
    employeeName: string;
    employeeEmail: string;
    type: string;
    reason: string;
    fromDate: Date;
    toDate: Date;
    approvalToken: string;
  }) {
    const approveLink = `${process.env.BACKEND_URL}/leaves/approve?token=${data.approvalToken}`;
    const rejectLink = `${process.env.BACKEND_URL}/leaves/reject?token=${data.approvalToken}`;

    await this.transporter.sendMail({
      to: process.env.APPROVER_EMAIL,
      subject: 'New Leave Request',
      html: `
        <p><b>${data.employeeName}</b> has requested leave.</p>
        <p><b>Type:</b> ${data.type}</p>
        <p><b>Reason:</b> ${data.reason}</p>
        <p><b>From:</b> ${data.fromDate.toDateString()}</p>
        <p><b>To:</b> ${data.toDate.toDateString()}</p>
        <br/>
        <a href="${approveLink}">Approve</a> |
        <a href="${rejectLink}">Reject</a>
      `,
    });
  }

  // ==========================
  // 4️⃣ LEAVE DECISION → EMPLOYEE
  // ==========================
  async sendLeaveDecisionToEmployee(data: {
    email: string;
    name: string;
    status: 'APPROVED' | 'REJECTED';
  }) {
    await this.transporter.sendMail({
      to: data.email,
      subject: `Leave ${data.status}`,
      html: `
        <p>Hi ${data.name},</p>
        <p>Your leave request has been <b>${data.status}</b>.</p>
      `,
    });
  }
}
