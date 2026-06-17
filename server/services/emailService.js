const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load translations
const locales = {
    en: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf8')),
    ta: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/ta.json'), 'utf8')),
    hi: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/hi.json'), 'utf8')),
};

const getLocale = (lang) => locales[lang] || locales.en;

// 1. Create the transporter using your .env credentials
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Change to 'mailtrap' or another service if not using Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
});

// Reusable function to send the actual email
const sendMail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"NexaCivic Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        };
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email successfully sent to ${to}: "${subject}"`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
    }
};

// --------------------------------------------------
// 📨 Email Functions
// --------------------------------------------------

// Send Welcome Email on User Registration
const sendWelcomeEmail = async (name, email, lang = 'en') => {
    const t = getLocale(lang);
    const subject = t.welcome_subject;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">${t.welcome_title.replace('{name}', name)}</h2>
            <p>${t.welcome_p1}</p>
            <p>${t.welcome_p2}</p>
            <p>Best Regards,<br/><strong>The NexaCivic Team</strong></p>
        </div>
    `;
    await sendMail(email, subject, html);
};

// Send Email on New Complaint Submission
const sendComplaintEmail = async (email, complaintDetails, lang = 'en') => {
    const t = getLocale(lang);
    const subject = t.complaint_received_subject;
    const dateStr = new Date().toLocaleString();
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333 text-align: center;">
            <h2 style="color: #4F46E5;">${t.complaint_received_title}</h2>
            <p>${t.complaint_received_p1}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Title:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${complaintDetails.title}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${complaintDetails.location}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date/Time:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${dateStr}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border: 1px solid #ddd; color: #DC2626;">Pending</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Description:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${complaintDetails.description}</td></tr>
            </table>
            <p>${t.complaint_received_p2}</p>
            <p>Best Regards,<br/><strong>The NexaCivic Team</strong></p>
        </div>
    `;
    await sendMail(email, subject, html);
};

// Send Email when an Admin Updates Status to 'Resolved'
const sendStatusUpdateEmail = async (email, complaintDetails, lang = 'en') => {
    const t = getLocale(lang);
    const subject = t.complaint_resolved_subject;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10B981;">${t.complaint_resolved_title}</h2>
            <p>${t.complaint_resolved_p1}</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Complaint Title:</strong> ${complaintDetails.title}</p>
                <p><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Resolved</span></p>
            </div>
            <p>${t.complaint_resolved_p2}</p>
            <p>Best Regards,<br/><strong>The NexaCivic Team</strong></p>
        </div>
    `;
    await sendMail(email, subject, html);
};

// Send OTP Email for Email Verification
const sendOTPEmail = async (email, otp) => {
    const subject = "NexaCivic Email Verification";
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Email Verification Required</h2>
            <p>Your OTP for NexaCivic registration is:</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h1 style="font-size: 32px; letter-spacing: 5px; color: #4F46E5; margin: 0;">${otp}</h1>
            </div>
            <p>This OTP will expire in 5 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best Regards,<br/><strong>The NexaCivic Team</strong></p>
        </div>
    `;
    await sendMail(email, subject, html);
};

module.exports = {
    sendWelcomeEmail,
    sendComplaintEmail,
    sendStatusUpdateEmail,
    sendOTPEmail
};
