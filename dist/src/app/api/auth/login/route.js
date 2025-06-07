import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserByCredentials } from '@/lib/mocKData';
export async function POST(request) {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return NextResponse.json({ error: 'ایمیل و رمز عبور الزامی هستند' }, { status: 400 });
        }
        // پیدا کردن کاربر در mock data
        const user = findUserByCredentials(email, password);
        if (!user) {
            return NextResponse.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 });
        }
        // تولید خودکار توکن
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            name: `${user.firstname} ${user.lastname}`,
            role: 'user'
        }, process.env.NEXTAUTH_SECRET, { expiresIn: '7d' });
        return NextResponse.json({
            message: 'ورود با موفقیت انجام شد',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: `${user.firstname} ${user.lastname}`,
                role: 'user'
            }
        });
    }
    catch (_a) {
        return NextResponse.json({ error: 'خطا در ورود' }, { status: 500 });
    }
}
