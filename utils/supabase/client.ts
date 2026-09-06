import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient<Database> | undefined;

export const createClient = () => {
    browserClient ??= createBrowserClient<Database>(
        supabaseUrl!,
        supabaseKey!,
    );

    return browserClient;
};
