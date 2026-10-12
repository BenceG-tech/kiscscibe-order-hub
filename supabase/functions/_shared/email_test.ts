import { assert, assertEquals, assertFalse } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EMAIL_FROM, EMAIL_REPLY_TO, SITE_URL, interpretResendResult, sendEmail } from "./email.ts";

const FUNCS = [
  "submit-order", "send-contact-email", "send-order-status-email", "send-welcome-newsletter",
  "send-weekly-menu", "send-daily-report", "send-monthly-report", "send-rating-request",
];
const read = (f: string) => Deno.readTextFileSync(new URL(`../${f}/index.ts`, import.meta.url));

Deno.test("sender uses canonical non-hyphenated domain", () => {
  assertEquals(EMAIL_FROM, "KisCsibe Étterem <rendeles@kiscsibeetterem.hu>");
  assertEquals(EMAIL_REPLY_TO, "info@kiscsibeetterem.hu");
  assertEquals(SITE_URL, "https://kiscsibeetterem.hu");
});

Deno.test("no function references the obsolete domain or hardcodes a from address", () => {
  for (const f of FUNCS) {
    const src = read(f);
    assertFalse(src.includes("kiscsibe-etterem.hu"), `${f} still has hyphenated domain`);
    assertFalse(src.includes("kiscscibe-order-hub"), `${f} still links lovable.app`);
    assertFalse(/resend\.emails\.send\(/.test(src), `${f} bypasses shared sendEmail`);
    assert(src.includes("sendEmail("), `${f} must use sendEmail`);
  }
});

Deno.test("resolved provider error (403 domain not verified) is a failure", () => {
  const r = interpretResendResult({ data: null, error: { statusCode: 403, name: "validation_error", message: "The kiscsibeetterem.hu domain is not verified." } });
  assertFalse(r.ok);
  if (!r.ok) assert(r.error.includes("not verified"));
});

Deno.test("missing/empty id is a failure, real id is success", () => {
  assertFalse(interpretResendResult({ data: null, error: null }).ok);
  assertFalse(interpretResendResult({ data: { id: "" }, error: null }).ok);
  assertFalse(interpretResendResult(undefined).ok);
  assertEquals(interpretResendResult({ data: { id: "abc" }, error: null }), { ok: true, id: "abc" });
});

Deno.test("sendEmail never throws and applies canonical from/reply_to", async () => {
  let payload: Record<string, unknown> = {};
  const ok = await sendEmail({ emails: { send: (p) => { payload = p; return Promise.resolve({ data: { id: "m1" }, error: null }); } } }, { to: ["a@b.hu"], subject: "s", html: "h" });
  assert(ok.ok);
  assertEquals(payload.from, EMAIL_FROM);
  assertEquals(payload.reply_to, EMAIL_REPLY_TO);
  const thrown = await sendEmail({ emails: { send: () => Promise.reject(new Error("network")) } }, { to: ["a@b.hu"], subject: "s", html: "h" });
  assertFalse(thrown.ok);
  const rejected = await sendEmail({ emails: { send: () => Promise.resolve({ data: null, error: { statusCode: 403, message: "domain not verified" } }) } }, { to: ["a@b.hu"], subject: "s", html: "h" });
  assertFalse(rejected.ok);
});

Deno.test("submit-order persists order before email and email failure cannot fail the response", () => {
  const src = read("submit-order");
  const insertIdx = src.indexOf(".from('orders')");
  const emailIdx = src.indexOf("const sendAdminEmails");
  assert(insertIdx > 0 && emailIdx > insertIdx, "order insert must precede email sending");
  assert(src.includes("Promise.allSettled([sendAdminEmails(), sendCustomerEmail()])"));
  const tail = src.slice(emailIdx);
  assert(/if \(!out\.ok\) throw new Error\(out\.error\);[\s\S]*?catch \(err\)[\s\S]*?'failed'/.test(tail), "rejections logged as failed, caught locally");
});

Deno.test("status and rating emails are idempotent on prior accepted send", () => {
  for (const f of ["send-order-status-email", "send-rating-request"]) {
    const src = read(f);
    assert(src.includes('.eq("status", "sent")') && src.includes("already_sent: true"), f);
  }
});

Deno.test("weekly/daily/monthly/contact/welcome check provider outcome", () => {
  assert(read("send-weekly-menu").includes("campaignOutcome(bulk)"));
  assert(read("send-daily-report").includes("if (!sendOut.ok) throw"));
  assert(read("send-monthly-report").includes("if (!sendOut.ok) throw"));
  assert(read("send-contact-email").includes("if (!adminSend.ok)"));
  assert(read("send-welcome-newsletter").includes("if (!sendResult.ok)"));
});

import { campaignOutcome, lazyResend, sendToMany } from "./email.ts";

Deno.test("lazy client: missing key and throwing constructor become failed sends, never throw", async () => {
  const noKey = lazyResend(() => { throw new Error("unreachable"); }, () => undefined);
  const a = await sendEmail(noKey, { to: ["x@y.hu"], subject: "s", html: "h" });
  assertFalse(a.ok);
  if (!a.ok) assert(a.error.includes("RESEND_API_KEY"));
  const boom = lazyResend(() => { throw new Error("ctor exploded"); }, () => "k");
  const b = await sendEmail(boom, { to: ["x@y.hu"], subject: "s", html: "h" });
  assertFalse(b.ok);
  let made = 0;
  const ok = lazyResend(() => { made++; return { emails: { send: () => Promise.resolve({ data: { id: "z" }, error: null }) } }; }, () => "k");
  assert((await sendEmail(ok, { to: ["x@y.hu"], subject: "s", html: "h" })).ok);
  await sendEmail(ok, { to: ["x@y.hu"], subject: "s", html: "h" });
  assertEquals(made, 1);
});

Deno.test("simulated order flow: saved order survives email config/provider failure", async () => {
  const db: string[] = [];
  const log: string[] = [];
  db.push("order-1"); // persisted before emails
  const resend = lazyResend(() => { throw new Error("ctor"); }, () => undefined);
  const results = await Promise.allSettled(["info", "owner"].map(async (r) => {
    const out = await sendEmail(resend, { to: [r], subject: "s", html: "h" });
    log.push(out.ok ? "sent" : "failed");
  }));
  assert(results.every((r) => r.status === "fulfilled"));
  assertEquals(db, ["order-1"]);
  assertEquals(log, ["failed", "failed"]);
});

Deno.test("weekly campaign: all-fail, partial and resolved-error counting", async () => {
  const mk = (rejectSet: Set<string>) => ({ emails: { send: (p: Record<string, unknown>) => {
    const to = (p.to as string[])[0];
    return Promise.resolve(rejectSet.has(to)
      ? { data: null, error: { statusCode: 403, message: "domain not verified" } }
      : { data: { id: `id-${to}` }, error: null });
  } } });
  const subs = ["a@x.hu", "b@x.hu", "c@x.hu"];
  const all = await sendToMany(mk(new Set(subs)), subs, { subject: "s", html: "h" });
  assertEquals([all.sent, all.failed], [0, 3]);
  assertEquals(campaignOutcome(all), { success: false, partial: false, status: 502 });
  assertFalse(all.errors.join().includes("a@x.hu"), "errors must mask addresses");
  const part = await sendToMany(mk(new Set(["b@x.hu"])), subs, { subject: "s", html: "h" });
  assertEquals([part.sent, part.failed], [2, 1]);
  assertEquals(campaignOutcome(part), { success: true, partial: true, status: 200 });
  const thrown = await sendToMany({ emails: { send: () => Promise.reject(new Error("net")) } }, subs, { subject: "s", html: "h" });
  assertEquals(thrown.sent, 0);
});
