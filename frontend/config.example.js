// ============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================
// Este archivo es un template. Copia este archivo como 'config.js' 
// y ajusta los valores según tu entorno.

window.APP_CONFIG = {
    // URL base de la API backend
    // Desarrollo local: 'http://localhost:3001'
    // Producción: 'https://arbitraje-gestion-production.up.railway.app'
    API_BASE_URL: 'http://localhost:3001',
    
    // Configuración de Supabase para autenticación
    // Desarrollo local: 'http://localhost:8000'
    // Producción: 'https://tu-proyecto.supabase.co'
    SUPABASE_URL: 'http://localhost:8000',
    
    // Clave anónima pública de Supabase (segura para usar en el frontend)
    // Desarrollo local: Valor por defecto de Supabase Local
    // Producción: Obtener desde Supabase Dashboard > Settings > API
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
};
