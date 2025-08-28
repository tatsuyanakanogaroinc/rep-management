import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type DailyReport = Database['public']['Tables']['daily_reports']['Row'];
type DailyReportInsert = Database['public']['Tables']['daily_reports']['Insert'];

export async function GET(request: NextRequest) {
  try {
    // Runtime check for environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') || '50';

    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        users!daily_reports_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('date', { ascending: false })
      .limit(parseInt(limit));

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily reports' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Runtime check for environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body: DailyReportInsert = await request.json();

    // Validate required fields
    if (!body.user_id || !body.date) {
      return NextResponse.json(
        { error: 'user_id and date are required' },
        { status: 400 }
      );
    }

    // Check if report for this user and date already exists
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('user_id', body.user_id)
      .eq('date', body.date)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { error: 'Daily report for this date already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('daily_reports')
      .insert(body)
      .select(`
        *,
        users!daily_reports_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error creating daily report:', error);
      return NextResponse.json(
        { error: 'Failed to create daily report' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}