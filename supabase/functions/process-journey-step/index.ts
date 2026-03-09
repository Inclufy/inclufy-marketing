import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types ──────────────────────────────────────────────────────────────

interface JourneyNode {
  id: string;
  type: "trigger" | "action" | "decision" | "goal";
  data?: {
    actionType?: "wait" | "email" | string;
    waitDuration?: number;
    waitUnit?: "minutes" | "hours" | "days";
    condition?: string;
    [key: string]: unknown;
  };
}

interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

interface PathEntry {
  node_id: string;
  entered_at: string;
  exited_at: string | null;
}

interface Enrollment {
  id: string;
  journey_id: string;
  contact_id: string;
  status: string;
  current_node_id: string | null;
  current_node_entered_at: string | null;
  path: PathEntry[];
  context_data: Record<string, unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────────

function waitDurationMs(node: JourneyNode): number {
  const dur = node.data?.waitDuration ?? 0;
  const unit = node.data?.waitUnit ?? "minutes";
  const multipliers: Record<string, number> = {
    minutes: 60_000,
    hours: 3_600_000,
    days: 86_400_000,
  };
  return dur * (multipliers[unit] ?? 60_000);
}

function findOutgoingEdges(edges: JourneyEdge[], sourceId: string): JourneyEdge[] {
  return edges.filter((e) => e.source === sourceId);
}

function findNode(nodes: JourneyNode[], nodeId: string): JourneyNode | undefined {
  return nodes.find((n) => n.id === nodeId);
}

// ── Core step processing ───────────────────────────────────────────────

async function processStep(
  supabase: ReturnType<typeof createClient>,
  enrollment: Enrollment,
  nodes: JourneyNode[],
  edges: JourneyEdge[],
): Promise<Enrollment> {
  if (!enrollment.current_node_id) {
    console.log(`Enrollment ${enrollment.id}: no current_node_id, nothing to process`);
    return enrollment;
  }

  const currentNode = findNode(nodes, enrollment.current_node_id);
  if (!currentNode) {
    console.warn(
      `Enrollment ${enrollment.id}: node '${enrollment.current_node_id}' not found`,
    );
    return enrollment;
  }

  let nextNodeId: string | null = null;

  switch (currentNode.type) {
    case "trigger": {
      const outgoing = findOutgoingEdges(edges, currentNode.id);
      if (outgoing.length > 0) {
        nextNodeId = outgoing[0].target;
      }
      break;
    }

    case "action": {
      const actionType = currentNode.data?.actionType;

      if (actionType === "wait") {
        const enteredAt = enrollment.current_node_entered_at
          ? new Date(enrollment.current_node_entered_at).getTime()
          : 0;
        const now = Date.now();
        const durationMs = waitDurationMs(currentNode);

        if (now - enteredAt < durationMs) {
          console.log(
            `Enrollment ${enrollment.id}: still waiting (${Math.round((durationMs - (now - enteredAt)) / 1000)}s remaining)`,
          );
          return enrollment; // not ready yet
        }

        const outgoing = findOutgoingEdges(edges, currentNode.id);
        if (outgoing.length > 0) {
          nextNodeId = outgoing[0].target;
        }
      } else if (actionType === "email") {
        // Attempt to call send-email Edge Function
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const emailPayload = {
            enrollment_id: enrollment.id,
            contact_id: enrollment.contact_id,
            journey_id: enrollment.journey_id,
            node_data: currentNode.data,
          };
          console.log(
            `Enrollment ${enrollment.id}: sending email`,
            JSON.stringify(emailPayload),
          );

          try {
            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify(emailPayload),
            });
          } catch (emailErr) {
            console.warn("send-email call failed (non-blocking):", emailErr);
          }
        } catch (err) {
          console.warn("Email action error (non-blocking):", err);
        }

        const outgoing = findOutgoingEdges(edges, currentNode.id);
        if (outgoing.length > 0) {
          nextNodeId = outgoing[0].target;
        }
      } else {
        // Unknown action -- advance
        const outgoing = findOutgoingEdges(edges, currentNode.id);
        if (outgoing.length > 0) {
          nextNodeId = outgoing[0].target;
        }
      }
      break;
    }

    case "decision": {
      const condition = currentNode.data?.condition ?? "";
      let result = false;

      if (condition && enrollment.context_data) {
        const val = enrollment.context_data[condition];
        result = Boolean(val);
      }

      const outgoing = findOutgoingEdges(edges, currentNode.id);
      const yesEdge = outgoing.find((e) => e.sourceHandle === "yes");
      const noEdge = outgoing.find((e) => e.sourceHandle === "no");

      if (result && yesEdge) {
        nextNodeId = yesEdge.target;
      } else if (!result && noEdge) {
        nextNodeId = noEdge.target;
      } else if (outgoing.length > 0) {
        nextNodeId = outgoing[0].target;
      }
      break;
    }

    case "goal": {
      const now = new Date().toISOString();
      const updatedPath = [...(enrollment.path ?? [])];
      const lastEntry = updatedPath[updatedPath.length - 1];
      if (lastEntry && !lastEntry.exited_at) {
        lastEntry.exited_at = now;
      }

      const { data: updated, error } = await supabase
        .from("journey_enrollments")
        .update({
          status: "goal_reached",
          completed_at: now,
          path: updatedPath,
        })
        .eq("id", enrollment.id)
        .select()
        .single();

      if (error) {
        console.error(`Enrollment ${enrollment.id}: goal_reached update failed`, error);
        return enrollment;
      }

      return updated as Enrollment;
    }
  }

  // ── Advance to next node ─────────────────────────────────────────────
  if (nextNodeId) {
    const now = new Date().toISOString();
    const updatedPath = [...(enrollment.path ?? [])];

    const lastEntry = updatedPath[updatedPath.length - 1];
    if (lastEntry && !lastEntry.exited_at) {
      lastEntry.exited_at = now;
    }

    updatedPath.push({
      node_id: nextNodeId,
      entered_at: now,
      exited_at: null,
    });

    const { data: updated, error } = await supabase
      .from("journey_enrollments")
      .update({
        current_node_id: nextNodeId,
        current_node_entered_at: now,
        path: updatedPath,
      })
      .eq("id", enrollment.id)
      .select()
      .single();

    if (error) {
      console.error(`Enrollment ${enrollment.id}: advance failed`, error);
      return enrollment;
    }

    return updated as Enrollment;
  }

  // No next node -- journey is complete
  const now = new Date().toISOString();
  const updatedPath = [...(enrollment.path ?? [])];
  const lastEntry = updatedPath[updatedPath.length - 1];
  if (lastEntry && !lastEntry.exited_at) {
    lastEntry.exited_at = now;
  }

  const { data: updated, error } = await supabase
    .from("journey_enrollments")
    .update({
      status: "completed",
      completed_at: now,
      path: updatedPath,
    })
    .eq("id", enrollment.id)
    .select()
    .single();

  if (error) {
    console.error(`Enrollment ${enrollment.id}: completion failed`, error);
    return enrollment;
  }

  return updated as Enrollment;
}

// ── Serve ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { enrollment_id, journey_id } = await req.json();

    if (!enrollment_id || !journey_id) {
      return new Response(
        JSON.stringify({ error: "enrollment_id and journey_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the journey
    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id, nodes, edges, status")
      .eq("id", journey_id)
      .single();

    if (journeyError || !journey) {
      return new Response(
        JSON.stringify({ error: "Journey not found", details: journeyError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch the enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from("journey_enrollments")
      .select("*")
      .eq("id", enrollment_id)
      .eq("journey_id", journey_id)
      .single();

    if (enrollError || !enrollment) {
      return new Response(
        JSON.stringify({ error: "Enrollment not found", details: enrollError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (enrollment.status !== "active") {
      return new Response(
        JSON.stringify({
          error: `Enrollment status is '${enrollment.status}', only 'active' enrollments can be processed`,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Process the single step
    const updatedEnrollment = await processStep(
      supabase,
      enrollment as Enrollment,
      journey.nodes as JourneyNode[],
      journey.edges as JourneyEdge[],
    );

    return new Response(JSON.stringify(updatedEnrollment), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("process-journey-step error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
