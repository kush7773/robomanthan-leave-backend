import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // =====================================================
  // EMPLOYEE → EMPLOYER (LEAVE REQUEST)
  // =====================================================
  async sendLeaveRequestToEmployer(payload: {
    employeeName: string;
    employeeEmail: string;
    type: string;
    reason: string;
    fromDate: Date;
    toDate: Date;
    approvalToken: string; // ✅ REQUIRED
  }) {
    const approveUrl = `${process.env.API_BASE_URL}/leaves/approve?token=${payload.approvalToken}`;
    const rejectUrl = `${process.env.API_BASE_URL}/leaves/reject?token=${payload.approvalToken}`;

    await this.transporter.sendMail({
      from: `"Leave System" <${process.env.SMTP_USER}>`,
      to: process.env.HR_EMAIL,
      subject: `Leave Request – ${payload.employeeName}`,
      html: `
        <h3>New Leave Request</h3>
        <p><b>Name:</b> ${payload.employeeName}</p>
        <p><b>Email:</b> ${payload.employeeEmail}</p>
        <p><b>Type:</b> ${payload.type}</p>
        <p><b>Reason:</b> ${payload.reason}</p>
        <p><b>From:</b> ${payload.fromDate.toDateString()}</p>
        <p><b>To:</b> ${payload.toDate.toDateString()}</p>

        <br/>

        <a href="${approveUrl}" style="padding:10px 15px;background:green;color:white;text-decoration:none;">
          Approve
        </a>
        &nbsp;
        <a href="${rejectUrl}" style="padding:10px 15px;background:red;color:white;text-decoration:none;">
          Reject
        </a>
      `,
    });
  }

  // =====================================================
  // EMPLOYER → EMPLOYEE (DECISION)
  // =====================================================
  async sendLeaveDecisionToEmployee(payload: {
    employeeEmail: string;
    employeeName: string;
    type: string;
    fromDate: Date;
    toDate: Date;
    status: 'APPROVED' | 'REJECTED';
  }) {
    await this.transporter.sendMail({
      from: `"Leave System" <${process.env.SMTP_USER}>`,
      to: payload.employeeEmail,
      subject: `Leave ${payload.status}`,
      html: `
        <p>Hi ${payload.employeeName},</p>
        <p>Your <b>${payload.type}</b> leave from 
        <b>${payload.fromDate.toDateString()}</b> to 
        <b>${payload.toDate.toDateString()}</b> has been 
        <b>${payload.status}</b>.</p>

        <p>Regards,<br/>HR Team</p>
      `,
    });
  }
}