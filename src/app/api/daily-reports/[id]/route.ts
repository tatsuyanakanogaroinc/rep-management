import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type DailyReportUpdate = Database['public']['Tables']['daily_reports']['Update'];

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        users!daily_reports_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Daily report not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching daily report:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily report' },
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: DailyReportUpdate = await request.json();

    const { data, error } = await supabase
      .from('daily_reports')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(body as any)
      .eq('id', id)
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
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Daily report not found' },
          { status: 404 }
        );
      }
      console.error('Error updating daily report:', error);
      return NextResponse.json(
        { error: 'Failed to update daily report' },
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting daily report:', error);
      return NextResponse.json(
        { error: 'Failed to delete daily report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}