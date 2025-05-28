import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '@/lib/mocKData';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstname, lastname } = await request.json();

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json({ error: 'تمام فیلدها الزامی هستند' }, { status: 400 });
    }

    // چک کردن وجود کاربر در mock data
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'کاربر با این ایمیل قبلاً ثبت نام کرده' }, { status: 409 });
    }

    // ایجاد کاربر جدید در mock data
    const newUser = createUser({ email, password, firstname, lastname });

    // تولید خودکار توکن
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: `${newUser.firstname} ${newUser.lastname}`,
        role: 'user'
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'ثبت نام با موفقیت انجام شد',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: `${newUser.firstname} ${newUser.lastname}`,
        role: 'user'
      }
    });

  } catch  {
    return NextResponse.json({ error: 'خطا در ثبت نام' }, { status: 500 });
  }
}