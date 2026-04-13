import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rldipcysrkxjkukgurzd.supabase.co";
const supabaseKey = "sb_publishable_DBNRfsanMho2Ce33Qq2dLA_6atstwWD";
export const supabase = createClient(supabaseUrl, supabaseKey);

