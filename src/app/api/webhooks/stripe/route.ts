import { NextResponse, after } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendInvoicePaidEmail, sendOrderReceiptEmail, sendRefundEmail, sendSubscriptionReceiptEmail, sendSubscriptionWelcomeEmail } from "@/lib/transactional-email";
import { generateLicenseKey } from "@/lib/licenses";
import { getPlan } from "@/lib/plans";
import { formatMoney, notifyTelegram } from "@/lib/telegram";
export const runtime = "nodejs";

type Tx = Prisma.TransactionClient;

// Stripe moved current_period_end onto subscription items in newer API
// versions; read whichever shape the SDK returns.
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const raw = (sub as unknown as { current_period_end?: number }).current_period_end
    ?? sub.items?.data?.[0]?.current_period_end;
  return typeof raw === "number" ? new Date(raw * 1000) : null;
}

async function settleInvoice(tx: Tx, session: Stripe.Checkout.Session): Promise<string | null> {
  const id = session.metadata?.invoiceId;
  if (!id || session.payment_status !== "paid") return null;
  const inv = await tx.invoice.findUnique({ where: { id }, select: { id: true, status: true, stripeCheckoutSession: true, totalCents: true, currency: true } });
  if (!inv) throw new Error(`Invoice ${id} not found for Stripe session ${session.id}.`);
  if (!["SENT", "OVERDUE"].includes(inv.status)) {
    // Money arrived for an invoice that is not payable (voided, or already
    // marked paid by hand). Never swallow it: flag it for refund so the
    // owner sees the overpayment instead of it vanishing.
    const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
    await tx.auditLog.create({
      data: {
        action: "INVOICE_PAID_WHILE_NOT_PAYABLE",
        target: id,
        metadata: {
          checkoutSessionId: session.id,
          paymentIntentId: pi,
          amountTotal: session.amount_total,
          currency: session.currency,
          invoiceStatus: inv.status,
        },
      },
    });
    return null;
  }
  // A mismatch is a permanent condition, not a transient failure: the money
  // was collected by Stripe, but it does not match the local record, so the
  // owner must reconcile it by hand. Throwing here would make Stripe retry
  // the webhook forever. Record it and return 200 instead.
  if (inv.stripeCheckoutSession !== session.id) {
    await tx.auditLog.create({ data: { action: "INVOICE_SESSION_MISMATCH", target: id, metadata: { checkoutSessionId: session.id, expectedSessionId: inv.stripeCheckoutSession, amountTotal: session.amount_total, currency: session.currency } } });
    return null;
  }
  if (session.amount_total !== inv.totalCents + (session.total_details?.amount_tax ?? 0) || (session.currency || "").toLowerCase() !== inv.currency.toLowerCase()) {
    await tx.auditLog.create({ data: { action: "INVOICE_AMOUNT_MISMATCH", target: id, metadata: { checkoutSessionId: session.id, paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null, amountTotal: session.amount_total, currency: session.currency, expectedTotalCents: inv.totalCents, expectedCurrency: inv.currency } } });
    return null;
  }
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const amountTax = session.total_details?.amount_tax ?? 0;
  const changed = await tx.invoice.updateMany({
    where: { id, status: { in: ["SENT", "OVERDUE"] }, stripeCheckoutSession: session.id, totalCents: inv.totalCents, currency: inv.currency },
    data: { status: "PAID", paidAt: new Date(), stripePaymentIntent: pi, ...(amountTax > 0 ? { taxCents: amountTax } : {}) },
  });
  if (changed.count) await tx.auditLog.create({ data: { action: "INVOICE_PAID_BY_STRIPE", target: id, metadata: { checkoutSessionId: session.id, paymentIntentId: pi, amountTotal: session.amount_total, currency: session.currency } } });
  return changed.count ? id : null;
}

async function settleOrder(tx: Tx, session: Stripe.Checkout.Session): Promise<string | null> {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return null;
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, stripeCheckoutSession: true, totalCents: true, currency: true } });
  if (!order) {
    await tx.auditLog.create({ data: { action: "ORDER_NOT_FOUND_FOR_STRIPE_SESSION", target: orderId, metadata: { checkoutSessionId: session.id, amountTotal: session.amount_total, currency: session.currency } } });
    return null;
  }
  if (order.status !== "PENDING") return null;
  if (order.stripeCheckoutSession !== session.id) {
    await tx.auditLog.create({ data: { action: "ORDER_SESSION_MISMATCH", target: orderId, metadata: { checkoutSessionId: session.id, expectedSessionId: order.stripeCheckoutSession, amountTotal: session.amount_total, currency: session.currency } } });
    return null;
  }
  if (session.amount_total !== order.totalCents + (session.total_details?.amount_tax ?? 0) || (session.currency || "").toLowerCase() !== order.currency.toLowerCase()) {
    await tx.auditLog.create({ data: { action: "ORDER_AMOUNT_MISMATCH", target: orderId, metadata: { checkoutSessionId: session.id, paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null, amountTotal: session.amount_total, currency: session.currency, expectedTotalCents: order.totalCents, expectedCurrency: order.currency } } });
    return null;
  }
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const amountTax = session.total_details?.amount_tax ?? 0;
  const changed = await tx.order.updateMany({
    where: { id: orderId, stripeCheckoutSession: session.id, status: "PENDING", totalCents: order.totalCents, currency: order.currency },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntent: pi,
      ...(amountTax > 0 ? { taxCents: amountTax } : {}),
    },
  });
  if (changed.count) {
    await tx.auditLog.create({
      data: {
        action: "ORDER_PAID",
        target: orderId,
        metadata: { checkoutSessionId: session.id, paymentIntentId: pi, amountTotal: session.amount_total, currency: session.currency },
      },
    });
    // Issue license keys (one per purchased unit) and count the coupon
    // redemption, atomically with the payment itself: a rolled-back event
    // issues nothing, and a duplicate delivery short-circuits above because
    // the order is no longer PENDING.
    const fullOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true, couponCode: true, items: { select: { id: true, productId: true, quantity: true } } },
    });
    if (fullOrder?.userId) {
      const licenseRows = fullOrder.items.flatMap((item) =>
        Array.from({ length: Math.min(item.quantity, 10) }, () => ({
          key: generateLicenseKey(),
          userId: fullOrder.userId!,
          productId: item.productId,
          orderItemId: item.id,
        })),
      );
      if (licenseRows.length) await tx.license.createMany({ data: licenseRows, skipDuplicates: true });
    }
    if (fullOrder?.couponCode) {
      await tx.coupon.updateMany({
        where: { code: fullOrder.couponCode },
        data: { timesRedeemed: { increment: 1 } },
      });
    }
  }
  return changed.count ? orderId : null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY, hook = process.env.STRIPE_WEBHOOK_SECRET, sig = req.headers.get("stripe-signature");
  if (!secret || !hook || !sig) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });
  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await req.text(), sig, hook); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }

  // Stripe calls that must happen before the database transaction, so the
  // transaction itself only does database work and stays short.
  const refunds: Stripe.Refund[] = [];
  let subscriptionSnapshot: Stripe.Subscription | null = null;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription" && typeof session.subscription === "string") {
      subscriptionSnapshot = await stripe.subscriptions.retrieve(session.subscription).catch(() => null);
    }
  }
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    if (paymentIntentId) {
      const [order, invoice] = await Promise.all([
        prisma.order.findFirst({ where: { stripePaymentIntent: paymentIntentId }, select: { id: true } }),
        prisma.invoice.findFirst({ where: { stripePaymentIntent: paymentIntentId }, select: { id: true } }),
      ]);
      if (order || invoice) {
        // Page through every refund for the charge: capping at 100 silently
        // drops older refunds and understates the refunded total.
        let startingAfter: string | undefined;
        for (;;) {
          const page = await stripe.refunds.list({ charge: charge.id, limit: 100, starting_after: startingAfter });
          refunds.push(...page.data);
          if (!page.has_more || !page.data.length) break;
          startingAfter = page.data[page.data.length - 1].id;
        }
      }
    }
  }

  // What the transaction settled, so receipts/refund notices can be sent
  // after it commits (never inside it).
  let settledOrderId: string | null = null;
  let settledInvoiceId: string | null = null;
  let refundNotice: { orderId?: string; invoiceId?: string; refundedCents: number; totalCents: number; currency: string } | null = null;
  let subscriptionWelcome: { userId: string; plan: string } | null = null;
  let subscriptionReceipt: { userId: string; plan: string; amountCents: number; currency: string } | null = null;

  try {
    // One transaction covers the event-ledger claim, the order/invoice
    // transition and the processed timestamp. If anything fails, the whole
    // transaction rolls back — including the ledger row — so Stripe retries
    // and the event is processed exactly once on a later delivery.
    await prisma.$transaction(async (tx) => {
      const ledger = await tx.stripeWebhookEvent.create({
        data: { eventId: event.id, eventType: event.type },
        select: { id: true },
      });

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.invoiceId) settledInvoiceId = await settleInvoice(tx, session);
        else settledOrderId = await settleOrder(tx, session);
      }
      // A completed subscription checkout mirrors the subscription locally
      // so the portal can show it without calling Stripe per page load.
      if ((event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") && subscriptionSnapshot) {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planSlug = session.metadata?.plan;
        if (userId && planSlug) {
          await tx.subscription.upsert({
            where: { stripeSubscriptionId: subscriptionSnapshot.id },
            create: {
              userId,
              plan: planSlug,
              stripeCustomerId: String(session.customer ?? subscriptionSnapshot.customer),
              stripeSubscriptionId: subscriptionSnapshot.id,
              status: subscriptionSnapshot.status,
              currentPeriodEnd: periodEndOf(subscriptionSnapshot),
              cancelAtPeriodEnd: subscriptionSnapshot.cancel_at_period_end,
            },
            update: {
              status: subscriptionSnapshot.status,
              currentPeriodEnd: periodEndOf(subscriptionSnapshot),
              cancelAtPeriodEnd: subscriptionSnapshot.cancel_at_period_end,
            },
          });
          await tx.auditLog.create({
            data: { action: "SUBSCRIPTION_CREATED", target: subscriptionSnapshot.id, metadata: { userId, plan: planSlug } },
          });
          subscriptionWelcome = { userId, plan: planSlug };
        }
      }
      // Subscription lifecycle: keep the local mirror in step with Stripe.
      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;
        const meta = (sub.metadata ?? {}) as { userId?: string; plan?: string };
        const existing = await tx.subscription.findUnique({ where: { stripeSubscriptionId: sub.id }, select: { id: true } });
        if (existing) {
          await tx.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: { status, currentPeriodEnd: periodEndOf(sub), cancelAtPeriodEnd: sub.cancel_at_period_end },
          });
        } else if (meta.userId && meta.plan) {
          await tx.subscription.create({
            data: {
              userId: meta.userId,
              plan: meta.plan,
              stripeCustomerId: String(sub.customer),
              stripeSubscriptionId: sub.id,
              status,
              currentPeriodEnd: periodEndOf(sub),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
        }
        await tx.auditLog.create({
          data: {
            action: event.type === "customer.subscription.deleted" ? "SUBSCRIPTION_CANCELED" : "SUBSCRIPTION_UPDATED",
            target: sub.id,
            metadata: { status },
          },
        });
      }
      // A paid subscription invoice (first payment or a renewal) gets a
      // receipt email after commit. One-off invoice payments are settled by
      // checkout.session.completed instead and never reach this branch with
      // a subscription attached.
      if (event.type === "invoice.paid") {
        const stripeInvoice = event.data.object as Stripe.Invoice;
        const subId = (stripeInvoice as unknown as { subscription?: string | null }).subscription
          ?? (stripeInvoice as unknown as { parent?: { subscription_details?: { subscription?: string | null } } }).parent?.subscription_details?.subscription
          ?? null;
        if (subId) {
          const local = await tx.subscription.findUnique({
            where: { stripeSubscriptionId: subId },
            select: { userId: true, plan: true },
          });
          if (local) {
            await tx.auditLog.create({
              data: {
                action: "SUBSCRIPTION_PAYMENT",
                target: subId,
                metadata: { invoiceId: stripeInvoice.id, amountPaid: stripeInvoice.amount_paid, currency: stripeInvoice.currency },
              },
            });
            subscriptionReceipt = {
              userId: local.userId,
              plan: local.plan,
              amountCents: stripeInvoice.amount_paid,
              currency: stripeInvoice.currency,
            };
          }
        }
      }
      if (event.type === "charge.refunded") {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (paymentIntentId && refunds.length) {
          const refundedCents = refunds
            .filter(refund => refund.status === "succeeded")
            .reduce((sum, refund) => sum + refund.amount, 0);
          const order = await tx.order.findFirst({
            where: { stripePaymentIntent: paymentIntentId },
            select: { id: true, totalCents: true, status: true, currency: true },
          });
          if (order) {
            for (const refund of refunds) {
              await tx.stripeRefund.upsert({
                where: { stripeRefundId: refund.id },
                create: {
                  stripeRefundId: refund.id,
                  orderId: order.id,
                  amountCents: refund.amount,
                  currency: refund.currency,
                  status: refund.status || "unknown",
                },
                update: {
                  amountCents: refund.amount,
                  currency: refund.currency,
                  status: refund.status || "unknown",
                },
              });
            }
            await tx.order.updateMany({
              where: { id: order.id },
              data: {
                refundedCents,
                ...(refundedCents >= order.totalCents ? { status: "REFUNDED" } : {}),
              },
            });
            await tx.auditLog.create({
              data: {
                action: "ORDER_REFUNDS_RECONCILED",
                target: order.id,
                metadata: { chargeId: charge.id, refundedCents, totalCents: order.totalCents, refundCount: refunds.length },
              },
            });
            if (refundedCents > 0) refundNotice = { orderId: order.id, refundedCents, totalCents: order.totalCents, currency: order.currency };
          } else {
            // The same charge can belong to an invoice, not an order.
            const invoice = await tx.invoice.findFirst({
              where: { stripePaymentIntent: paymentIntentId },
              select: { id: true, totalCents: true, status: true, currency: true },
            });
            if (invoice) {
              await tx.invoice.updateMany({
                where: { id: invoice.id },
                data: {
                  refundedCents,
                  ...(refundedCents >= invoice.totalCents ? { status: "REFUNDED" } : {}),
                },
              });
              await tx.auditLog.create({
                data: {
                  action: "INVOICE_REFUNDS_RECONCILED",
                  target: invoice.id,
                  metadata: { chargeId: charge.id, refundedCents, totalCents: invoice.totalCents, refundCount: refunds.length },
                },
              });
              if (refundedCents > 0) refundNotice = { invoiceId: invoice.id, refundedCents, totalCents: invoice.totalCents, currency: invoice.currency };
            }
          }
        }
      }
      if (event.type.startsWith("charge.dispute.")) {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId = typeof dispute.payment_intent === "string" ? dispute.payment_intent : null;
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : null;
        // Link the dispute to the order or invoice it belongs to, when one
        // can be found, so the owner sees it against the right record.
        let target = dispute.id;
        if (paymentIntentId) {
          const [order, invoice] = await Promise.all([
            tx.order.findFirst({ where: { stripePaymentIntent: paymentIntentId }, select: { id: true } }),
            tx.invoice.findFirst({ where: { stripePaymentIntent: paymentIntentId }, select: { id: true } }),
          ]);
          if (order) target = order.id;
          else if (invoice) target = invoice.id;
        }
        const action =
          event.type === "charge.dispute.created" ? "DISPUTE_OPENED"
          : event.type === "charge.dispute.closed" ? "DISPUTE_CLOSED"
          : event.type === "charge.dispute.funds_withdrawn" ? "DISPUTE_FUNDS_WITHDRAWN"
          : "DISPUTE_FUNDS_REINSTATED";
        await tx.auditLog.create({
          data: {
            action,
            target,
            metadata: {
              disputeId: dispute.id,
              chargeId,
              paymentIntentId,
              amountCents: dispute.amount,
              currency: dispute.currency,
              reason: dispute.reason,
              status: dispute.status,
            },
          },
        });
      }
      if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.orderId) await tx.order.updateMany({ where: { stripeCheckoutSession: session.id, status: "PENDING" }, data: { status: "CANCELLED" } });
      }
      await tx.stripeWebhookEvent.update({ where: { id: ledger.id }, data: { processedAt: new Date() } });
    });
    // Receipts and refund notices go out only after the transaction commits,
    // so a rolled-back event never emails about money that was not recorded.
    // Sent via after() so Stripe still gets its 200 immediately.
    if (settledOrderId || settledInvoiceId || refundNotice || subscriptionWelcome || subscriptionReceipt) {
      const orderId = settledOrderId;
      const invoiceId = settledInvoiceId;
      const notice = refundNotice;
      // Assertions pin the declared types: TS's flow analysis collapses
      // these two to null because they are only assigned inside nested
      // blocks of the transaction callback.
      const welcome = subscriptionWelcome as { userId: string; plan: string } | null;
      const receipt = subscriptionReceipt as { userId: string; plan: string; amountCents: number; currency: string } | null;
      after(async () => {
        try {
          if (orderId) await sendOrderReceiptEmail(orderId);
          if (invoiceId) await sendInvoicePaidEmail(invoiceId);
          if (notice) await sendRefundEmail(notice);
          if (welcome) {
            const plan = getPlan(welcome.plan);
            if (plan) await sendSubscriptionWelcomeEmail(welcome.userId, plan.name, plan.priceCents, plan.currency);
          }
          if (receipt) {
            const plan = getPlan(receipt.plan);
            await sendSubscriptionReceiptEmail(receipt.userId, plan?.name ?? receipt.plan, receipt.amountCents, receipt.currency);
          }
        } catch (error) {
          console.error("Post-webhook transactional email failed", error);
        }
      });
      // Instant owner alerts via the studio Telegram bot, in the same
      // post-commit window as the receipts (no-op until TELEGRAM_* env
      // vars are set). A failed alert never affects the webhook result.
      const tgNotice = refundNotice as {
        orderId?: string; invoiceId?: string;
        refundedCents: number; totalCents: number; currency: string;
      } | null;
      after(async () => {
        try {
          if (orderId) {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              select: { totalCents: true, currency: true },
            });
            if (order) {
              await notifyTelegram(
                `💰 New order paid on N3xUsKonc3ptz.com — ${formatMoney(order.totalCents, order.currency)}`,
              );
            }
          }
          if (invoiceId) {
            const invoice = await prisma.invoice.findUnique({
              where: { id: invoiceId },
              select: { totalCents: true, currency: true },
            });
            if (invoice) {
              await notifyTelegram(
                `🧾 Invoice paid on N3xUsKonc3ptz.com — ${formatMoney(invoice.totalCents, invoice.currency)}`,
              );
            }
          }
          if (tgNotice) {
            await notifyTelegram(
              `↩️ Refund on N3xUsKonc3ptz.com — ${formatMoney(tgNotice.refundedCents, tgNotice.currency)} refunded` +
                (tgNotice.orderId ? ` on order ${tgNotice.orderId}` : ` on invoice ${tgNotice.invoiceId ?? ""}`),
            );
          }
          if (welcome) {
            const plan = getPlan(welcome.plan);
            await notifyTelegram(
              `🔁 New subscription on N3xUsKonc3ptz.com — ${plan?.name ?? welcome.plan}` +
                (plan ? ` (${formatMoney(plan.priceCents, plan.currency)}/mo)` : ""),
            );
          }
          if (receipt) {
            const plan = getPlan(receipt.plan);
            await notifyTelegram(
              `🔁 Subscription payment on N3xUsKonc3ptz.com — ${plan?.name ?? receipt.plan}, ${formatMoney(receipt.amountCents, receipt.currency)}`,
            );
          }
        } catch (error) {
          console.error("Post-webhook Telegram alert failed", error);
        }
      });
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      // Another delivery already claimed (and processed) this event.
      const existing = await prisma.stripeWebhookEvent.findUnique({ where: { eventId: event.id }, select: { processedAt: true } });
      if (existing?.processedAt) return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Stripe webhook processing failed", { eventId: event.id, type: event.type, error });
    return NextResponse.json({ error: "Webhook processing failed. Stripe may retry." }, { status: 500 });
  }
}
