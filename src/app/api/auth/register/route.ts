import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();
    if (!email || !username || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if user exists
    const usersRef = db.collection('users');
    const usernameQuery = await usersRef.where('username', '==', username).get();
    const emailQuery = await usersRef.where('email', '==', email).get();

    if (!usernameQuery.empty) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    if (!emailQuery.empty) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP (For realism, we would email this, but we'll return it for testing)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in temporary otps collection
    await db.collection('otps').doc(email).set({
      otp,
      username,
      password: hashedPassword,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    });

    // In a real app you'd email it. We'll just print it.
    console.log(`================================`);
    console.log(`[Ryoiki Auth] OTP for ${email}: ${otp}`);
    console.log(`================================`);

    // Send the email using Nodemailer
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Ryoiki Network" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: 'Your Ryoiki Network Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background-color: #0d0d0d; color: #fff; border-radius: 12px; border: 1px solid #333;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #fff; margin: 0; font-size: 24px; background: linear-gradient(90deg, #fff, #888); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ryoiki Network</h1>
            </div>
            <p style="color: #ccc; font-size: 16px;">Hello <b>${username}</b>,</p>
            <p style="color: #ccc; font-size: 16px;">Welcome to Ryoiki Network! Use the verification code below to complete your registration.</p>
            <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 1px solid #333;">
              <h2 style="margin: 0; color: #fff; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
            </div>
            <p style="color: #888; font-size: 14px; text-align: center;">This code will expire in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px; text-align: center;">If you didn't request this code, you can safely ignore this email.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } else {
      console.warn("SMTP_EMAIL or SMTP_PASSWORD not set. Email not sent.");
    }

    return NextResponse.json({ message: 'OTP sent to email. Please verify.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
