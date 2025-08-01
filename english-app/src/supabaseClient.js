import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = 'https://bqkxobtniekabpcwgrjh.supabase.co'
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa3hvYnRuaWVrYWJwY3dncmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNjUwNzIsImV4cCI6MjA2OTY0MTA3Mn0.MNVChiY51XG6D47PWjnj5zqLnEpVHK5U4h8PcfyYeU4'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY


export const supabase = createClient(supabaseUrl, supabaseKey)