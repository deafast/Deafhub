import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function createAdminClient() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 return url && secret ? createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}}) : null;
}
