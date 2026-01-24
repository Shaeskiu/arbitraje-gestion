const app = {
    currentOpportunityId: null,
    currentVentaId: null,
    currentVentaDetail: null,
    formCosts: [],
    detailCosts: [],
    ventaCompraCosts: [],
    ventaVentaCosts: [],
    channelOriginCosts: [],
    channelDestCosts: [],
    allChannels: [],
    salesChartInstance: null,
    marginsChartInstance: null,
    
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
        
        ['origin-price', 'dest-price'].forEach(id => {
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
        } else if (viewName === 'compras') {
            this.refreshCompras();
        } else if (viewName === 'stock') {
            this.refreshStock();
        } else if (viewName === 'ventas') {
            this.refreshVentas();
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
        
        // Clear container and create canvas
        container.innerHTML = '<canvas id="sales-chart"></canvas>';
        const canvas = document.getElementById('sales-chart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.salesChartInstance) {
            this.salesChartInstance.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const labels = data.map(item => item.period || 'N/A');
        const amounts = data.map(item => parseFloat(item.amount || 0));
        
        this.salesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ventas (€)',
                    data: amounts,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(99, 102, 241)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return 'Ventas: €' + parseFloat(context.parsed.y).toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '€' + parseFloat(value).toFixed(2);
                            }
                        },
                        title: {
                            display: true,
                            text: 'Monto (€)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Período'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },
    
    renderMarginsChart(data) {
        const container = document.getElementById('margins-chart-container');
        if (!container) return;
        
        if (!data || !data.length) {
            container.innerHTML = '<p class="text-gray-500">No hay datos de márgenes disponibles</p>';
            return;
        }
        
        // Clear container and create canvas
        container.innerHTML = '<canvas id="margins-chart"></canvas>';
        const canvas = document.getElementById('margins-chart');
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.marginsChartInstance) {
            this.marginsChartInstance.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const labels = data.map(item => item.month || 'N/A');
        const grossMargins = data.map(item => parseFloat(item.gross_margin_percent || 0));
        const netMargins = data.map(item => parseFloat(item.net_margin_percent || 0));
        
        this.marginsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Margen Bruto (%)',
                        data: grossMargins,
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: 'rgb(34, 197, 94)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Margen Neto (%)',
                        data: netMargins,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: 'rgb(59, 130, 246)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = parseFloat(context.parsed.y);
                                const sign = value >= 0 ? '+' : '';
                                return context.dataset.label + ': ' + sign + value.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                const sign = value >= 0 ? '+' : '';
                                return sign + parseFloat(value).toFixed(2) + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Margen (%)'
                        },
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 0) {
                                    return 'rgba(0, 0, 0, 0.3)';
                                }
                                return 'rgba(0, 0, 0, 0.1)';
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Mes'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },
    
    async saveOpportunity() {
        const id = document.getElementById('opportunity-id').value;
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
            offerLink: document.getElementById('offer-link')?.value?.trim() || null,
            marketPriceLink: document.getElementById('market-price-link')?.value?.trim() || null,
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
        // Añadir event listeners para recalcular métricas en tiempo real
        const originPriceInput = document.getElementById('detail-origin-price');
        const destPriceInput = document.getElementById('detail-dest-price');
        const originChannelSelect = document.getElementById('detail-origin-channel-select');
        const destChannelSelect = document.getElementById('detail-dest-channel-select');
        
        // Remover listeners anteriores si existen
        if (this.detailOriginPriceListener) {
            originPriceInput?.removeEventListener('input', this.detailOriginPriceListener);
        }
        if (this.detailDestPriceListener) {
            destPriceInput?.removeEventListener('input', this.detailDestPriceListener);
        }
        if (this.detailOriginChannelListener) {
            originChannelSelect?.removeEventListener('change', this.detailOriginChannelListener);
        }
        if (this.detailDestChannelListener) {
            destChannelSelect?.removeEventListener('change', this.detailDestChannelListener);
        }
        
        // Crear nuevos listeners
        this.detailOriginPriceListener = () => {
            this.updateDetailCalculations();
        };
        this.detailDestPriceListener = () => {
            this.updateDetailCalculations();
        };
        this.detailOriginChannelListener = () => {
            const select = document.getElementById('detail-origin-channel-select');
            const hiddenInput = document.getElementById('detail-origin-channel-id');
            if (select && hiddenInput) {
                hiddenInput.value = select.value;
            }
            this.updateDetailCalculations();
        };
        this.detailDestChannelListener = () => {
            const select = document.getElementById('detail-dest-channel-select');
            const hiddenInput = document.getElementById('detail-dest-channel-id');
            if (select && hiddenInput) {
                hiddenInput.value = select.value;
            }
            this.updateDetailCalculations();
        };
        
        // Añadir listeners
        originPriceInput?.addEventListener('input', this.detailOriginPriceListener);
        destPriceInput?.addEventListener('input', this.detailDestPriceListener);
        originChannelSelect?.addEventListener('change', this.detailOriginChannelListener);
        destChannelSelect?.addEventListener('change', this.detailDestChannelListener);
    },
    
    async updateDetailCalculations() {
        if (!this.currentOpportunityId) return;
        
        // Leer valores de los inputs en lugar de solo de la oportunidad
        const originPriceInput = document.getElementById('detail-origin-price');
        const destPriceInput = document.getElementById('detail-dest-price');
        
        const originPrice = originPriceInput ? parseFloat(originPriceInput.value) || 0 : 0;
        const destPrice = destPriceInput ? parseFloat(destPriceInput.value) || 0 : 0;
        
        const tempOpportunity = {
            originPrice: originPrice,
            destPrice: destPrice,
            costs: this.detailCosts || []
        };
        
        const calc = arbitrage.calculate(tempOpportunity);
        ui.updateCostsBreakdown('detail-costs-breakdown-content', 'detail-costs-total', calc.estimated.costsBreakdown);
        
        // Actualizar margen bruto
        const grossMargin = destPrice - originPrice;
        document.getElementById('detail-margin-bruto').textContent = arbitrage.formatCurrency(grossMargin);
        document.getElementById('detail-costes-totales').textContent = arbitrage.formatCurrency(calc.estimated.totalCosts);
        document.getElementById('detail-margin-neto').textContent = arbitrage.formatCurrency(calc.estimated.netMargin);
        document.getElementById('detail-rentabilidad').textContent = arbitrage.formatPercent(calc.estimated.profitability);
        
        const netMarginEl = document.getElementById('detail-margin-neto');
        netMarginEl.className = netMarginEl.className.replace(/text-\w+-\d+/, '');
        netMarginEl.classList.add(calc.estimated.netMargin >= 0 ? 'text-green-600' : 'text-red-600');
        
        const rentEl = document.getElementById('detail-rentabilidad');
        rentEl.className = rentEl.className.replace(/text-\w+-\d+/, '');
        rentEl.classList.add(calc.estimated.profitability >= 0 ? 'text-purple-600' : 'text-red-600');
        
        // Las métricas reales solo se muestran si hay datos reales guardados
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
            // Cargar canales antes de mostrar el detalle
            if (!this.allChannels || this.allChannels.length === 0) {
                await this.loadChannels();
            }
            
            const opportunity = await storage.getById(id);
            if (!opportunity) {
                alert('No se pudo cargar la oportunidad. Puede que no exista o haya un error de conexión.');
                return;
            }
            
            this.currentOpportunityId = id;
            
            // Cambiar a la vista primero para que los elementos del DOM existan
            this.showView('detail');
            
            // Esperar un momento para que el DOM se renderice
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Poblar selects de canales en el detalle
            if (this.allChannels && this.allChannels.length > 0) {
                ui.populateDetailChannelSelects(this.allChannels);
            }
            
            ui.renderDetail(opportunity);
            this.setupDetailForm();
        } catch (error) {
            console.error('Error loading opportunity:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                id: id
            });
            alert(`Error al cargar la oportunidad: ${error.message || 'Error desconocido'}`);
        }
    },
    
    async saveDetail() {
        if (!this.currentOpportunityId) return;
        
        try {
            // Leer todos los campos editables
            const productNameInput = document.getElementById('detail-product-name');
            const originChannelSelect = document.getElementById('detail-origin-channel-select');
            const originChannelIdInput = document.getElementById('detail-origin-channel-id');
            const originPriceInput = document.getElementById('detail-origin-price');
            const destChannelSelect = document.getElementById('detail-dest-channel-select');
            const destChannelIdInput = document.getElementById('detail-dest-channel-id');
            const destPriceInput = document.getElementById('detail-dest-price');
            const offerLinkInput = document.getElementById('detail-offer-link');
            const marketPriceLinkInput = document.getElementById('detail-market-price-link');
            const statusInput = document.getElementById('detail-status');
            const notesInput = document.getElementById('detail-notes');
            
            // Validar campos obligatorios
            const productName = productNameInput ? productNameInput.value.trim() : '';
            const originPrice = originPriceInput ? parseFloat(originPriceInput.value) : 0;
            const destPrice = destPriceInput ? parseFloat(destPriceInput.value) : 0;
            
            if (!productName) {
                alert('El nombre del producto es obligatorio');
                return;
            }
            
            if (isNaN(originPrice) || originPrice < 0) {
                alert('El precio de compra debe ser un número válido mayor o igual a 0');
                return;
            }
            
            if (isNaN(destPrice) || destPrice < 0) {
                alert('El precio de venta estimado debe ser un número válido mayor o igual a 0');
                return;
            }
            
            // Obtener nombres de canales si están seleccionados
            let originChannel = '';
            let destChannel = '';
            const originChannelId = originChannelSelect ? originChannelSelect.value : '';
            const destChannelId = destChannelSelect ? destChannelSelect.value : '';
            
            if (originChannelId && this.allChannels && this.allChannels.length > 0) {
                const originChannelObj = this.allChannels.find(c => c.id === originChannelId);
                if (originChannelObj) {
                    originChannel = originChannelObj.name;
                }
            }
            
            if (destChannelId && this.allChannels && this.allChannels.length > 0) {
                const destChannelObj = this.allChannels.find(c => c.id === destChannelId);
                if (destChannelObj) {
                    destChannel = destChannelObj.name;
                }
            }
            
            // Preparar actualizaciones
            const updates = {
                productName: productName,
                originChannel: originChannel,
                originChannelId: originChannelId || null,
                originPrice: originPrice,
                destChannel: destChannel,
                destChannelId: destChannelId || null,
                destPrice: destPrice,
                offerLink: offerLinkInput ? offerLinkInput.value.trim() || null : null,
                marketPriceLink: marketPriceLinkInput ? marketPriceLinkInput.value.trim() || null : null,
                status: statusInput ? statusInput.value : 'detectada',
                costs: this.detailCosts && this.detailCosts.length > 0 
                    ? this.detailCosts.filter(cost => cost.name && cost.name.trim().length > 0 && (cost.value || cost.value === 0)).map(cost => {
                        const cleanCost = {
                            name: cost.name.trim(),
                            type: cost.type,
                            value: parseFloat(cost.value) || 0,
                            source: cost.source || 'manual'
                        };
                        if (cost.base) cleanCost.base = cost.base;
                        return cleanCost;
                    })
                    : [],
                notes: notesInput ? notesInput.value.trim() : ''
            };
            
            await storage.update(this.currentOpportunityId, updates);
            this.showView('opportunities');
            this.refreshOpportunities();
        } catch (error) {
            console.error('Error saving detail:', error);
            const errorMessage = error.message || 'Error desconocido';
            const errorDetails = error.details || error.hint || '';
            alert(`Error al guardar los cambios: ${errorMessage}${errorDetails ? '\n' + errorDetails : ''}`);
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
    
    async refreshCompras() {
        try {
            const compras = await comprasStorage.getAll();
            ui.renderCompras(compras);
        } catch (error) {
            console.error('Error refreshing compras:', error);
            alert('Error al cargar las compras.');
        }
    },
    
    async refreshVentas() {
        try {
            const ventas = await ventasStorage.getAll();
            ui.renderVentas(ventas);
        } catch (error) {
            console.error('Error refreshing ventas:', error);
            alert('Error al cargar las ventas.');
        }
    },

    async showVentaDetail(id) {
        try {
            const detail = await ventasStorage.getById(id);
            if (!detail || !detail.venta) {
                alert('No se pudo cargar la venta. Por favor, inténtalo de nuevo.');
                return;
            }

            this.currentVentaId = id;
            this.currentVentaDetail = detail;

            // Normalizar costes de compra y de venta
            const compra = detail.compra || {};
            const venta = detail.venta;

            this.ventaCompraCosts = Array.isArray(compra.costes_compra)
                ? compra.costes_compra.map(c => ({
                    name: c.name || '',
                    value: c.value !== undefined && c.value !== null ? parseFloat(c.value) : 0
                }))
                : [];

            this.ventaVentaCosts = Array.isArray(venta.costes_venta)
                ? venta.costes_venta.map(c => ({
                    name: c.name || '',
                    value: c.value !== undefined && c.value !== null ? parseFloat(c.value) : 0
                }))
                : [];

            ui.renderVentaDetail(detail, this.ventaCompraCosts, this.ventaVentaCosts);
            this.updateVentaDetailCalculations();
            this.showView('venta-detail');
        } catch (error) {
            console.error('Error loading venta detail:', error);
            alert('Error al cargar la venta.');
        }
    },

    addVentaCost(role) {
        if (role === 'compra') {
            if (!this.ventaCompraCosts) this.ventaCompraCosts = [];
            this.ventaCompraCosts.push({ name: '', value: 0 });
        } else {
            if (!this.ventaVentaCosts) this.ventaVentaCosts = [];
            this.ventaVentaCosts.push({ name: '', value: 0 });
        }

        if (this.currentVentaDetail) {
            ui.renderVentaDetail(this.currentVentaDetail, this.ventaCompraCosts, this.ventaVentaCosts);
            this.updateVentaDetailCalculations();
        }
    },

    removeVentaCost(role, index) {
        const arr = role === 'compra' ? this.ventaCompraCosts : this.ventaVentaCosts;
        if (arr && arr[index]) {
            arr.splice(index, 1);
            if (this.currentVentaDetail) {
                ui.renderVentaDetail(this.currentVentaDetail, this.ventaCompraCosts, this.ventaVentaCosts);
                this.updateVentaDetailCalculations();
            }
        }
    },

    updateVentaCostField(role, index, field, value) {
        const arr = role === 'compra' ? this.ventaCompraCosts : this.ventaVentaCosts;
        if (!arr || !arr[index]) return;

        if (field === 'value') {
            arr[index].value = parseFloat(value) || 0;
        } else {
            arr[index][field] = value;
        }

        this.updateVentaDetailCalculations();
    },

    updateVentaDetailCalculations() {
        if (!this.currentVentaDetail || !this.currentVentaDetail.venta) return;

        const venta = this.currentVentaDetail.venta;
        const compra = this.currentVentaDetail.compra || null;

        const unidades = parseInt(venta.unidades) || 0;
        const precioUnitarioVenta = venta.precio_unitario ? parseFloat(venta.precio_unitario) : 0;

        let precioUnitarioCompra = 0;
        let unidadesCompra = unidades;

        if (compra) {
            if (compra.precio_unitario !== undefined && compra.precio_unitario !== null) {
                precioUnitarioCompra = parseFloat(compra.precio_unitario) || 0;
            }
            if (compra.unidades !== undefined && compra.unidades !== null) {
                unidadesCompra = parseInt(compra.unidades) || unidadesCompra;
            }
        }

        const costesCompra = (this.ventaCompraCosts || []).reduce((sum, c) => {
            return sum + (parseFloat(c.value) || 0);
        }, 0);

        const costesVenta = (this.ventaVentaCosts || []).reduce((sum, c) => {
            return sum + (parseFloat(c.value) || 0);
        }, 0);

        const totalCompra = (precioUnitarioCompra * unidadesCompra) + costesCompra;
        const costeProporcional = unidadesCompra > 0 ? (totalCompra / unidadesCompra) * unidades : 0;

        const ingresosBrutos = precioUnitarioVenta * unidades;

        const totalCostesVenta = costesVenta;
        const totalCostes = costeProporcional + totalCostesVenta;

        const margenNeto = ingresosBrutos - totalCostes;
        const rentabilidad = costeProporcional > 0 ? (margenNeto / costeProporcional) * 100 : 0;

        const totalCompraEl = document.getElementById('venta-detail-total-compra');
        const totalVentaBrutaEl = document.getElementById('venta-detail-total-venta-bruta');
        const totalCostesCompraEl = document.getElementById('venta-detail-total-costes-compra');
        const totalCostesVentaEl = document.getElementById('venta-detail-total-costes-venta');
        const margenNetoEl = document.getElementById('venta-detail-margin-neto');
        const rentabilidadEl = document.getElementById('venta-detail-rentabilidad');

        if (totalCompraEl) totalCompraEl.textContent = arbitrage.formatCurrency(costeProporcional);
        if (totalVentaBrutaEl) totalVentaBrutaEl.textContent = arbitrage.formatCurrency(ingresosBrutos);
        if (totalCostesCompraEl) totalCostesCompraEl.textContent = arbitrage.formatCurrency(costeProporcional);
        if (totalCostesVentaEl) totalCostesVentaEl.textContent = arbitrage.formatCurrency(totalCostesVenta);
        if (margenNetoEl) {
            margenNetoEl.textContent = arbitrage.formatCurrency(margenNeto);
            margenNetoEl.className = margenNetoEl.className.replace(/text-\w+-\d+/, '');
            margenNetoEl.classList.add(margenNeto >= 0 ? 'text-green-600' : 'text-red-600');
        }
        if (rentabilidadEl) {
            rentabilidadEl.textContent = arbitrage.formatPercent(rentabilidad);
            rentabilidadEl.className = rentabilidadEl.className.replace(/text-\w+-\d+/, '');
            rentabilidadEl.classList.add(rentabilidad >= 0 ? 'text-green-600' : 'text-red-600');
        }
    },

    async saveVentaDetail() {
        if (!this.currentVentaDetail || !this.currentVentaDetail.venta) {
            return;
        }

        const detail = this.currentVentaDetail;
        const compra = detail.compra;
        const venta = detail.venta;

        try {
            // Actualizar compra si existe
            if (compra && compra.id) {
                const cleanCompraCosts = (this.ventaCompraCosts || [])
                    .filter(c => c.name && c.name.trim().length > 0 && (c.value || c.value === 0))
                    .map(c => ({
                        name: c.name,
                        value: parseFloat(c.value) || 0
                    }));

                await comprasStorage.update(compra.id, {
                    costes_compra: cleanCompraCosts
                });
            }

            // Actualizar venta
            const cleanVentaCosts = (this.ventaVentaCosts || [])
                .filter(c => c.name && c.name.trim().length > 0 && (c.value || c.value === 0))
                .map(c => ({
                    name: c.name,
                    value: parseFloat(c.value) || 0
                }));

            await ventasStorage.update(venta.id, {
                costes_venta: cleanVentaCosts
            });

            alert('Cambios de la venta guardados correctamente.');
            this.showView('ventas');
            this.refreshVentas();
            this.refreshBusinessDashboard();
        } catch (error) {
            console.error('Error saving venta detail:', error);
            alert('Error al guardar los cambios de la venta. Por favor, inténtalo de nuevo.');
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
