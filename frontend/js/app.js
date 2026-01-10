const app = {
    currentOpportunityId: null,
    formCosts: [],
    detailCosts: [],
    channelOriginCosts: [],
    channelDestCosts: [],
    allChannels: [],
    
    init() {
        this.setupNavigation();
        this.setupForm();
        this.setupFilters();
        this.loadChannels().then(channels => {
            this.allChannels = channels || [];
        });
        this.showView('dashboard');
    },
    
    
    async loadChannels() {
        try {
            this.allChannels = await channelStorage.getAll();
            return this.allChannels;
        } catch (error) {
            console.error('Error loading channels:', error);
            return [];
        }
    },
    
    setupNavigation() {
        document.querySelectorAll('[data-nav]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-nav');
                this.showView(view);
            });
        });
    },
    
    setupForm() {
        const form = document.getElementById('opportunity-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveOpportunity();
            });
        }
        
        const channelForm = document.getElementById('channel-form');
        if (channelForm) {
            channelForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveChannel();
            });
        }
        
        ['origin-price', 'dest-price', 'real-sale-price'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    ui.updateFormCalculations();
                });
            }
        });
        
        const originChannelSelect = document.getElementById('origin-channel-select');
        const destChannelSelect = document.getElementById('dest-channel-select');
        if (originChannelSelect) {
            originChannelSelect.addEventListener('change', () => {
                this.onOriginChannelChange();
            });
        }
        if (destChannelSelect) {
            destChannelSelect.addEventListener('change', () => {
                this.onDestChannelChange();
            });
        }
    },
    
    setupFilters() {
        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.refreshDashboard();
        });
        
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.refreshDashboard();
        });
    },
    
    showView(viewName) {
        document.querySelectorAll('[data-view]').forEach(view => {
            view.classList.remove('active');
        });
        
        const view = document.querySelector(`[data-view="${viewName}"]`);
        if (view) {
            view.classList.add('active');
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('bg-indigo-50', 'text-indigo-700');
            link.classList.add('text-gray-700');
        });
        
        const navLink = document.querySelector(`[data-nav="${viewName}"]`);
        if (navLink) {
            navLink.classList.remove('text-gray-700');
            navLink.classList.add('bg-indigo-50', 'text-indigo-700');
        }
        
        if (viewName === 'dashboard') {
            this.refreshDashboard();
        } else if (viewName === 'channels') {
            this.refreshChannels();
        } else if (viewName === 'new') {
            this.initializeOpportunityForm();
        } else if (viewName === 'channel-form') {
            this.initializeChannelForm();
        }
    },
    
    async initializeOpportunityForm(isEdit = false) {
        const form = document.getElementById('opportunity-form');
        if (!form) {
            return;
        }
        
        const title = document.getElementById('form-title');
        if (title && !isEdit) {
            title.textContent = 'Nueva Oportunidad';
        }
        
        if (!isEdit) {
            this.formCosts = [];
            ui.renderCostsList('costs-list');
            ui.updateFormCalculations();
        }
        
        await this.loadChannels();
        if (this.allChannels && this.allChannels.length > 0) {
            ui.populateChannelSelects(this.allChannels);
        }
    },
    
    initializeChannelForm() {
        const form = document.getElementById('channel-form');
        if (!form) {
            return;
        }
        
        this.channelOriginCosts = this.channelOriginCosts || [];
        this.channelDestCosts = this.channelDestCosts || [];
        ui.renderChannelCostsList('channel-origin-costs-list', this.channelOriginCosts);
        ui.renderChannelCostsList('channel-dest-costs-list', this.channelDestCosts);
    },
    
    async refreshChannels() {
        try {
            const channels = await channelStorage.getAll();
            this.allChannels = channels;
            ui.renderChannels(channels);
        } catch (error) {
            console.error('Error refreshing channels:', error);
            alert('Error al cargar los canales.');
        }
    },
    
    showChannelForm() {
        this.channelOriginCosts = [];
        this.channelDestCosts = [];
        const form = document.getElementById('channel-form');
        if (form) {
            form.reset();
        }
        const channelIdInput = document.getElementById('channel-id');
        if (channelIdInput) {
            channelIdInput.value = '';
        }
        const title = document.getElementById('channel-form-title');
        if (title) {
            title.textContent = 'Nuevo Canal';
        }
        ui.renderChannelCostsList('channel-origin-costs-list', []);
        ui.renderChannelCostsList('channel-dest-costs-list', []);
        this.showView('channel-form');
    },
    
    async editChannel(id) {
        try {
            if (!id || typeof id !== 'string') {
                alert('ID de canal inválido');
                return;
            }
            
            const channel = await channelStorage.getById(id);
            
            if (channel) {
                const title = document.getElementById('channel-form-title');
                if (title) {
                    title.textContent = 'Editar Canal';
                }
                this.showView('channel-form');
                ui.renderChannelForm(channel);
            } else {
                alert('No se pudo cargar el canal. Por favor, inténtalo de nuevo.');
            }
        } catch (error) {
            console.error('Error loading channel:', error);
            alert('Error al cargar el canal: ' + (error.message || 'Error desconocido'));
        }
    },
    
    async deleteChannel(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este canal?')) {
            return;
        }
        
        try {
            if (!id || typeof id !== 'string') {
                alert('ID de canal inválido');
                return;
            }
            
            const success = await channelStorage.delete(id);
            if (success) {
                this.refreshChannels();
                this.loadChannels();
            } else {
                alert('Error al eliminar el canal.');
            }
        } catch (error) {
            console.error('Error deleting channel:', error);
            alert('Error al eliminar el canal.');
        }
    },
    
    addChannelCost(role) {
        const costs = role === 'origin' ? this.channelOriginCosts : this.channelDestCosts;
        costs.push({
            name: '',
            type: 'fixed',
            value: 0,
            base: null
        });
        
        const containerId = role === 'origin' ? 'channel-origin-costs-list' : 'channel-dest-costs-list';
        ui.renderChannelCostsList(containerId, costs);
    },
    
    removeChannelCost(role, index) {
        const costs = role === 'origin' ? this.channelOriginCosts : this.channelDestCosts;
        if (costs && costs[index]) {
            costs.splice(index, 1);
            const containerId = role === 'origin' ? 'channel-origin-costs-list' : 'channel-dest-costs-list';
            ui.renderChannelCostsList(containerId, costs);
        }
    },
    
    async saveChannel() {
        const idValue = document.getElementById('channel-id').value;
        const channelName = document.getElementById('channel-name').value;
        
        if (!channelName || channelName.trim().length === 0) {
            alert('El nombre del canal es obligatorio');
            return;
        }
        
        const channel = {
            name: channelName.trim(),
            originCosts: (this.channelOriginCosts || []).filter(cost => cost.name && cost.name.trim().length > 0),
            destCosts: (this.channelDestCosts || []).filter(cost => cost.name && cost.name.trim().length > 0)
        };
        
        try {
            if (idValue && idValue.trim() !== '') {
                await channelStorage.update(idValue.trim(), channel);
            } else {
                await channelStorage.add(channel);
            }
            
            await this.loadChannels();
            this.refreshChannels();
            this.showView('channels');
        } catch (error) {
            console.error('Error saving channel:', error);
            alert('Error al guardar el canal: ' + (error.message || 'Error desconocido'));
        }
    },
    
    async onOriginChannelChange() {
        const select = document.getElementById('origin-channel-select');
        const channelId = select.value;
        document.getElementById('origin-channel-id').value = channelId;
        
        if (!channelId) {
            this.removeChannelCostsBySource('channel_origin');
            ui.updateFormCalculations();
            return;
        }
        
        const channel = this.allChannels.find(c => c.id === channelId);
        if (channel && channel.originCosts && channel.originCosts.length > 0) {
            const existingChannelCosts = this.formCosts.filter(c => c.source === 'channel_origin');
            existingChannelCosts.forEach(cost => {
                const index = this.formCosts.indexOf(cost);
                if (index > -1) this.formCosts.splice(index, 1);
            });
            
            channel.originCosts.forEach(cost => {
                this.formCosts.push({
                    ...cost,
                    source: 'channel_origin',
                    channelName: channel.name
                });
            });
            
            ui.renderCostsList('costs-list');
            ui.updateFormCalculations();
        }
    },
    
    async onDestChannelChange() {
        const select = document.getElementById('dest-channel-select');
        const channelId = select.value;
        document.getElementById('dest-channel-id').value = channelId;
        
        if (!channelId) {
            this.removeChannelCostsBySource('channel_destination');
            ui.updateFormCalculations();
            return;
        }
        
        const channel = this.allChannels.find(c => c.id === channelId);
        if (channel && channel.destCosts && channel.destCosts.length > 0) {
            const existingChannelCosts = this.formCosts.filter(c => c.source === 'channel_destination');
            existingChannelCosts.forEach(cost => {
                const index = this.formCosts.indexOf(cost);
                if (index > -1) this.formCosts.splice(index, 1);
            });
            
            channel.destCosts.forEach(cost => {
                this.formCosts.push({
                    ...cost,
                    source: 'channel_destination',
                    channelName: channel.name
                });
            });
            
            ui.renderCostsList('costs-list');
            ui.updateFormCalculations();
        } else if (channel && (!channel.destCosts || channel.destCosts.length === 0)) {
            this.removeChannelCostsBySource('channel_destination');
            ui.renderCostsList('costs-list');
            ui.updateFormCalculations();
        }
    },
    
    removeChannelCostsBySource(source) {
        const costsToRemove = this.formCosts.filter(c => c.source === source);
        costsToRemove.forEach(cost => {
            const index = this.formCosts.indexOf(cost);
            if (index > -1) this.formCosts.splice(index, 1);
        });
        ui.renderCostsList('costs-list');
    },
    
    async refreshDashboard() {
        try {
            const opportunities = await storage.getAll();
            const filterStatus = document.getElementById('filter-status').value;
            const searchTerm = document.getElementById('search-input').value;
            
            ui.updateDashboardStats(opportunities);
            ui.renderDashboard(opportunities, filterStatus, searchTerm);
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            alert('Error al cargar las oportunidades. Por favor, recarga la página.');
        }
    },
    
    async saveOpportunity() {
        const id = document.getElementById('opportunity-id').value;
        const realSalePriceInput = document.getElementById('real-sale-price').value;
        const originChannelId = document.getElementById('origin-channel-id').value;
        const destChannelId = document.getElementById('dest-channel-id').value;
        const originChannelSelect = document.getElementById('origin-channel-select');
        const destChannelSelect = document.getElementById('dest-channel-select');
        
        const opportunity = {
            productName: document.getElementById('product-name').value,
            originChannel: originChannelSelect && originChannelSelect.selectedIndex >= 0 ? originChannelSelect.options[originChannelSelect.selectedIndex]?.text : '',
            originChannelId: originChannelId || null,
            originPrice: parseFloat(document.getElementById('origin-price').value),
            destChannel: destChannelSelect ? destChannelSelect.options[destChannelSelect.selectedIndex]?.text : '',
            destChannelId: destChannelId || null,
            destPrice: parseFloat(document.getElementById('dest-price').value),
            realSalePrice: realSalePriceInput ? parseFloat(realSalePriceInput) : null,
            costs: this.formCosts.filter(cost => cost.name && cost.name.trim().length > 0 && (cost.value || cost.value === 0)).map(cost => {
                const cleanCost = {
                    name: cost.name,
                    type: cost.type,
                    value: cost.value,
                    source: cost.source || 'manual'
                };
                if (cost.base) cleanCost.base = cost.base;
                delete cleanCost.channelName;
                return cleanCost;
            }),
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value
        };
        
        try {
            if (id) {
                await storage.update(id, opportunity);
            } else {
                await storage.add(opportunity);
            }
            
            this.showView('dashboard');
            this.refreshDashboard();
        } catch (error) {
            console.error('Error saving opportunity:', error);
            const errorMessage = error.message || 'Error desconocido';
            const errorDetails = error.details || error.hint || '';
            alert(`Error al guardar la oportunidad: ${errorMessage}${errorDetails ? '\n' + errorDetails : ''}`);
        }
    },
    
    
    addCost() {
        if (!this.formCosts) {
            this.formCosts = [];
        }
        this.formCosts.push({
            name: '',
            type: 'fixed',
            value: 0,
            base: null,
            source: 'manual'
        });
        ui.renderCostsList('costs-list');
        ui.updateFormCalculations();
    },
    
    addCostDetail() {
        if (!this.detailCosts) {
            this.detailCosts = [];
        }
        this.detailCosts.push({
            name: '',
            type: 'fixed',
            value: 0,
            base: 'purchase'
        });
        ui.renderCostsList('detail-costs-list');
        this.updateDetailCalculations();
    },
    
    removeCost(index) {
        if (this.formCosts && this.formCosts[index]) {
            this.formCosts.splice(index, 1);
            ui.renderCostsList('costs-list');
            ui.updateFormCalculations();
        }
    },
    
    removeCostDetail(index) {
        if (this.detailCosts && this.detailCosts[index]) {
            this.detailCosts.splice(index, 1);
            ui.renderCostsList('detail-costs-list');
            this.updateDetailCalculations();
        }
    },
    
    updateCostType(index, type) {
        if (this.formCosts && this.formCosts[index]) {
            const cost = this.formCosts[index];
            if (cost.source && (cost.source === 'channel_origin' || cost.source === 'channel_destination')) {
                cost.source = 'manual';
                delete cost.channelName;
            }
            cost.type = type;
            if (type === 'percentage' && !cost.base) {
                cost.base = 'purchase';
            }
            ui.renderCostsList('costs-list');
            ui.updateFormCalculations();
        }
    },
    
    updateCostField(index, field, value) {
        if (this.formCosts && this.formCosts[index]) {
            const cost = this.formCosts[index];
            if (cost.source && (cost.source === 'channel_origin' || cost.source === 'channel_destination')) {
                if (field !== 'name' || value !== cost.name) {
                    cost.source = 'manual';
                    delete cost.channelName;
                }
            }
            if (field === 'value') {
                cost[field] = parseFloat(value) || 0;
            } else {
                cost[field] = value;
            }
            ui.updateFormCalculations();
        }
    },
    
    updateDetailCostType(index, type) {
        if (this.detailCosts && this.detailCosts[index]) {
            this.detailCosts[index].type = type;
            if (type === 'percentage' && !this.detailCosts[index].base) {
                this.detailCosts[index].base = 'purchase';
            }
            ui.renderCostsList('detail-costs-list');
            this.updateDetailCalculations();
        }
    },
    
    updateDetailCostField(index, field, value) {
        if (this.detailCosts && this.detailCosts[index]) {
            if (field === 'value') {
                this.detailCosts[index][field] = parseFloat(value) || 0;
            } else {
                this.detailCosts[index][field] = value;
            }
            this.updateDetailCalculations();
        }
    },
    
    setupDetailForm() {
        const realSalePriceInput = document.getElementById('detail-real-sale-price');
        if (realSalePriceInput) {
            realSalePriceInput.addEventListener('input', () => {
                this.updateDetailCalculations();
            });
        }
    },
    
    async updateDetailCalculations() {
        if (!this.currentOpportunityId) return;
        
        const opportunity = await storage.getById(this.currentOpportunityId);
        if (!opportunity) return;
        
        const tempOpportunity = {
            originPrice: opportunity.originPrice,
            destPrice: opportunity.destPrice,
            costs: this.detailCosts || []
        };
        
        const realSalePriceInput = document.getElementById('detail-real-sale-price').value;
        const realSalePrice = realSalePriceInput ? parseFloat(realSalePriceInput) : null;
        
        tempOpportunity.realSalePrice = realSalePrice;
        
        const calc = arbitrage.calculate(tempOpportunity);
        ui.updateCostsBreakdown('detail-costs-breakdown-content', 'detail-costs-total', calc.estimated.costsBreakdown);
        
        document.getElementById('detail-costes-totales').textContent = arbitrage.formatCurrency(calc.estimated.totalCosts);
        document.getElementById('detail-margin-neto').textContent = arbitrage.formatCurrency(calc.estimated.netMargin);
        document.getElementById('detail-rentabilidad').textContent = arbitrage.formatPercent(calc.estimated.profitability);
        
        const netMarginEl = document.getElementById('detail-margin-neto');
        netMarginEl.className = netMarginEl.className.replace(/text-\w+-\d+/, '');
        netMarginEl.classList.add(calc.estimated.netMargin >= 0 ? 'text-green-600' : 'text-red-600');
        
        const rentEl = document.getElementById('detail-rentabilidad');
        rentEl.className = rentEl.className.replace(/text-\w+-\d+/, '');
        rentEl.classList.add(calc.estimated.profitability >= 0 ? 'text-purple-600' : 'text-red-600');
        
        const realSection = document.getElementById('detail-real-section');
        if (calc.real) {
            realSection.style.display = 'block';
            document.getElementById('detail-margin-neto-real').textContent = arbitrage.formatCurrency(calc.real.netMargin);
            document.getElementById('detail-rentabilidad-real').textContent = arbitrage.formatPercent(calc.real.profitability);
            document.getElementById('detail-diferencia').textContent = arbitrage.formatCurrency(calc.marginDifference);
            
            const diffEl = document.getElementById('detail-diferencia');
            diffEl.className = diffEl.className.replace(/text-\w+-\d+/, '');
            diffEl.classList.add(calc.marginDifference >= 0 ? 'text-green-600' : 'text-red-600');
            
            const precision = calc.estimated.netMargin !== 0 
                ? ((calc.real.netMargin / calc.estimated.netMargin) * 100).toFixed(1) + '%'
                : '-';
            document.getElementById('detail-precision').textContent = precision;
        } else {
            realSection.style.display = 'none';
        }
    },
    
    async editOpportunity(id) {
        try {
            const opportunity = await storage.getById(id);
            if (opportunity) {
                this.showView('new');
                await this.initializeOpportunityForm(true);
                const title = document.getElementById('form-title');
                if (title) {
                    title.textContent = 'Editar Oportunidad';
                }
                ui.renderForm(opportunity);
            }
        } catch (error) {
            console.error('Error loading opportunity:', error);
            alert('Error al cargar la oportunidad.');
        }
    },
    
    async showDetail(id) {
        try {
            const opportunity = await storage.getById(id);
            if (opportunity) {
                this.currentOpportunityId = id;
                ui.renderDetail(opportunity);
                this.setupDetailForm();
                this.showView('detail');
            }
        } catch (error) {
            console.error('Error loading opportunity:', error);
            alert('Error al cargar la oportunidad.');
        }
    },
    
    async saveDetail() {
        if (!this.currentOpportunityId) return;
        
        try {
            const opportunity = await storage.getById(this.currentOpportunityId);
            if (!opportunity) {
                alert('No se pudo cargar la oportunidad. Por favor, inténtalo de nuevo.');
                return;
            }
            
            const realSalePriceInput = document.getElementById('detail-real-sale-price');
            const statusInput = document.getElementById('detail-status');
            const notesInput = document.getElementById('detail-notes');
            
            const updates = {
                productName: opportunity.productName,
                originChannel: opportunity.originChannel,
                originChannelId: opportunity.originChannelId,
                originPrice: opportunity.originPrice,
                destChannel: opportunity.destChannel,
                destChannelId: opportunity.destChannelId,
                destPrice: opportunity.destPrice,
                status: statusInput ? statusInput.value : opportunity.status,
                realSalePrice: realSalePriceInput && realSalePriceInput.value ? parseFloat(realSalePriceInput.value) : (opportunity.realSalePrice || null),
                costs: this.detailCosts && this.detailCosts.length > 0 ? this.detailCosts.filter(cost => cost.name && (cost.value || cost.value === 0)) : opportunity.costs,
                notes: notesInput ? notesInput.value : opportunity.notes
            };
            
            await storage.update(this.currentOpportunityId, updates);
            this.showView('dashboard');
        } catch (error) {
            console.error('Error saving detail:', error);
            alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.');
        }
    },
    
    async deleteOpportunity() {
        if (!this.currentOpportunityId) return;
        
        if (confirm('¿Estás seguro de que quieres eliminar esta oportunidad?')) {
            try {
                const success = await storage.delete(this.currentOpportunityId);
                if (success) {
                    this.showView('dashboard');
                } else {
                    alert('Error al eliminar la oportunidad.');
                }
            } catch (error) {
                console.error('Error deleting opportunity:', error);
                alert('Error al eliminar la oportunidad.');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
