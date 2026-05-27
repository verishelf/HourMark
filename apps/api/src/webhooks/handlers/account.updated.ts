import type Stripe from "stripe";
import { connectService } from "../../services/stripe/connect.service.js";

export async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  if (!account.id) return;
  await connectService.syncAccountFromStripe(account.id);
}
