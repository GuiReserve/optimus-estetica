// Optimus — gestão de acessos (somente administradores).
// Ações: bootstrap (cria o primeiro admin, só funciona enquanto não existe nenhum),
//        create (cria o acesso de um studio com senha provisória),
//        reset (gera nova senha provisória para um studio).
// Não existe ação de exclusão: contas são apenas bloqueadas.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function tempPassword(): string {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = letters + digits;
  const buf = new Uint32Array(10);
  crypto.getRandomValues(buf);
  const chars = Array.from(buf, (n) => all[n % all.length]);
  chars[0] = letters[buf[0] % letters.length];
  chars[9] = digits[buf[9] % digits.length];
  return chars.join("");
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Requisição inválida" }, 400); }
  const action = body.action;

  if (action === "bootstrap") {
    const { count } = await admin.from("admins").select("user_id", { count: "exact", head: true });
    if ((count ?? 0) > 0) return json({ error: "Administrador já configurado" }, 403);
    const email = str(body.email, 254).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!emailOk(email)) return json({ error: "E-mail inválido" }, 400);
    if (password.length < 8) return json({ error: "A senha precisa ter pelo menos 8 caracteres" }, 400);
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return json({ error: "Não foi possível criar o administrador: " + (error?.message ?? "") }, 400);
    const { error: e2 } = await admin.from("admins").insert({ user_id: data.user.id });
    if (e2) return json({ error: "Falha ao registrar administrador" }, 500);
    return json({ ok: true });
  }

  // Demais ações exigem um administrador logado.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Não autenticado" }, 401);
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who.user) return json({ error: "Sessão inválida" }, 401);
  const { data: isAdm } = await admin.from("admins").select("user_id").eq("user_id", who.user.id).maybeSingle();
  if (!isAdm) return json({ error: "Acesso restrito ao administrador" }, 403);

  if (action === "create") {
    const email = str(body.email, 254).toLowerCase();
    const studio_name = str(body.studio_name, 120);
    if (!studio_name) return json({ error: "Informe o nome do studio" }, 400);
    if (!emailOk(email)) return json({ error: "E-mail inválido" }, 400);
    const fee = Number(body.monthly_fee);
    const paid_until = typeof body.paid_until === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.paid_until) ? body.paid_until : null;
    const password = tempPassword();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) {
      const msg = /already|registered|exists/i.test(error?.message ?? "") ? "Já existe um acesso com este e-mail" : "Não foi possível criar o acesso";
      return json({ error: msg }, 400);
    }
    const { data: acc, error: e2 } = await admin.from("accounts").insert({
      user_id: data.user.id, email, studio_name,
      owner_name: str(body.owner_name, 120) || null,
      phone: str(body.phone, 30) || null,
      plan: str(body.plan, 60) || "Mensal",
      monthly_fee: Number.isFinite(fee) && fee >= 0 ? fee : 0,
      paid_until, notes: str(body.notes, 2000) || null,
      status: "ativo", must_change_password: true,
    }).select().single();
    if (e2 || !acc) return json({ error: "Acesso criado no login, mas falhou ao salvar a conta: " + (e2?.message ?? "") }, 500);
    await admin.from("studio_data").insert({ account_id: acc.id, data: {}, version: 0 });
    return json({ account: acc, temp_password: password });
  }

  if (action === "reset") {
    const id = str(body.account_id, 64);
    const { data: acc } = await admin.from("accounts").select("id, user_id, email").eq("id", id).maybeSingle();
    if (!acc || !acc.user_id) return json({ error: "Conta não encontrada" }, 404);
    const password = tempPassword();
    const { error } = await admin.auth.admin.updateUserById(acc.user_id, { password });
    if (error) return json({ error: "Não foi possível gerar nova senha" }, 500);
    await admin.from("accounts").update({ must_change_password: true, updated_at: new Date().toISOString() }).eq("id", acc.id);
    return json({ ok: true, email: acc.email, temp_password: password });
  }

  return json({ error: "Ação desconhecida" }, 400);
});
