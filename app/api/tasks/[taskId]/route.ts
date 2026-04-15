// app/api/tasks/[taskId]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Next.js 15+: params is now a Promise and must be awaited
interface Params { 
  params: Promise<{ taskId: string }>
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Await params before accessing properties (Next.js 15+ requirement)
    const { taskId: taskIdStr } = await params;
    const taskId = Number(taskIdStr);
    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await req.json() as { done?: boolean; text?: string; due_date?: string };
    
    const patch: Record<string, any> = {};
    if (typeof body.done === 'boolean') patch.done = body.done;
    if (typeof body.text === 'string') patch.text = body.text;
    if (typeof body.due_date === 'string' || body.due_date === null) {
      patch.due_date = body.due_date;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase PATCH error:", error);
      return NextResponse.json({ 
        error: error.message, 
        details: error.details,
        code: error.code 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PATCH /api/tasks/[taskId] crashed:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Await params before accessing properties (Next.js 15+ requirement)
    const { taskId: taskIdStr } = await params;
    const taskId = Number(taskIdStr);
    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[taskId] crashed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}