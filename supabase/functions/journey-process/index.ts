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
    waitDuration?: number; // milliseconds
    waitUnit?: "minutes" | "hours" | "days";
    condition?: string; // simple expression for decision nodes
    [key: string]: unknown;
  };
}

interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // "yes" | "no" for decision nodes
}

interface Journey {
  id: string;
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  status: string;
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

/** Convert a wait duration + unit to milliseconds */
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

/** Find the next node(s) connected from a given source node */
function findOutgoingEdges(edges: JourneyEdge[], sourceId: string): JourneyEdge[] {
  return edges.filter((e) => e.source === sourceId);
}

/** Find a specific node by id */
function findNode(nodes: JourneyNode[], nodeId: string): JourneyNode | undefined {
  return nodes.find((n) => n.id === nodeId);
}

// ── Core processing ────────────────────────────────────────────────────

async function processEnrollment(
  supabase: ReturnType<typeof createClient>,
  enrollment: Enrollment,
  journey: Journey,
): Promise<boolean> {
  const { nodes, edges } = journey;

  if (!enrollment.current_node_id) {
    console.log(`Enrollment ${enrollment.id}: no current_node_id, skipping`);
    return false;
  }

  const currentNode = findNode(nodes, enrollment.current_node_id);
  if (!currentNode) {
    console.warn(
      `Enrollment ${enrollment.id}: current_node_id '${enrollment.current_node_id}' not found in journey nodes`,
    );
    return false;
  }

  let nextNodeId: string | null = null;

  switch (currentNode.type) {
    // ── Trigger: simply move to the next connected node
    case "trigger": {
      const outgoing = findOutgoingEdges(edges, currentNode.id);
      if (outgoing.length > 0) {
        nextNodeId = outgoing[0].target;
      }
      break;
    }

    // ── Action: depends on actionType
    case "action": {
      const actionType = currentNode.data?.actionType;

      if (actionType === "wait") {
        // Check if the wait duration has elapsed
        const enteredAt = enrollment.current_node_entered_at
          ? new Date(enrollment.current_node_entered_at).getTime()
          : 0;
        const now = Date.now();
        const durationMs = waitDurationMs(currentNode);

        if (now - enteredAt < durationMs) {
          // Wait has not elapsed yet
          console.log(
            `Enrollment ${enrollment.id}: waiting (${Math.round((durationMs - (now - enteredAt)) / 1000)}s remaining)`,
          );
          return false;
        }

        // Wait elapsed -- move forward
        const outgoing = findOutgoingEdges(edges, currentNode.id);
        if (outgoing.length > 0) {
          nextNodeId = outgoing[0].target;
        }
      } else if (actionType === "email") {
        // Attempt to invoke the send-email Edge Function, or log it
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
            `Enrollment ${enrollment.id}: sending email action`,
            JSON.stringify(emailPayload),
          );

          // Fire-and-forget call to send-email function (best effort)
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

        // Move forward regardless
        const outgoing = findOutgoingEdges(edges, currentNode.id);
        if (outgoing.length > 0) {
          nextNodeId = outgoing[0].target;
        }
      } else {
        // Unknown action type -- move forward by default
        console.log(
          `Enrollment ${enrollment.id}: unknown actionType '${actionType}', advancing`,
        );
        const outgoing = findOutgoingEdges(edges, currentNode.id);
        if (outgoing.length > 0) {
          nextNodeId = outgoing[0].target;
        }
      }
      break;
    }

    // ── Decision: evaluate condition, follow yes or no edge
    case "decision": {
      // Simple evaluation: treat condition as a truthy/falsy value from context_data
      // e.g. condition = "opened_email" checks enrollment.context_data.opened_email
      const condition = currentNode.data?.condition ?? "";
      let result = false;

      if (condition && enrollment.context_data) {
        const val = enrollment.context_data[condition];
        result = Boolean(val);
      }

      const outgoing = findOutgoingEdges(edges, currentNode.id);
      // Find edges with sourceHandle "yes" / "no"
      const yesEdge = outgoing.find((e) => e.sourceHandle === "yes");
      const noEdge = outgoing.find((e) => e.sourceHandle === "no");

      if (result && yesEdge) {
        nextNodeId = yesEdge.target;
      } else if (!result && noEdge) {
        nextNodeId = noEdge.target;
      } else if (outgoing.length > 0) {
        // Fallback: take first outgoing edge
        nextNodeId = outgoing[0].target;
      }

      console.log(
        `Enrollment ${enrollment.id}: decision '${condition}' => ${result}, next: ${nextNodeId}`,
      );
      break;
    }

    // ── Goal: mark enrollment as goal_reached
    case "goal": {
      const now = new Date().toISOString();
      const updatedPath = [...(enrollment.path ?? [])];
      // Close the current path entry
      const lastEntry = updatedPath[updatedPath.length - 1];
      if (lastEntry && !lastEntry.exited_at) {
        lastEntry.exited_at = now;
      }

      const { error } = await supabase
        .from("journey_enrollments")
        .update({
          status: "goal_reached",
          completed_at: now,
          path: updatedPath,
        })
        .eq("id", enrollment.id);

      if (error) {
        console.error(`Enrollment ${enrollment.id}: failed to mark goal_reached`, error);
      } else {
        console.log(`Enrollment ${enrollment.id}: goal_reached`);
      }
      return true;
    }
  }

  // ── Move to the next node ──────────────────────────────────────────
  if (nextNodeId) {
    const now = new Date().toISOString();
    const updatedPath = [...(enrollment.path ?? [])];

    // Close the current path entry
    const lastEntry = updatedPath[updatedPath.length - 1];
    if (lastEntry && !lastEntry.exited_at) {
      lastEntry.exited_at = now;
    }

    // Add new path entry
    updatedPath.push({
      node_id: nextNodeId,
      entered_at: now,
      exited_at: null,
    });

    const { error } = await supabase
      .from("journey_enrollments")
      .update({
        current_node_id: nextNodeId,
        current_node_entered_at: now,
        path: updatedPath,
      })
      .eq("id", enrollment.id);

    if (error) {
      console.error(`Enrollment ${enrollment.id}: failed to advance to ${nextNodeId}`, error);
      return false;
    }

    console.log(`Enrollment ${enrollment.id}: advanced to node ${nextNodeId}`);
    return true;
  }

  // No next node -- the enrollment has reached the end of the journey
  const now = new Date().toISOString();
  const updatedPath = [...(enrollment.path ?? [])];
  const lastEntry = updatedPath[updatedPath.length - 1];
  if (lastEntry && !lastEntry.exited_at) {
    lastEntry.exited_at = now;
  }

  const { error } = await supabase
    .from("journey_enrollments")
    .update({
      status: "completed",
      completed_at: now,
      path: updatedPath,
    })
    .eq("id", enrollment.id);

  if (error) {
    console.error(`Enrollment ${enrollment.id}: failed to mark completed`, error);
  } else {
    console.log(`Enrollment ${enrollment.id}: completed (no more nodes)`);
  }
  return true;
}

// ── Serve ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all active journeys
    const { data: activeJourneys, error: journeysError } = await supabase
      .from("journeys")
      .select("id, nodes, edges, status")
      .eq("status", "active");

    if (journeysError) {
      console.error("Failed to fetch journeys:", journeysError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch active journeys", details: journeysError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!activeJourneys || activeJourneys.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No active journeys found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let totalProcessed = 0;

    // 2. For each active journey, get active enrollments and process them
    for (const journey of activeJourneys as Journey[]) {
      const { data: enrollments, error: enrollError } = await supabase
        .from("journey_enrollments")
        .select("*")
        .eq("journey_id", journey.id)
        .eq("status", "active");

      if (enrollError) {
        console.error(`Failed to fetch enrollments for journey ${journey.id}:`, enrollError);
        continue;
      }

      if (!enrollments || enrollments.length === 0) {
        continue;
      }

      for (const enrollment of enrollments as Enrollment[]) {
        try {
          const advanced = await processEnrollment(supabase, enrollment, journey);
          if (advanced) {
            totalProcessed++;
          }
        } catch (err) {
          console.error(`Error processing enrollment ${enrollment.id}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({ processed: totalProcessed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("journey-process error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
