import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let geminiKey = process.env.GEMINI_API_KEY || '';
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const gMatch = content.match(/GEMINI_API_KEY=(.+)/);
      if (gMatch) geminiKey = gMatch[1].trim();

      const uMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
      if (uMatch) supabaseUrl = uMatch[1].trim();

      const aMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
      if (aMatch) supabaseAnonKey = aMatch[1].trim();
    }

    return NextResponse.json({
      geminiKey,
      supabaseUrl,
      supabaseAnonKey,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { geminiKey, supabaseUrl, supabaseAnonKey } = await req.json();

    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = `# Google Gemini API Key
GEMINI_API_KEY=${geminiKey || ''}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl || ''}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey || ''}
`;

    fs.writeFileSync(envPath, envContent, 'utf-8');

    // Update in-memory process.env
    process.env.GEMINI_API_KEY = geminiKey || '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl || '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey || '';

    return NextResponse.json({ success: true, message: 'บันทึกการตั้งค่าลงใน .env.local สำเร็จ' });
  } catch (error: any) {
    console.error('Save settings error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า' }, { status: 500 });
  }
}
