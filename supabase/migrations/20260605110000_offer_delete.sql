create policy "Participants can delete offers"
  on public.listing_offers for delete
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
