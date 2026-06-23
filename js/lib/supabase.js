/**
 * js/lib/supabase.js
 * Supabase client initialization
 */

const supabaseUrl = 'https://kpqktujsqardyxpdtwdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcWt0dWpzcWFyZHl4cGR0d2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzYzNTgsImV4cCI6MjA5NzQ1MjM1OH0.o-GoYU7k5vR9rgYgloFFVCkqjBZrEJwV7ObR_sYkISY';

// window.supabase is available via the CDN script included in index.html
export const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
