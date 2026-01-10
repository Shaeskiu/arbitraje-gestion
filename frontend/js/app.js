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
        
        const compraForm = document.getElementById('compra-form');
        if (compraForm) {
            compraForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registrarCompra();
            });
        }
        
        const ventaForm = document.getElementById('venta-form');
        if (ventaForm) {
            ventaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.registrarVenta();
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
        const filterStatus = document.getElementById('filter-status');
        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.refreshOpportunities();
            });
        }
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.refreshOpportunities();
            });
        }
        
        // Dashboard filters
        const salesGrouping = document.getElementById('sales-grouping');
        if (salesGrouping) {
            salesGrouping.addEventListener('change', () => {
                this.loadSalesChart();
            });
        }
        
        const salesDateRange = document.getElementById('sales-date-range');
        if (salesDateRange) {
            salesDateRange.addEventListener('change', (e) => {
                const customRange = document.getElementById('sales-custom-range');
                if (customRange) {
                    customRange.classList.toggle('hidden', e.target.value !== 'custom');
                }
                if (e.target.value !== 'custom') {
                    this.loadSalesChart();
                }
            });
        }
        
        const marginsDateRange = document.getElementById('margins-date-range');
        if (marginsDateRange) {
            marginsDateRange.addEventListener('change', (e) => {
                const customRange = document.getElementById('margins-custom-range');
                if (customRange) {
                    customRange.classList.toggle('hidden', e.target.value !== 'custom');
                }
                if (e.target.value !== 'custom') {
                    this.loadMarginsChart();
                }
            });
        }
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
            this.refreshBusinessDashboard();
        } else if (viewName === 'opportunities') {
            this.refreshOpportunities();
        } else if (viewName === 'stock') {
            this.refreshStock();
        } else if (viewName === 'channels') {
            this.refreshChannels();
        } else if (viewName === 'new') {
            this.initializeOpportunityForm();
        } else if (viewName === 'channel-form') {
            this.initializeChannelForm();
        } else if (viewName === 'stock') {
            this.refreshStock();
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
    
    async refreshOpportunities() {
        try {
            const opportunities = await storage.getAll();
            const filterStatus = document.getElementById('filter-status')?.value || '';
            const searchTerm = document.getElementById('search-input')?.value || '';
            
            ui.renderOpportunities(opportunities, filterStatus, searchTerm);
        } catch (error) {
            console.error('Error refreshing opportunities:', error);
            alert('Error al cargar las oportunidades. Por favor, recarga la página.');
        }
    },
    
    async refreshBusinessDashboard() {
        try {
            await Promise.all([
                this.loadImmobilizedCapital(),
                this.loadSalesChart(),
                this.loadMarginsChart()
            ]);
        } catch (error) {
            console.error('Error refreshing business dashboard:', error);
            alert('Error al cargar el dashboard. Por favor, recarga la página.');
        }
    },
    
    async loadImmobilizedCapital() {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/dashboard/immobilized-capital`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const element = document.getElementById('dashboard-immobilized-capital');
            if (element) {
                element.textContent = `€${parseFloat(data.value || 0).toFixed(2)}`;
            }
        } catch (error) {
            console.error('Error loading immobilized capital:', error);
            const element = document.getElementById('dashboard-immobilized-capital');
            if (element) {
                element.textContent = '€0.00';
            }
        }
    },
    
    async loadSalesChart() {
        try {
            const grouping = document.getElementById('sales-grouping')?.value || 'month';
            const dateRange = document.getElementById('sales-date-range')?.value || 'last-6-months';
            let url = `${window.APP_CONFIG.API_BASE_URL}/dashboard/sales-over-time?grouping=${grouping}&range=${dateRange}`;
            
            if (dateRange === 'custom') {
                const startDate = document.getElementById('sales-start-date')?.value;
                const endDate = document.getElementById('sales-end-date')?.value;
                if (startDate && endDate) {
                    url += `&start_date=${startDate}&end_date=${endDate}`;
                }
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            this.renderSalesChart(data);
        } catch (error) {
            console.error('Error loading sales chart:', error);
            const container = document.getElementById('sales-chart-container');
            if (container) {
                container.innerHTML = '<p class="text-red-500">Error al cargar los datos de ventas</p>';
            }
        }
    },
    
    async loadMarginsChart() {
        try {
            const dateRange = document.getElementById('margins-date-range')?.value || 'last-6-months';
            let url = `${window.APP_CONFIG.API_BASE_URL}/dashboard/margins?range=${dateRange}`;
            
            if (dateRange === 'custom') {
                const startDate = document.getElementById('margins-start-date')?.value;
                const endDate = document.getElementById('margins-end-date')?.value;
                if (startDate && endDate) {
                    url += `&start_date=${startDate}&end_date=${endDate}`;
                }
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            this.renderMarginsChart(data);
        } catch (error) {
            console.error('Error loading margins chart:', error);
            const container = document.getElementById('margins-chart-container');
            if (container) {
                container.innerHTML = '<p class="text-red-500">Error al cargar los datos de márgenes</p>';
            }
        }
    },
    
    renderSalesChart(data) {
        const container = document.getElementById('sales-chart-container');
        if (!container) return;
        
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500">No hay datos de ventas disponibles</p>';
            return;
        }
        
        // Simple table-based visualization
        const maxValue = Math.max(...data.map(d => d.amount || 0));
        const rows = data.map(item => {
            const barWidth = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
            return `
                <tr class="border-b">
                    <td class="px-4 py-2 text-sm text-gray-700">${item.period || 'N/A'}</td>
                    <td class="px-4 py-2">
                        <div class="w-full bg-gray-200 rounded-full h-6">
                            <div class="bg-indigo-600 h-6 rounded-full" style="width: ${barWidth}%"></div>
                        </div>
                    </td>
                    <td class="px-4 py-2 text-sm font-medium text-gray-900 text-right">€${parseFloat(item.amount || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="w-full overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ventas</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    },
    
    renderMarginsChart(data) {
        const container = document.getElementById('margins-chart-container');
        if (!container) return;
        
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500">No hay datos de márgenes disponibles</p>';
            return;
        }
        
        const maxValue = Math.max(...data.map(d => Math.max(d.gross_margin || 0, d.net_margin || 0)));
        const rows = data.map(item => {
            const grossWidth = maxValue > 0 ? (Math.abs(item.gross_margin || 0) / maxValue) * 100 : 0;
            const netWidth = maxValue > 0 ? (Math.abs(item.net_margin || 0) / maxValue) * 100 : 0;
            const grossColor = (item.gross_margin || 0) >= 0 ? 'bg-green-600' : 'bg-red-600';
            const netColor = (item.net_margin || 0) >= 0 ? 'bg-blue-600' : 'bg-red-600';
            
            return `
                <tr class="border-b">
                    <td class="px-4 py-2 text-sm text-gray-700">${item.month || 'N/A'}</td>
                    <td class="px-4 py-2">
                        <div class="mb-1">
                            <div class="text-xs text-gray-600 mb-1">Margen Bruto</div>
                            <div class="w-full bg-gray-200 rounded-full h-4">
                                <div class="${grossColor} h-4 rounded-full" style="width: ${grossWidth}%"></div>
                            </div>
                            <div class="text-xs font-medium ${(item.gross_margin || 0) >= 0 ? 'text-green-700' : 'text-red-700'} mt-1">€${parseFloat(item.gross_margin || 0).toFixed(2)}</div>
                        </div>
                        <div>
                            <div class="text-xs text-gray-600 mb-1">Margen Neto</div>
                            <div class="w-full bg-gray-200 rounded-full h-4">
                                <div class="${netColor} h-4 rounded-full" style="width: ${netWidth}%"></div>
                            </div>
                            <div class="text-xs font-medium ${(item.net_margin || 0) >= 0 ? 'text-blue-700' : 'text-red-700'} mt-1">€${parseFloat(item.net_margin || 0).toFixed(2)}</div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="w-full overflow-x-auto">
                <table class="min-w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Márgenes</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
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
            
            this.showView('opportunities');
            this.refreshOpportunities();
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
            this.showView('opportunities');
            this.refreshOpportunities();
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
                    this.showView('opportunities');
                    this.refreshOpportunities();
                } else {
                    alert('Error al eliminar la oportunidad.');
                }
            } catch (error) {
                console.error('Error deleting opportunity:', error);
                alert('Error al eliminar la oportunidad.');
            }
        }
    },
    
    async openCompraModal(opportunityId, canalOrigenId, estimatedPrice, productName = null) {
        const modal = document.getElementById('compra-modal');
        const opportunityIdInput = document.getElementById('compra-opportunity-id');
        const canalOrigenIdInput = document.getElementById('compra-canal-origen-id');
        const productNameInput = document.getElementById('compra-product-name');
        const productNameDisplay = document.getElementById('compra-product-name-display');
        const precioUnitarioInput = document.getElementById('compra-precio-unitario');
        const unidadesInput = document.getElementById('compra-unidades');
        const fechaInput = document.getElementById('compra-fecha');
        
        if (!modal || !opportunityIdInput || !canalOrigenIdInput || !productNameInput || !productNameDisplay || !precioUnitarioInput || !unidadesInput || !fechaInput) {
            console.error('Compra modal elements not found');
            return;
        }
        
        let finalProductName = productName;
        
        // Si viene de una oportunidad, obtener el productName de la oportunidad
        if (opportunityId && !productName) {
            try {
                const opportunity = await storage.getById(opportunityId);
                if (opportunity && opportunity.productName) {
                    finalProductName = opportunity.productName;
                }
            } catch (error) {
                console.error('Error loading opportunity:', error);
            }
        }
        
        opportunityIdInput.value = opportunityId || '';
        canalOrigenIdInput.value = canalOrigenId || '';
        productNameInput.value = finalProductName || '';
        productNameDisplay.value = finalProductName || '';
        precioUnitarioInput.value = estimatedPrice || '';
        unidadesInput.value = 1;
        fechaInput.value = new Date().toISOString().split('T')[0];
        modal.classList.remove('hidden');
    },
    
    closeCompraModal() {
        const modal = document.getElementById('compra-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const form = document.getElementById('compra-form');
        if (form) {
            form.reset();
        }
    },
    
    closeCompraModalOnOverlay(event) {
        if (event.target.id === 'compra-modal') {
            this.closeCompraModal();
        }
    },
    
    async registrarCompra() {
        const opportunityId = document.getElementById('compra-opportunity-id').value;
        const canalOrigenId = document.getElementById('compra-canal-origen-id').value;
        const productName = document.getElementById('compra-product-name').value;
        const precioUnitario = document.getElementById('compra-precio-unitario').value;
        const unidades = document.getElementById('compra-unidades').value;
        const fecha = document.getElementById('compra-fecha').value;
        
        if (!canalOrigenId) {
            alert('El canal de origen es obligatorio');
            return;
        }
        
        if (!productName || !productName.trim()) {
            alert('El nombre del producto es obligatorio');
            return;
        }
        
        if (!precioUnitario || parseFloat(precioUnitario) < 0) {
            alert('El precio unitario debe ser mayor o igual a 0');
            return;
        }
        
        if (!unidades || parseInt(unidades) <= 0) {
            alert('Las unidades deben ser mayor a 0');
            return;
        }
        
        if (!fecha) {
            alert('La fecha de compra es obligatoria');
            return;
        }
        
        try {
            await comprasStorage.createFromOpportunity(
                opportunityId || null,
                canalOrigenId,
                productName.trim(),
                precioUnitario,
                unidades,
                [],
                fecha
            );
            this.closeCompraModal();
            await this.loadChannels();
            if (opportunityId) {
                this.refreshOpportunities();
            }
            this.refreshStock();
            this.refreshBusinessDashboard();
            alert('Compra registrada exitosamente. El stock ha sido creado automáticamente.');
        } catch (error) {
            console.error('Error registrando compra:', error);
            alert('Error al registrar la compra: ' + (error.message || 'Error desconocido'));
        }
    },
    
    async openVentaModal(stockId, unidadesDisponibles, estimatedPrice = null) {
        const modal = document.getElementById('venta-modal');
        const stockIdInput = document.getElementById('venta-stock-id');
        const canalDestinoSelect = document.getElementById('venta-canal-destino');
        const precioUnitarioInput = document.getElementById('venta-precio-unitario');
        const unidadesInput = document.getElementById('venta-unidades');
        const unidadesMaxSpan = document.getElementById('venta-unidades-max');
        const fechaInput = document.getElementById('venta-fecha');
        
        if (!modal || !stockIdInput || !canalDestinoSelect || !precioUnitarioInput || !unidadesInput || !fechaInput) {
            console.error('Venta modal elements not found');
            return;
        }
        
        stockIdInput.value = stockId;
        unidadesMaxSpan.textContent = unidadesDisponibles;
        unidadesInput.max = unidadesDisponibles;
        unidadesInput.value = Math.min(1, unidadesDisponibles);
        precioUnitarioInput.value = estimatedPrice || '';
        fechaInput.value = new Date().toISOString().split('T')[0];
        
        // Cargar canales en el select
        await this.loadChannels();
        if (this.allChannels && this.allChannels.length > 0) {
            canalDestinoSelect.innerHTML = '<option value="">Selecciona un canal</option>' + 
                this.allChannels.map(ch => `<option value="${ch.id}">${ui.escapeHtml(ch.name)}</option>`).join('');
        }
        
        modal.classList.remove('hidden');
    },
    
    closeVentaModal() {
        const modal = document.getElementById('venta-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const form = document.getElementById('venta-form');
        if (form) {
            form.reset();
        }
    },
    
    closeVentaModalOnOverlay(event) {
        if (event.target.id === 'venta-modal') {
            this.closeVentaModal();
        }
    },
    
    async registrarVenta() {
        const stockId = document.getElementById('venta-stock-id').value;
        const canalDestinoId = document.getElementById('venta-canal-destino').value;
        const precioUnitario = document.getElementById('venta-precio-unitario').value;
        const unidades = document.getElementById('venta-unidades').value;
        const fecha = document.getElementById('venta-fecha').value;
        const unidadesMax = parseInt(document.getElementById('venta-unidades-max').textContent);
        
        if (!stockId) {
            alert('Error: ID de stock no válido');
            return;
        }
        
        if (!canalDestinoId) {
            alert('El canal de destino es obligatorio');
            return;
        }
        
        if (!precioUnitario || parseFloat(precioUnitario) < 0) {
            alert('El precio unitario debe ser mayor o igual a 0');
            return;
        }
        
        if (!unidades || parseInt(unidades) <= 0) {
            alert('Las unidades deben ser mayor a 0');
            return;
        }
        
        if (parseInt(unidades) > unidadesMax) {
            alert(`No puedes vender más unidades de las disponibles (${unidadesMax})`);
            return;
        }
        
        if (!fecha) {
            alert('La fecha de venta es obligatoria');
            return;
        }
        
        try {
            await ventasStorage.create(
                stockId,
                canalDestinoId,
                precioUnitario,
                unidades,
                [],
                fecha
            );
            this.closeVentaModal();
            this.refreshStock();
            this.refreshBusinessDashboard();
            alert('Venta registrada exitosamente. El stock ha sido actualizado automáticamente.');
        } catch (error) {
            console.error('Error registrando venta:', error);
            alert('Error al registrar la venta: ' + (error.message || 'Error desconocido'));
        }
    },
    
    async refreshStock() {
        try {
            const stockItems = await stockStorage.getAll();
            ui.renderStock(stockItems);
        } catch (error) {
            console.error('Error refreshing stock:', error);
            alert('Error al cargar el stock.');
        }
    },
    
    async deleteStock(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este item de stock?')) {
            return;
        }
        
        try {
            if (!id || typeof id !== 'string') {
                alert('ID de stock inválido');
                return;
            }
            
            await stockStorage.delete(id);
            this.refreshStock();
        } catch (error) {
            console.error('Error deleting stock:', error);
            alert('Error al eliminar el item de stock: ' + (error.message || 'Error desconocido'));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
