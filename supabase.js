import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://vlqhwnsdheoljyexkpls.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZscWh3bnNkaGVvbGp5ZXhrcGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MzE2MjAsImV4cCI6MjA4MzMwNzYyMH0.AWHo-1nnu9hdVUivKLC2O98wQhDFA7nhTE1qt9ZeZfs"
);
