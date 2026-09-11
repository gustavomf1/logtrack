export const MOVEMENT_CHANNEL = "logtrack-movements";

export type MovementEvent = {
  loteId: string;
  zonaOrigemId: string | null;
  zonaDestinoId: string | null;
  tipo: "MOVIMENTO" | "CANCELAMENTO";
  timestamp: string;
};

export async function broadcastMovement(event: MovementEvent) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(url + "/realtime/v1/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key },
      body: JSON.stringify({ messages: [{ topic: MOVEMENT_CHANNEL, event: "movement", payload: event, private: false }] }),
    });
  } catch { /* uma falha no broadcast não deve derrubar a movimentação já confirmada */ }
}
