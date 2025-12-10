// supabase-client.js - Configuración centralizada de Supabase
// Este archivo debe colocarse en la misma carpeta que admin.html e index.html

// Verificar que supabase esté disponible globalmente
if (typeof supabase === 'undefined') {
    console.error('Error: Supabase JS library not loaded. Please include it before this file.');
}

// Credenciales de Supabase
const SUPABASE_CONFIG = {
    url: "https://fijyenrgbghnsuiooxts.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpanllbnJnYmdobnN1aW9veHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNjc3ODMsImV4cCI6MjA4MDc0Mzc4M30.BaR_mLGEXoUb9uxaxhoGgdk6Kd5jVTLJXZqSJX7jEfM"
};

// Crear el cliente de Supabase
let supabaseClient;

try {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase Client inicializado correctamente');
} catch (error) {
    console.error('❌ Error inicializando Supabase Client:', error);
}

// Función para obtener la URL de una imagen del storage
async function getImageUrl(imagePath) {
    // Si no hay imagen, devolver placeholder
    if (!imagePath || imagePath.trim() === '') {
        return "https://via.placeholder.com/300/2a2a2a/cccccc?text=Imagen+no+disponible";
    }

    // Si ya es una URL completa, devolverla
    if (imagePath.startsWith("http")) {
        return imagePath;
    }

    try {
        // Obtener URL pública desde Supabase Storage
        const { data, error } = supabaseClient
            .storage
            .from("imagenes")
            .getPublicUrl(imagePath);

        if (error) {
            console.error("Error obteniendo URL de imagen:", error);
            return "https://via.placeholder.com/300/2a2a2a/cccccc?text=Error+cargando+imagen";
        }

        return data?.publicUrl || "https://via.placeholder.com/300/2a2a2a/cccccc?text=Imagen+no+disponible";
    } catch (error) {
        console.error("Error en getImageUrl:", error);
        return "https://via.placeholder.com/300/2a2a2a/cccccc?text=Error+cargando+imagen";
    }
}

// Función para obtener todos los productos
async function getAllProducts() {
    try {
        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .order('name', { ascending: true });

        if (error) {
            console.error("Error obteniendo productos:", error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error("Error en getAllProducts:", error);
        return { data: null, error };
    }
}

// Función para obtener solo productos visibles
async function getVisibleProducts() {
    try {
        const { data, error } = await supabaseClient
            .from("products")
            .select("*")
            .eq("visible", true)
            .order('name', { ascending: true });

        if (error) {
            console.error("Error obteniendo productos visibles:", error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error("Error en getVisibleProducts:", error);
        return { data: null, error };
    }
}

// Función para actualizar un producto
async function updateProduct(id, updates) {
    try {
        const { data, error } = await supabaseClient
            .from("products")
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error("Error actualizando producto:", error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error("Error en updateProduct:", error);
        return { data: null, error };
    }
}

// Función para actualizar múltiples productos
async function updateMultipleProducts(products) {
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
        const { id, ...updates } = product;
        try {
            const result = await updateProduct(id, updates);
            
            if (result.error) {
                errorCount++;
                results.push({ 
                    id, 
                    success: false, 
                    error: result.error.message || 'Error desconocido' 
                });
            } else {
                successCount++;
                results.push({ id, success: true, error: null });
            }
        } catch (error) {
            errorCount++;
            results.push({ 
                id, 
                success: false, 
                error: error.message || 'Error desconocido' 
            });
        }
    }
    
    return {
        results,
        summary: {
            total: products.length,
            success: successCount,
            errors: errorCount
        }
    };
}

// Función para verificar la conexión con Supabase
async function checkConnection() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('count', { count: 'exact', head: true });
        
        return {
            connected: !error,
            error: error ? error.message : null
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message
        };
    }
}

// Exportar para uso global
window.SupabaseClient = {
    client: supabaseClient,
    getImageUrl,
    getAllProducts,
    getVisibleProducts,
    updateProduct,
    updateMultipleProducts,
    checkConnection,
    config: SUPABASE_CONFIG
};

// Verificar conexión al cargar
window.addEventListener('DOMContentLoaded', async () => {
    const connection = await checkConnection();
    if (connection.connected) {
        console.log('✅ Conexión a Supabase verificada correctamente');
    } else {
        console.error('❌ Error de conexión a Supabase:', connection.error);
    }
});