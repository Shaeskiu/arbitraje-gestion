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
                    'Content-Type': 'application/json'
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
                    'Content-Type': 'application/json'
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
        
        if (opportunity.originChannel !== undefined && opportunity.originChannel !== null) {
            dbOpp.origin_channel = String(opportunity.originChannel).trim();
        }
        
        if (opportunity.originPrice !== undefined && opportunity.originPrice !== null) {
            dbOpp.origin_price = parseFloat(opportunity.originPrice);
        }
        
        if (opportunity.destChannel !== undefined && opportunity.destChannel !== null) {
            dbOpp.dest_channel = String(opportunity.destChannel).trim();
        }
        
        if (opportunity.destPrice !== undefined && opportunity.destPrice !== null) {
            dbOpp.dest_price = parseFloat(opportunity.destPrice);
        }
        
        if (opportunity.status !== undefined && opportunity.status !== null) {
            dbOpp.status = String(opportunity.status);
        }
        
        if (opportunity.costs !== undefined) {
            dbOpp.costs = opportunity.costs || [];
        }
        
        if (opportunity.originChannelId !== undefined && opportunity.originChannelId !== null) {
            dbOpp.origin_channel_id = opportunity.originChannelId;
        }
        
        if (opportunity.destChannelId !== undefined && opportunity.destChannelId !== null) {
            dbOpp.dest_channel_id = opportunity.destChannelId;
        }
        
        if (opportunity.realSalePrice !== undefined) {
            dbOpp.real_sale_price = opportunity.realSalePrice !== null ? parseFloat(opportunity.realSalePrice) : null;
        }
        
        if (opportunity.notes !== undefined) {
            dbOpp.notes = opportunity.notes ? String(opportunity.notes).trim() : null;
        }
        
        return dbOpp;
    },
    
    transformFromDB(dbOpportunity) {
        const costs = dbOpportunity.opportunity_costs || [];
        
        return {
            id: dbOpportunity.id,
            productName: dbOpportunity.product_name,
            originChannel: dbOpportunity.origin_channel || (dbOpportunity.origin_channel_id ? '' : ''),
            originChannelId: dbOpportunity.origin_channel_id || null,
            originPrice: parseFloat(dbOpportunity.origin_price),
            destChannel: dbOpportunity.dest_channel || (dbOpportunity.dest_channel_id ? '' : ''),
            destChannelId: dbOpportunity.dest_channel_id || null,
            destPrice: parseFloat(dbOpportunity.dest_price),
            realSalePrice: dbOpportunity.real_sale_price ? parseFloat(dbOpportunity.real_sale_price) : null,
            status: dbOpportunity.status,
            notes: dbOpportunity.notes,
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
                    'Content-Type': 'application/json'
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
                    'Content-Type': 'application/json'
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
    
    async convertFromOpportunity(opportunityId, realPurchasePrice, units) {
        try {
            if (!opportunityId || typeof opportunityId !== 'string') {
                throw new Error('Valid opportunity ID is required');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/stock/from-opportunity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    opportunity_id: opportunityId,
                    real_purchase_price: parseFloat(realPurchasePrice),
                    units: parseInt(units)
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            const stockItem = await response.json();
            
            return this.transformFromDB(stockItem);
        } catch (error) {
            console.error('Error converting opportunity to stock:', error);
            throw error;
        }
    },
    
    async update(id, updates) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Valid ID is required');
            }
            
            const dbUpdates = this.transformToDB(updates);
            
            const response = await fetch(`${this.apiBaseUrl}/stock/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dbUpdates)
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
    
    async delete(id) {
        try {
            if (!id || typeof id !== 'string') {
                throw new Error('Valid ID is required');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/stock/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting stock:', error);
            throw error;
        }
    },
    
    transformToDB(stock) {
        const dbStock = {};
        
        if (stock.productName !== undefined) dbStock.product_name = String(stock.productName).trim();
        if (stock.purchaseChannel !== undefined) dbStock.purchase_channel = String(stock.purchaseChannel).trim();
        if (stock.purchaseChannelId !== undefined) dbStock.purchase_channel_id = stock.purchaseChannelId || null;
        if (stock.realPurchasePrice !== undefined) dbStock.real_purchase_price = parseFloat(stock.realPurchasePrice) || 0;
        if (stock.unitsPurchased !== undefined) dbStock.units_purchased = parseInt(stock.unitsPurchased) || 1;
        if (stock.purchaseDate !== undefined) dbStock.purchase_date = String(stock.purchaseDate);
        if (stock.stockStatus !== undefined) dbStock.stock_status = String(stock.stockStatus);
        if (stock.notes !== undefined) dbStock.notes = stock.notes ? String(stock.notes).trim() : null;
        
        return dbStock;
    },
    
    transformFromDB(dbStock) {
        return {
            id: dbStock.id,
            opportunityId: dbStock.opportunity_id,
            productName: dbStock.product_name,
            purchaseChannel: dbStock.purchase_channel,
            purchaseChannelId: dbStock.purchase_channel_id,
            realPurchasePrice: parseFloat(dbStock.real_purchase_price),
            unitsPurchased: parseInt(dbStock.units_purchased),
            purchaseDate: dbStock.purchase_date,
            stockStatus: dbStock.stock_status,
            notes: dbStock.notes || '',
            createdAt: dbStock.created_at,
            updatedAt: dbStock.updated_at
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
});
