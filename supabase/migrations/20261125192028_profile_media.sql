insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', false, 3145728, array['image/webp']);

-- The two fixed names bound persistent storage to one avatar and one banner per account.
create policy "Players manage their own profile media"
on storage.objects
for all to authenticated
using (
    bucket_id = 'profile-media'
    and name in ((select auth.uid())::text || '/avatar.webp', (select auth.uid())::text || '/banner.webp')
)
with check (
    bucket_id = 'profile-media'
    and name in ((select auth.uid())::text || '/avatar.webp', (select auth.uid())::text || '/banner.webp')
);
