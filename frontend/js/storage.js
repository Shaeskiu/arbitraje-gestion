const storage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async getAll() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/opportunities`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const opportunities = await response.json();
            
            return opportunities.map(opp => this.transformFromDB(opp));
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            return [];
        }
    },
    
    async add(opportunity) {
        try {
            const dbOpportunity = this.transformToDB(opportunity);
            
            const response = await fetch(`${this.apiBaseUrl}/opportunities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dbOpportunity)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const newOpportunity = await response.json();
            
            return this.transformFromDB(newOpportunity);
        } catch (error) {
            console.error('Error adding opportunity:', error);
            throw error;
        }
    },
    
    async update(id, updates) {
        try {
            const dbUpdates = this.transformToDB(updates);
            
            const response = await fetch(`${this.apiBaseUrl}/opportunities/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dbUpdates)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updatedOpportunity = await response.json();
            
            return this.transformFromDB(updatedOpportunity);
        } catch (error) {
            console.error('Error updating opportunity:', error);
            throw error;
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/opportunities/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting opportunity:', error);
            return false;
        }
    },
    
    async getById(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/opportunities/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const opportunity = await response.json();
            
            return this.transformFromDB(opportunity);
        } catch (error) {
            console.error('Error fetching opportunity:', error);
            return null;
        }
    },
    
    transformToDB(opportunity) {
        const dbOpp = {};
        
        if (opportunity.productName !== undefined && opportunity.productName !== null) {
            dbOpp.product_name = String(opportunity.productName).trim();
        }
        
        // Usar nuevos campos o mantener compatibilidad con antiguos
        const precioCompra = opportunity.precioEstimadoCompra !== undefined 
            ? opportunity.precioEstimadoCompra 
            : (opportunity.originPrice !== undefined ? opportunity.originPrice : null);
        
        const precioVenta = opportunity.precioEstimadoVenta !== undefined 
            ? opportunity.precioEstimadoVenta 
            : (opportunity.destPrice !== undefined ? opportunity.destPrice : null);
        
        if (precioCompra !== undefined && precioCompra !== null) {
            dbOpp.precio_estimado_compra = parseFloat(precioCompra);
            dbOpp.origin_price = parseFloat(precioCompra); // Compatibilidad
        }
        
        if (precioVenta !== undefined && precioVenta !== null) {
            dbOpp.precio_estimado_venta = parseFloat(precioVenta);
            dbOpp.dest_price = parseFloat(precioVenta); // Compatibilidad
        }
        
        // Calcular margen estimado
        if (precioCompra !== null && precioVenta !== null) {
            dbOpp.margen_estimado = parseFloat(precioVenta) - parseFloat(precioCompra);
        }
        
        const canalOrigenId = opportunity.canalOrigenId !== undefined 
            ? opportunity.canalOrigenId 
            : (opportunity.originChannelId !== undefined ? opportunity.originChannelId : null);
        
        const canalDestinoId = opportunity.canalDestinoId !== undefined 
            ? opportunity.canalDestinoId 
            : (opportunity.destChannelId !== undefined ? opportunity.destChannelId : null);
        
        if (canalOrigenId !== undefined && canalOrigenId !== null) {
            dbOpp.canal_origen_id = canalOrigenId;
            dbOpp.origin_channel_id = canalOrigenId; // Compatibilidad
        }
        
        if (canalDestinoId !== undefined && canalDestinoId !== null) {
            dbOpp.canal_destino_id = canalDestinoId;
            dbOpp.dest_channel_id = canalDestinoId; // Compatibilidad
        }
        
        // Mantener campos antiguos para compatibilidad
        if (opportunity.originChannel !== undefined && opportunity.originChannel !== null) {
            dbOpp.origin_channel = String(opportunity.originChannel).trim();
        }
        
        if (opportunity.destChannel !== undefined && opportunity.destChannel !== null) {
            dbOpp.dest_channel = String(opportunity.destChannel).trim();
        }
        
        if (opportunity.status !== undefined && opportunity.status !== null) {
            // Normalizar status a los valores permitidos
            const statusValue = String(opportunity.status).toLowerCase().trim();
            dbOpp.status = statusValue === 'detectado' ? 'detectada'
                : statusValue === 'descartado' ? 'descartada'
                : statusValue === 'convertido' ? 'convertida'
                : statusValue === 'comprado' || statusValue === 'comprada' ? 'convertida'
                : statusValue === 'vendido' || statusValue === 'vendida' ? 'convertida'
                : statusValue === 'analizado' || statusValue === 'analizada' ? 'detectada'
                : statusValue === 'aprobado' || statusValue === 'aprobada' ? 'detectada'
                : (statusValue === 'detectada' || statusValue === 'descartada' || statusValue === 'convertida')
                    ? statusValue
                    : 'detectada'; // Valor por defecto
        } else {
            // Si no viene status, usar 'detectada' por defecto
            dbOpp.status = 'detectada';
        }
        
        if (opportunity.costs !== undefined) {
            dbOpp.costs = opportunity.costs || [];
        }
        
        if (opportunity.notes !== undefined) {
            dbOpp.notes = opportunity.notes ? String(opportunity.notes).trim() : null;
        }
        
        if (opportunity.offerLink !== undefined) {
            dbOpp.offer_link = opportunity.offerLink ? String(opportunity.offerLink).trim() : null;
        }
        
        if (opportunity.marketPriceLink !== undefined) {
            dbOpp.market_price_link = opportunity.marketPriceLink ? String(opportunity.marketPriceLink).trim() : null;
        }
        
        return dbOpp;
    },
    
    transformFromDB(dbOpportunity) {
        const costs = dbOpportunity.opportunity_costs || [];
        
        // Usar nuevos campos si existen, sino usar los antiguos para compatibilidad
        const precioEstimadoCompra = dbOpportunity.precio_estimado_compra !== undefined && dbOpportunity.precio_estimado_compra !== null
            ? parseFloat(dbOpportunity.precio_estimado_compra)
            : (dbOpportunity.origin_price ? parseFloat(dbOpportunity.origin_price) : 0);
        
        const precioEstimadoVenta = dbOpportunity.precio_estimado_venta !== undefined && dbOpportunity.precio_estimado_venta !== null
            ? parseFloat(dbOpportunity.precio_estimado_venta)
            : (dbOpportunity.dest_price ? parseFloat(dbOpportunity.dest_price) : 0);
        
        const canalOrigenId = dbOpportunity.canal_origen_id || dbOpportunity.origin_channel_id || null;
        const canalDestinoId = dbOpportunity.canal_destino_id || dbOpportunity.dest_channel_id || null;
        
        return {
            id: dbOpportunity.id,
            productName: dbOpportunity.product_name,
            originChannel: dbOpportunity.origin_channel || '',
            originChannelId: canalOrigenId,
            originPrice: precioEstimadoCompra, // Para compatibilidad con código existente
            canalOrigenId: canalOrigenId,
            precioEstimadoCompra: precioEstimadoCompra,
            destChannel: dbOpportunity.dest_channel || '',
            destChannelId: canalDestinoId,
            destPrice: precioEstimadoVenta, // Para compatibilidad
            canalDestinoId: canalDestinoId,
            precioEstimadoVenta: precioEstimadoVenta,
            margenEstimado: dbOpportunity.margen_estimado ? parseFloat(dbOpportunity.margen_estimado) : (precioEstimadoVenta - precioEstimadoCompra),
            status: dbOpportunity.status,
            notes: dbOpportunity.notes,
            offerLink: dbOpportunity.offer_link || null,
            marketPriceLink: dbOpportunity.market_price_link || null,
            costs: costs.map(cost => ({
                id: cost.id,
                name: cost.name,
                type: cost.type,
                value: parseFloat(cost.value),
                base: cost.base,
                source: cost.source || 'manual'
            })),
            createdAt: dbOpportunity.created_at,
            updatedAt: dbOpportunity.updated_at
        };
    }
};

const channelStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async getAll() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/channels`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const channels = await response.json();
            
            return channels.map(ch => this.transformFromDB(ch));
        } catch (error) {
            console.error('Error fetching channels:', error);
            return [];
        }
    },
    
    async getById(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/channels/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const channel = await response.json();
            
            return this.transformFromDB(channel);
        } catch (error) {
            console.error('Error fetching channel:', error);
            return null;
        }
    },
    
    async add(channel) {
        try {
            const dbChannel = this.transformToDB(channel);
            
            const response = await fetch(`${this.apiBaseUrl}/channels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dbChannel)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const newChannel = await response.json();
            
            return this.transformFromDB(newChannel);
        } catch (error) {
            console.error('Error adding channel:', error);
            throw error;
        }
    },
    
    async update(id, updates) {
        try {
            const dbUpdates = this.transformToDB(updates);
            
            const response = await fetch(`${this.apiBaseUrl}/channels/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dbUpdates)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updatedChannel = await response.json();
            
            return this.transformFromDB(updatedChannel);
        } catch (error) {
            console.error('Error updating channel:', error);
            throw error;
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/channels/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting channel:', error);
            return false;
        }
    },
    
    transformToDB(channel) {
        return {
            name: String(channel.name || '').trim(),
            originCosts: (channel.originCosts || []).filter(c => c.name && c.name.trim().length > 0),
            destCosts: (channel.destCosts || []).filter(c => c.name && c.name.trim().length > 0)
        };
    },
    
    transformFromDB(dbChannel) {
        const costs = dbChannel.channel_costs || [];
        
        return {
            id: dbChannel.id,
            name: dbChannel.name,
            originCosts: costs.filter(c => c.cost_role === 'origin').map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                value: parseFloat(c.value),
                base: c.base
            })),
            destCosts: costs.filter(c => c.cost_role === 'destination').map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                value: parseFloat(c.value),
                base: c.base
            })),
            createdAt: dbChannel.created_at,
            updatedAt: dbChannel.updated_at
        };
    }
};

const comprasStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async createFromOpportunity(opportunityId, canalOrigenId, productName, precioUnitario, unidades, costesCompra = [], fechaCompra = null) {
        try {
            if (!canalOrigenId || typeof canalOrigenId !== 'string') {
                throw new Error('Valid canal origen ID is required');
            }
            
            if (!productName || typeof productName !== 'string' || !productName.trim()) {
                throw new Error('Product name is required');
            }
            
            const compraData = {
                oportunidad_id: opportunityId && opportunityId !== '' ? opportunityId : null,
                canal_origen_id: canalOrigenId,
                product_name: productName.trim(),
                precio_unitario: parseFloat(precioUnitario),
                unidades: parseInt(unidades),
                costes_compra: costesCompra || [],
                fecha_compra: fechaCompra || new Date().toISOString().split('T')[0]
            };
            
            const response = await fetch(`${this.apiBaseUrl}/compras`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(compraData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating compra:', error);
            throw error;
        }
    },
    
    async createMultipleFromOpportunity(opportunityId, canalOrigenId, productNameBase, items, fechaCompra = null, precioBase = 0) {
        try {
            if (!canalOrigenId || typeof canalOrigenId !== 'string') {
                throw new Error('Valid canal origen ID is required');
            }
            
            if (!productNameBase || typeof productNameBase !== 'string' || !productNameBase.trim()) {
                throw new Error('Product name is required');
            }
            
            if (!Array.isArray(items) || items.length === 0) {
                throw new Error('At least one item is required');
            }
            
            // Validar items
            items.forEach((item, index) => {
                if (!item.unidades || parseInt(item.unidades) < 1) {
                    throw new Error(`Item ${index + 1}: unidades must be at least 1`);
                }
                if (item.precio_unitario !== undefined && item.precio_unitario !== null && parseFloat(item.precio_unitario) < 0) {
                    throw new Error(`Item ${index + 1}: precio_unitario must be >= 0`);
                }
            });
            
            const requestData = {
                oportunidad_id: opportunityId && opportunityId !== '' ? opportunityId : null,
                canal_origen_id: canalOrigenId,
                product_name_base: productNameBase.trim(),
                precio_base: precioBase,
                fecha_compra: fechaCompra || new Date().toISOString().split('T')[0],
                items: items.map(item => ({
                    talla: item.talla && item.talla.trim() ? item.talla.trim() : null,
                    unidades: parseInt(item.unidades),
                    precio_unitario: item.precio_unitario !== undefined && item.precio_unitario !== null 
                        ? parseFloat(item.precio_unitario) 
                        : null,
                    costes_compra: item.costes_compra || []
                }))
            };
            
            const response = await fetch(`${this.apiBaseUrl}/compras/multiple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error creating multiple compras:', error);
            throw error;
        }
    },
    
    async getAll() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/compras`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching compras:', error);
            return [];
        }
    },

    async update(id, updates) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Valid compra ID is required');
            }

            const payload = {};

            if (updates.precio_unitario !== undefined) {
                payload.precio_unitario = parseFloat(updates.precio_unitario);
            }

            if (updates.unidades !== undefined) {
                payload.unidades = parseInt(updates.unidades);
            }

            if (updates.costes_compra !== undefined) {
                payload.costes_compra = Array.isArray(updates.costes_compra) ? updates.costes_compra : [];
            }

            if (updates.fecha_compra !== undefined) {
                payload.fecha_compra = updates.fecha_compra;
            }

            const response = await fetch(`${this.apiBaseUrl}/compras/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating compra:', error);
            throw error;
        }
    },

    async uploadFactura(compraId, file) {
        if (!compraId || typeof compraId !== 'string') {
            throw new Error('Valid compra ID is required');
        }
        if (!file || !(file instanceof File)) {
            throw new Error('Se requiere un archivo');
        }
        const formData = new FormData();
        formData.append('factura', file);
        const response = await fetch(`${this.apiBaseUrl}/compras/${compraId}/factura`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    async deleteFactura(compraId) {
        if (!compraId || typeof compraId !== 'string') {
            throw new Error('Valid compra ID is required');
        }
        const response = await fetch(`${this.apiBaseUrl}/compras/${compraId}/factura`, {
            method: 'DELETE'
        });
        if (!response.ok && response.status !== 204) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
        }
    },

    getFacturaUrl(compraId) {
        return `${this.apiBaseUrl}/compras/${compraId}/factura`;
    }
};

const stockStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async getAll() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stock`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stockItems = await response.json();
            
            return stockItems.map(item => this.transformFromDB(item));
        } catch (error) {
            console.error('Error fetching stock:', error);
            return [];
        }
    },
    
    async getById(id) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Valid ID is required');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/stock/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const stockItem = await response.json();
            
            return this.transformFromDB(stockItem);
        } catch (error) {
            console.error('Error fetching stock item:', error);
            throw error;
        }
    },
    
    async recepcionar(id, localizacionId = null) {
        try {
            const body = {};
            if (localizacionId !== null && localizacionId !== undefined) {
                body.localizacion_id = localizacionId;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/stock/${id}/recepcionar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updatedStock = await response.json();
            return this.transformFromDB(updatedStock);
        } catch (error) {
            console.error('Error recepcionando stock:', error);
            throw error;
        }
    },
    
    async ponerAVenta(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stock/${id}/poner-a-venta`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updatedStock = await response.json();
            return this.transformFromDB(updatedStock);
        } catch (error) {
            console.error('Error poniendo stock a venta:', error);
            throw error;
        }
    },
    
    async update(id, updates) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stock/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(updates)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updatedStock = await response.json();
            return this.transformFromDB(updatedStock);
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    },
    
    transformFromDB(dbStock) {
        const compra = dbStock.compra || {};
        const canal = compra.canal_origen || {};
        return {
            id: dbStock.id,
            compraId: dbStock.compra_id,
            unidadesIniciales: parseInt(dbStock.unidades_iniciales) || 0,
            unidadesDisponibles: parseInt(dbStock.unidades_disponibles) || 0,
            costeUnitarioReal: parseFloat(dbStock.coste_unitario_real) || 0,
            estado: dbStock.estado || 'disponible',
            localizacionId: dbStock.localizacion_id || null,
            localizacion: dbStock.localizacion || null,
            productoName: dbStock.product_name || compra.product_name || 'N/A',
            canalOrigenName: canal.name || 'N/A',
            canalOrigenId: compra.canal_origen_id || null,
            fechaCompra: compra.fecha_compra || null,
            fecha_recepcion: dbStock.fecha_recepcion || null,
            fecha_disponible: dbStock.fecha_disponible || null,
            precioActual: dbStock.precio_actual !== undefined && dbStock.precio_actual !== null ? parseFloat(dbStock.precio_actual) : null,
            margenNeto: dbStock.margen_neto !== undefined && dbStock.margen_neto !== null ? parseFloat(dbStock.margen_neto) : null,
            margenPorcentual: dbStock.margen_porcentual !== undefined && dbStock.margen_porcentual !== null ? parseFloat(dbStock.margen_porcentual) : null,
            opportunityCostsPerUnit: dbStock.opportunity_costs_per_unit !== undefined ? parseFloat(dbStock.opportunity_costs_per_unit) : 0,
            opportunityCosts: compra.opportunity_costs || [],
            compraUnidades: compra.unidades || 1,
            compraPrecioUnitario: compra.precio_unitario || 0,
            createdAt: dbStock.created_at,
            updatedAt: dbStock.updated_at
        };
    },
    
    async setPrecioStock(stockId, precio, motivo = null) {
        try {
            const body = { precio: parseFloat(precio) };
            if (motivo) body.motivo = motivo;
            
            const response = await fetch(`${this.apiBaseUrl}/stock/${stockId}/precios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error setting precio stock:', error);
            throw error;
        }
    },
    
    async getHistorialPrecios(stockId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stock/${stockId}/precios`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching historial precios:', error);
            return [];
        }
    }
};

const ventasStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async create(stockId, canalDestinoId, precioUnitario, unidades, costesVenta = [], fechaVenta = null) {
        try {
            if (!stockId || typeof stockId !== 'string') {
                throw new Error('Valid stock ID is required');
            }
            
            if (!canalDestinoId || typeof canalDestinoId !== 'string') {
                throw new Error('Valid canal destino ID is required');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/ventas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({
                    stock_id: stockId,
                    canal_destino_id: canalDestinoId,
                    precio_unitario: parseFloat(precioUnitario),
                    unidades: parseInt(unidades),
                    costes_venta: costesVenta,
                    fecha_venta: fechaVenta || new Date().toISOString().split('T')[0]
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const venta = await response.json();
            return venta;
        } catch (error) {
            console.error('Error creating venta:', error);
            throw error;
        }
    },
    
    async getAll() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/ventas`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching ventas:', error);
            return [];
        }
    },

    async getById(id) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Valid venta ID is required');
            }

            const response = await fetch(`${this.apiBaseUrl}/ventas/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }

            // La API devuelve { venta, compra, stock, canal_origen, canal_destino }
            return await response.json();
        } catch (error) {
            console.error('Error fetching venta detail:', error);
            throw error;
        }
    },

    async update(id, updates) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Valid venta ID is required');
            }

            const payload = {};

            if (updates.precio_unitario !== undefined) {
                payload.precio_unitario = parseFloat(updates.precio_unitario);
            }

            if (updates.unidades !== undefined) {
                payload.unidades = parseInt(updates.unidades);
            }

            if (updates.costes_venta !== undefined) {
                payload.costes_venta = Array.isArray(updates.costes_venta) ? updates.costes_venta : [];
            }

            if (updates.fecha_venta !== undefined) {
                payload.fecha_venta = updates.fecha_venta;
            }

            const response = await fetch(`${this.apiBaseUrl}/ventas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating venta:', error);
            throw error;
        }
    }
};

const kanbanStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    transformTaskFromDB(dbTask) {
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description || '',
            status: dbTask.status || 'nueva_idea',
            assigneeEmail: dbTask.assignee_email || null,
            createdByEmail: dbTask.created_by_email || null,
            createdAt: dbTask.created_at,
            updatedAt: dbTask.updated_at
        };
    },
    
    transformCommentFromDB(dbComment) {
        return {
            id: dbComment.id,
            taskId: dbComment.task_id,
            authorEmail: dbComment.author_email,
            content: dbComment.content,
            createdAt: dbComment.created_at
        };
    },
    
    async getAllTasks() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kanban/tasks`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const tasks = await response.json();
            return Array.isArray(tasks) ? tasks.map(t => this.transformTaskFromDB(t)) : [];
        } catch (error) {
            console.error('Error fetching kanban tasks:', error);
            return [];
        }
    },
    
    async createTask(task) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kanban/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({
                    title: task.title,
                    description: task.description || null,
                    status: task.status || 'nueva_idea',
                    assignee_email: task.assigneeEmail || null,
                    created_by_email: task.createdByEmail
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const created = await response.json();
            return this.transformTaskFromDB(created);
        } catch (error) {
            console.error('Error creating kanban task:', error);
            throw error;
        }
    },
    
    async updateTask(id, updates) {
        try {
            const payload = {};
            if (updates.title !== undefined) payload.title = updates.title;
            if (updates.description !== undefined) payload.description = updates.description;
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.assigneeEmail !== undefined) payload.assignee_email = updates.assigneeEmail;
            
            const response = await fetch(`${this.apiBaseUrl}/kanban/tasks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updated = await response.json();
            return this.transformTaskFromDB(updated);
        } catch (error) {
            console.error('Error updating kanban task:', error);
            throw error;
        }
    },
    
    async deleteTask(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kanban/tasks/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting kanban task:', error);
            return false;
        }
    },
    
    async getComments(taskId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kanban/tasks/${taskId}/comments`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const comments = await response.json();
            return Array.isArray(comments) ? comments.map(c => this.transformCommentFromDB(c)) : [];
        } catch (error) {
            console.error('Error fetching kanban comments:', error);
            return [];
        }
    },
    
    async addComment(taskId, content, authorEmail) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/kanban/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({
                    content,
                    author_email: authorEmail
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const created = await response.json();
            return this.transformCommentFromDB(created);
        } catch (error) {
            console.error('Error creating kanban comment:', error);
            throw error;
        }
    }
};

const dashboardStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async getImmobilizedCapital() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/dashboard/immobilized-capital`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return parseFloat(data.value || 0);
        } catch (error) {
            console.error('Error fetching immobilized capital:', error);
            return 0;
        }
    },
    
    async getSalesOverTime(grouping = 'day', startDate = null, endDate = null) {
        try {
            let url = `${this.apiBaseUrl}/dashboard/sales-over-time?grouping=${grouping}`;
            if (startDate) url += `&start_date=${startDate}`;
            if (endDate) url += `&end_date=${endDate}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching sales over time:', error);
            return [];
        }
    },
    
    async getMargins(startDate = null, endDate = null) {
        try {
            let url = `${this.apiBaseUrl}/dashboard/margins`;
            const params = [];
            if (startDate) params.push(`start_date=${startDate}`);
            if (endDate) params.push(`end_date=${endDate}`);
            if (params.length > 0) url += '?' + params.join('&');
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching margins:', error);
            return [];
        }
    }
};

const localizacionesStorage = {
    get apiBaseUrl() {
        if (!window.APP_CONFIG || !window.APP_CONFIG.API_BASE_URL) {
            console.error('APP_CONFIG.API_BASE_URL is not defined. Make sure config.js is loaded.');
            throw new Error('API configuration is missing. Please ensure config.js is loaded.');
        }
        return window.APP_CONFIG.API_BASE_URL;
    },
    
    async getAll() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/localizaciones`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const localizaciones = await response.json();
            
            return localizaciones.map(loc => this.transformFromDB(loc));
        } catch (error) {
            console.error('Error fetching localizaciones:', error);
            return [];
        }
    },
    
    async getById(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/localizaciones/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const localizacion = await response.json();
            
            return this.transformFromDB(localizacion);
        } catch (error) {
            console.error('Error fetching localizacion:', error);
            return null;
        }
    },
    
    async add(localizacion) {
        try {
            const dbLocalizacion = this.transformToDB(localizacion);
            
            const response = await fetch(`${this.apiBaseUrl}/localizaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dbLocalizacion)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const newLocalizacion = await response.json();
            
            return this.transformFromDB(newLocalizacion);
        } catch (error) {
            console.error('Error adding localizacion:', error);
            throw error;
        }
    },
    
    async update(id, updates) {
        try {
            const dbUpdates = this.transformToDB(updates);
            
            const response = await fetch(`${this.apiBaseUrl}/localizaciones/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(dbUpdates)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const updatedLocalizacion = await response.json();
            
            return this.transformFromDB(updatedLocalizacion);
        } catch (error) {
            console.error('Error updating localizacion:', error);
            throw error;
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/localizaciones/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting localizacion:', error);
            return false;
        }
    },
    
    transformToDB(localizacion) {
        return {
            name: String(localizacion.name || '').trim(),
            description: localizacion.description ? String(localizacion.description).trim() : null
        };
    },
    
    transformFromDB(dbLocalizacion) {
        return {
            id: dbLocalizacion.id,
            name: dbLocalizacion.name,
            description: dbLocalizacion.description || null,
            createdAt: dbLocalizacion.created_at,
            updatedAt: dbLocalizacion.updated_at
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
});
