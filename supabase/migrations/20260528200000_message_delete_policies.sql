-- Allow participants to delete conversations and senders to delete their messages
drop policy if exists "Participants can delete conversations" on public.conversations;
create policy "Participants can delete conversations"
  on public.conversations for delete
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Senders can delete own messages" on public.messages;
create policy "Senders can delete own messages"
  on public.messages for delete
  using (auth.uid() = sender_id);
