import { createClient } from "npm:@supabase/supabase-js@^2.22.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

Deno.serve(async () => {
  try {
    const { error } = await supabaseClient.rpc("handle_missed_schedule");
    if (error) throw error;

    return new Response(
      JSON.stringify({
        message: "Success",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({
        message: "Error",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
});
