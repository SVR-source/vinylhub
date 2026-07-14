import { createClient } from "@supabase/supabase-js";

// 👇 THAY bằng Project URL của bạn
const supabaseUrl = "https://krgfsjzznvbmxksyasnd.supabase.co";

// 👇 THAY bằng anon public key của bạn
const supabaseKey = "sb_publishable_HS7DmeXVHTEyqeln_JXzhw_2QS28PvU";

export const supabase = createClient(supabaseUrl, supabaseKey);