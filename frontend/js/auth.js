// ============================================
// MÓDULO DE AUTENTICACIÓN CON SUPABASE
// ============================================

// Verificar que Supabase esté disponible
if (typeof window.APP_CONFIG === 'undefined' || !window.APP_CONFIG.SUPABASE_URL || !window.APP_CONFIG.SUPABASE_ANON_KEY) {
    console.error('Error: Configuración de Supabase no encontrada en APP_CONFIG');
}

// Importar Supabase desde CDN (se añadirá al HTML)
// El cliente se inicializará cuando se cargue el script de Supabase
let supabaseClient = null;

// Inicializar cliente de Supabase
function initSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }
    
    // Esperar a que Supabase esté disponible (puede tardar un momento en cargar)
    if (typeof supabase === 'undefined') {
        console.error('Error: Supabase no está cargado. Asegúrate de incluir el script de Supabase en index.html');
        return null;
    }
    
    const config = window.APP_CONFIG;
    if (!config || !config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
        console.error('Error: Configuración de Supabase incompleta');
        return null;
    }
    
    try {
        supabaseClient = supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        });
        return supabaseClient;
    } catch (error) {
        console.error('Error creando cliente de Supabase:', error);
        return null;
    }
}

// Obtener cliente de Supabase (inicializa si es necesario)
function getClient() {
    if (!supabaseClient) {
        initSupabaseClient();
    }
    return supabaseClient;
}

const auth = {
    /**
     * Iniciar sesión con email y contraseña
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<{user: object|null, error: object|null}>}
     */
    async login(email, password) {
        try {
            const client = getClient();
            if (!client) {
                return { user: null, error: { message: 'Cliente de Supabase no inicializado' } };
            }
            
            const { data, error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                console.error('Error en login:', error);
                return { user: null, error };
            }
            
            return { user: data.user, error: null };
        } catch (error) {
            console.error('Excepción en login:', error);
            return { user: null, error: { message: error.message || 'Error desconocido en login' } };
        }
    },
    
    /**
     * Cerrar sesión
     * @returns {Promise<{error: object|null}>}
     */
    async logout() {
        try {
            const client = getClient();
            if (!client) {
                return { error: { message: 'Cliente de Supabase no inicializado' } };
            }
            
            const { error } = await client.auth.signOut();
            
            if (error) {
                console.error('Error en logout:', error);
                return { error };
            }
            
            return { error: null };
        } catch (error) {
            console.error('Excepción en logout:', error);
            return { error: { message: error.message || 'Error desconocido en logout' } };
        }
    },
    
    /**
     * Obtener usuario actual
     * @returns {Promise<object|null>}
     */
    async getCurrentUser() {
        try {
            const client = getClient();
            if (!client) {
                return null;
            }
            
            const { data: { user } } = await client.auth.getUser();
            return user;
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            return null;
        }
    },
    
    /**
     * Obtener sesión actual
     * @returns {Promise<object|null>}
     */
    async getSession() {
        try {
            const client = getClient();
            if (!client) {
                return null;
            }
            
            const { data: { session } } = await client.auth.getSession();
            return session;
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
    },
    
    /**
     * Verificar si el usuario está autenticado
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        try {
            const session = await this.getSession();
            return session !== null && session !== undefined;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    },
    
    /**
     * Escuchar cambios en el estado de autenticación
     * @param {Function} callback - Función a ejecutar cuando cambie el estado
     * @returns {Function} Función para desuscribirse
     */
    onAuthStateChange(callback) {
        const client = getClient();
        if (!client) {
            return () => {};
        }
        
        const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        
        return () => {
            subscription.unsubscribe();
        };
    },
    
    /**
     * Inicializar el cliente de Supabase
     * Debe llamarse después de que se cargue el script de Supabase
     */
    init() {
        initSupabaseClient();
    }
};

// Auto-inicializar cuando el módulo se carga (si Supabase ya está disponible)
if (typeof supabase !== 'undefined') {
    auth.init();
}

// Exportar para uso global
window.auth = auth;

// También exportar el cliente de Supabase directamente para uso en consola
// Esto permite usar supabase.auth.signUp() directamente en la consola
window.getSupabaseClient = function() {
    return getClient();
};

// Exponer supabase globalmente para facilitar el uso en consola
// El CDN de Supabase ya define window.supabase como la función createClient
// Nosotros creamos el cliente y lo exponemos de forma diferente
if (typeof window !== 'undefined') {
    // Esperar a que todo esté cargado y luego exponer el cliente inicializado
    function exposeSupabaseClient() {
        const client = getClient();
        if (client) {
            // Exponer como window.supabaseClient (sin conflicto con el CDN)
            window.supabaseClient = client;
            
            // También crear un alias directo si window.supabase es solo la función createClient
            // Esto permite usar supabase.auth.signUp() directamente
            if (typeof window.supabase === 'function') {
                // window.supabase es la función createClient del CDN
                // Guardamos nuestro cliente en una variable temporal
                const originalSupabase = window.supabase;
                
                // Crear un objeto que tenga tanto createClient como nuestro cliente inicializado
                window.supabaseClientInstance = client;
                
                // Para uso en consola, permitir acceso directo
                console.log('✅ Cliente de Supabase disponible:');
                console.log('  - window.supabaseClient (cliente inicializado)');
                console.log('  - window.supabase.createClient() (función del CDN)');
            } else {
                // Si no hay conflicto, asignar directamente
                window.supabase = client;
            }
        }
    }
    
    // Intentar exponer inmediatamente
    exposeSupabaseClient();
    
    // También intentar después de que todo esté cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', exposeSupabaseClient);
    }
    
    // Y después de un pequeño delay para asegurar que config.js esté cargado
    setTimeout(exposeSupabaseClient, 100);
    setTimeout(exposeSupabaseClient, 500);
}
