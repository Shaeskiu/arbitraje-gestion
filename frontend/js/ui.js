const ui = {
    renderDashboard(opportunities, filterStatus = '', searchTerm = '') {
        let filtered = opportunities;
        
        if (filterStatus) {
            filtered = filtered.filter(o => o.status === filterStatus);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o => 
                o.productName.toLowerCase().includes(term) ||
                o.originChannel.toLowerCase().includes(term) ||
                o.destChannel.toLowerCase().includes(term)
            );
        }
        
        const tbody = document.getElementById('opportunities-table');
        tbody.innerHTML = '';
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No hay oportunidades</td></tr>';
            return;
        }
        
        filtered.forEach(opportunity => {
            const calc = arbitrage.calculate(opportunity);
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const realSalePriceHtml = opportunity.realSalePrice 
                ? `<div class="text-sm text-green-600">Venta Real: ${arbitrage.formatCurrency(opportunity.realSalePrice)}</div>` 
                : '';
            
            const marginHtml = calc.real 
                ? `${arbitrage.formatCurrency(calc.estimated.netMargin)} <span class="text-xs text-gray-500">(${arbitrage.formatCurrency(calc.real.netMargin)} real)</span>`
                : arbitrage.formatCurrency(calc.estimated.netMargin);
            
            const profitabilityHtml = calc.real
                ? `${arbitrage.formatPercent(calc.estimated.profitability)} <span class="text-xs text-gray-500">(${arbitrage.formatPercent(calc.real.profitability)} real)</span>`
                : arbitrage.formatPercent(calc.estimated.profitability);
            
            const originChannelName = opportunity.originChannel || 'N/A';
            const destChannelName = opportunity.destChannel || 'N/A';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(opportunity.productName)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(originChannelName)}</div>
                    <div class="text-sm text-gray-500">→ ${this.escapeHtml(destChannelName)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">Compra: ${arbitrage.formatCurrency(opportunity.originPrice)}</div>
                    <div class="text-sm text-gray-500">Venta Est: ${arbitrage.formatCurrency(opportunity.destPrice)}</div>
                    ${realSalePriceHtml}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${marginHtml}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${calc.estimated.profitability >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${profitabilityHtml}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${arbitrage.getStatusColor(opportunity.status)}">
                        ${this.capitalize(opportunity.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="app.showDetail('${opportunity.id}')" class="text-indigo-600 hover:text-indigo-900">Ver</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },
    
    updateDashboardStats(opportunities) {
        document.getElementById('total-opportunities').textContent = opportunities.length;
        document.getElementById('capital-inmovilizado').textContent = 
            arbitrage.formatCurrency(arbitrage.getCapitalInmovilizado(opportunities));
        document.getElementById('total-margen-potencial').textContent = 
            arbitrage.formatCurrency(arbitrage.getTotalMargenPotencial(opportunities));
        document.getElementById('avg-rentabilidad').textContent = 
            arbitrage.formatPercent(arbitrage.getAverageRentabilidad(opportunities));
        
        const totalMargenReal = arbitrage.getTotalMargenReal(opportunities);
        const avgRentabilidadReal = arbitrage.getAverageRentabilidadReal(opportunities);
        const realMetricsSection = document.getElementById('dashboard-real-metrics');
        
        if (avgRentabilidadReal !== null) {
            realMetricsSection.style.display = 'grid';
            document.getElementById('total-margen-real').textContent = 
                arbitrage.formatCurrency(totalMargenReal);
            document.getElementById('avg-rentabilidad-real').textContent = 
                arbitrage.formatPercent(avgRentabilidadReal);
        } else {
            realMetricsSection.style.display = 'none';
        }
    },
    
    renderForm(opportunity = null) {
        const form = document.getElementById('opportunity-form');
        
        if (!form) {
            console.error('Opportunity form not found');
            return;
        }
        
        if (opportunity) {
            const opportunityIdInput = document.getElementById('opportunity-id');
            const productNameInput = document.getElementById('product-name');
            
            if (opportunityIdInput) opportunityIdInput.value = opportunity.id || '';
            if (productNameInput) productNameInput.value = opportunity.productName || '';
            
            const originChannelSelect = document.getElementById('origin-channel-select');
            const destChannelSelect = document.getElementById('dest-channel-select');
            const originChannelIdInput = document.getElementById('origin-channel-id');
            const destChannelIdInput = document.getElementById('dest-channel-id');
            
            if (originChannelSelect && originChannelIdInput) {
                originChannelSelect.value = opportunity.originChannelId || '';
                originChannelIdInput.value = opportunity.originChannelId || '';
            }
            
            if (destChannelSelect && destChannelIdInput) {
                destChannelSelect.value = opportunity.destChannelId || '';
                destChannelIdInput.value = opportunity.destChannelId || '';
            }
            
            const originPriceInput = document.getElementById('origin-price');
            const destPriceInput = document.getElementById('dest-price');
            const realSalePriceInput = document.getElementById('real-sale-price');
            const statusSelect = document.getElementById('status');
            const notesTextarea = document.getElementById('notes');
            
            if (originPriceInput) originPriceInput.value = opportunity.originPrice || '';
            if (destPriceInput) destPriceInput.value = opportunity.destPrice || '';
            if (realSalePriceInput) realSalePriceInput.value = opportunity.realSalePrice || '';
            if (statusSelect) statusSelect.value = opportunity.status || 'detectado';
            if (notesTextarea) notesTextarea.value = opportunity.notes || '';
            
            app.formCosts = opportunity.costs ? JSON.parse(JSON.stringify(opportunity.costs)) : [];
            if (opportunity.additionalCosts && (!opportunity.costs || opportunity.costs.length === 0)) {
                app.formCosts = [{
                    name: 'Costes adicionales',
                    type: 'fixed',
                    value: opportunity.additionalCosts,
                    source: 'manual'
                }];
            }
            
            setTimeout(() => {
                if (opportunity.originChannelId && originChannelSelect) {
                    const originChannel = app.allChannels && app.allChannels.find ? app.allChannels.find(c => c.id === opportunity.originChannelId) : null;
                    if (originChannel && originChannel.originCosts && originChannel.originCosts.length > 0) {
                        const existingChannelCosts = app.formCosts.filter(c => c.source === 'channel_origin');
                        if (existingChannelCosts.length === 0) {
                            originChannel.originCosts.forEach(cost => {
                                app.formCosts.push({
                                    ...cost,
                                    source: 'channel_origin',
                                    channelName: originChannel.name
                                });
                            });
                            this.renderCostsList('costs-list');
                            this.updateFormCalculations();
                        }
                    }
                }
                
                if (opportunity.destChannelId && destChannelSelect) {
                    const destChannel = app.allChannels && app.allChannels.find ? app.allChannels.find(c => c.id === opportunity.destChannelId) : null;
                    if (destChannel && destChannel.destCosts && destChannel.destCosts.length > 0) {
                        const existingChannelCosts = app.formCosts.filter(c => c.source === 'channel_destination');
                        if (existingChannelCosts.length === 0) {
                            destChannel.destCosts.forEach(cost => {
                                app.formCosts.push({
                                    ...cost,
                                    source: 'channel_destination',
                                    channelName: destChannel.name
                                });
                            });
                            this.renderCostsList('costs-list');
                            this.updateFormCalculations();
                        }
                    }
                }
            }, 100);
        } else {
            form.reset();
            const opportunityIdInput = document.getElementById('opportunity-id');
            const statusSelect = document.getElementById('status');
            const realSalePriceInput = document.getElementById('real-sale-price');
            const originChannelSelect = document.getElementById('origin-channel-select');
            const destChannelSelect = document.getElementById('dest-channel-select');
            const originChannelIdInput = document.getElementById('origin-channel-id');
            const destChannelIdInput = document.getElementById('dest-channel-id');
            
            if (opportunityIdInput) opportunityIdInput.value = '';
            if (statusSelect) statusSelect.value = 'detectado';
            if (realSalePriceInput) realSalePriceInput.value = '';
            if (originChannelSelect) originChannelSelect.value = '';
            if (destChannelSelect) destChannelSelect.value = '';
            if (originChannelIdInput) originChannelIdInput.value = '';
            if (destChannelIdInput) destChannelIdInput.value = '';
            
            app.formCosts = [];
        }
        
        this.renderCostsList('costs-list');
        this.updateFormCalculations();
    },
    
    renderCostsList(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        const isDetail = containerId === 'detail-costs-list';
        const costs = isDetail ? app.detailCosts : app.formCosts;
        
        if (!costs || costs.length === 0) {
            container.innerHTML = '<div class="text-sm text-gray-500 italic">No hay costes añadidos</div>';
            return;
        }
        
        costs.forEach((cost, index) => {
            const costDiv = document.createElement('div');
            const isFromChannel = cost.source && (cost.source === 'channel_origin' || cost.source === 'channel_destination');
            const costBgColor = isFromChannel ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
            costDiv.className = `border rounded-lg p-4 ${costBgColor}`;
            
            const sourceBadge = isFromChannel 
                ? `<div class="mb-2"><span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cost.source === 'channel_origin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">${cost.channelName ? `Del canal: ${cost.channelName}` : (cost.source === 'channel_origin' ? 'Del canal origen' : 'Del canal destino')}</span></div>`
                : '';
            
            costDiv.innerHTML = `
                ${sourceBadge}
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div class="md:col-span-3">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" data-cost-index="${index}" data-cost-field="name" value="${this.escapeHtml(cost.name || '')}" placeholder="Ej: Envío" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${isFromChannel ? 'bg-blue-50' : ''}">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                        <select data-cost-index="${index}" data-cost-field="type" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${isFromChannel ? 'bg-blue-50' : ''}">
                            <option value="fixed" ${cost.type === 'fixed' ? 'selected' : ''}>Valor Fijo</option>
                            <option value="percentage" ${cost.type === 'percentage' ? 'selected' : ''}>Porcentaje</option>
                        </select>
                    </div>
                    <div class="md:col-span-2 cost-base-field" id="cost-base-${containerId}-${index}" style="${cost.type === 'percentage' ? '' : 'display: none;'}">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Base</label>
                        <select data-cost-index="${index}" data-cost-field="base" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${isFromChannel ? 'bg-blue-50' : ''}">
                            <option value="purchase" ${cost.base === 'purchase' ? 'selected' : ''}>Precio Compra</option>
                            <option value="sale" ${cost.base === 'sale' ? 'selected' : ''}>Precio Venta</option>
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1 cost-value-label" id="cost-value-label-${containerId}-${index}">${cost.type === 'percentage' ? 'Porcentaje (%)' : 'Valor (€)'}</label>
                        <input type="number" data-cost-index="${index}" data-cost-field="value" value="${cost.value || ''}" step="0.01" min="0" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm ${isFromChannel ? 'bg-blue-50' : ''}">
                    </div>
                    <div class="md:col-span-2 flex items-end">
                        ${isFromChannel ? 
                            `<button type="button" onclick="app.removeCost(${index})" class="w-full px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100" title="Este coste viene del canal. Al eliminarlo se quitará del formulario.">Quitar</button>` :
                            `<button type="button" onclick="app.removeCost(${index})" class="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">Eliminar</button>`
                        }
                    </div>
                </div>
            `;
            container.appendChild(costDiv);
            
            const typeSelect = costDiv.querySelector('[data-cost-field="type"]');
            const baseField = costDiv.querySelector(`#cost-base-${containerId}-${index}`);
            const valueLabel = costDiv.querySelector(`#cost-value-label-${containerId}-${index}`);
            typeSelect.addEventListener('change', (e) => {
                const isPercentage = e.target.value === 'percentage';
                if (baseField) {
                    baseField.style.display = isPercentage ? '' : 'none';
                }
                if (valueLabel) {
                    valueLabel.textContent = isPercentage ? 'Porcentaje (%)' : 'Valor (€)';
                }
                if (isDetail) {
                    app.updateDetailCostType(index, e.target.value);
                } else {
                    app.updateCostType(index, e.target.value);
                }
            });
            
            ['name', 'value', 'base'].forEach(field => {
                const input = costDiv.querySelector(`[data-cost-field="${field}"]`);
                if (input) {
                    input.addEventListener('input', () => {
                        if (isDetail) {
                            app.updateDetailCostField(index, field, input.value);
                        } else {
                            app.updateCostField(index, field, input.value);
                        }
                    });
                    input.addEventListener('change', () => {
                        if (isDetail) {
                            app.updateDetailCostField(index, field, input.value);
                        } else {
                            app.updateCostField(index, field, input.value);
                        }
                    });
                }
            });
            
            const removeBtn = costDiv.querySelector('button[onclick*="removeCost"]');
            if (removeBtn && isDetail) {
                removeBtn.setAttribute('onclick', `app.removeCostDetail(${index})`);
            }
        });
    },
    
    updateFormCalculations() {
        const purchasePrice = parseFloat(document.getElementById('origin-price').value) || 0;
        const estimatedSalePrice = parseFloat(document.getElementById('dest-price').value) || 0;
        const realSalePriceInput = document.getElementById('real-sale-price').value;
        const realSalePrice = realSalePriceInput ? parseFloat(realSalePriceInput) : null;
        
        const tempOpportunity = {
            originPrice: purchasePrice,
            destPrice: estimatedSalePrice,
            realSalePrice: realSalePrice,
            costs: app.formCosts || []
        };
        
        const calc = arbitrage.calculate(tempOpportunity);
        
        document.getElementById('calc-margin-bruto').textContent = arbitrage.formatCurrency(calc.estimated.grossMargin);
        document.getElementById('calc-costes-totales').textContent = arbitrage.formatCurrency(calc.estimated.totalCosts);
        document.getElementById('calc-margin-neto').textContent = arbitrage.formatCurrency(calc.estimated.netMargin);
        document.getElementById('calc-rentabilidad').textContent = arbitrage.formatPercent(calc.estimated.profitability);
        
        const netMarginEl = document.getElementById('calc-margin-neto');
        netMarginEl.className = netMarginEl.className.replace(/text-\w+-\d+/, '');
        netMarginEl.classList.add(calc.estimated.netMargin >= 0 ? 'text-green-600' : 'text-red-600');
        
        const rentEl = document.getElementById('calc-rentabilidad');
        rentEl.className = rentEl.className.replace(/text-\w+-\d+/, '');
        rentEl.classList.add(calc.estimated.profitability >= 0 ? 'text-green-600' : 'text-red-600');
        
        this.updateCostsBreakdown('costs-breakdown-content', 'costs-total', calc.estimated.costsBreakdown);
        
        const realSection = document.getElementById('calc-real-section');
        if (calc.real) {
            realSection.style.display = 'block';
            document.getElementById('calc-margin-neto-real').textContent = arbitrage.formatCurrency(calc.real.netMargin);
            document.getElementById('calc-rentabilidad-real').textContent = arbitrage.formatPercent(calc.real.profitability);
            document.getElementById('calc-diferencia').textContent = arbitrage.formatCurrency(calc.marginDifference);
            
            const diffEl = document.getElementById('calc-diferencia');
            diffEl.className = diffEl.className.replace(/text-\w+-\d+/, '');
            diffEl.classList.add(calc.marginDifference >= 0 ? 'text-green-600' : 'text-red-600');
        } else {
            realSection.style.display = 'none';
        }
    },
    
    updateCostsBreakdown(contentId, totalId, breakdown) {
        const content = document.getElementById(contentId);
        const total = document.getElementById(totalId);
        
        if (!breakdown || breakdown.length === 0) {
            content.innerHTML = '<div>Ningún coste añadido</div>';
            total.textContent = '€0.00';
            return;
        }
        
        content.innerHTML = breakdown.map(cost => 
            `<div>• ${this.escapeHtml(cost.description)}</div>`
        ).join('');
        
        const totalCosts = breakdown.reduce((sum, cost) => sum + cost.value, 0);
        total.textContent = arbitrage.formatCurrency(totalCosts);
    },
    
    renderDetail(opportunity) {
        const calc = arbitrage.calculate(opportunity);
        
        document.getElementById('detail-product-name').textContent = opportunity.productName;
        document.getElementById('detail-origin-channel').textContent = opportunity.originChannel;
        document.getElementById('detail-origin-price').textContent = `Compra: ${arbitrage.formatCurrency(opportunity.originPrice)}`;
        document.getElementById('detail-dest-channel').textContent = opportunity.destChannel;
        document.getElementById('detail-dest-price').textContent = `Venta Estimada: ${arbitrage.formatCurrency(opportunity.destPrice)}`;
        
        const realPriceEl = document.getElementById('detail-real-price');
        if (opportunity.realSalePrice) {
            realPriceEl.textContent = `Venta Real: ${arbitrage.formatCurrency(opportunity.realSalePrice)}`;
            realPriceEl.style.display = 'block';
        } else {
            realPriceEl.style.display = 'none';
        }
        
        document.getElementById('detail-margin-bruto').textContent = arbitrage.formatCurrency(calc.estimated.grossMargin);
        document.getElementById('detail-costes-totales').textContent = arbitrage.formatCurrency(calc.estimated.totalCosts);
        document.getElementById('detail-margin-neto').textContent = arbitrage.formatCurrency(calc.estimated.netMargin);
        document.getElementById('detail-rentabilidad').textContent = arbitrage.formatPercent(calc.estimated.profitability);
        
        document.getElementById('detail-status').value = opportunity.status;
        document.getElementById('detail-real-sale-price').value = opportunity.realSalePrice || '';
        document.getElementById('detail-notes').value = opportunity.notes || '';
        
        app.detailCosts = opportunity.costs ? JSON.parse(JSON.stringify(opportunity.costs)) : [];
        if (opportunity.additionalCosts && (!opportunity.costs || opportunity.costs.length === 0)) {
            app.detailCosts = [{
                name: 'Costes adicionales',
                type: 'fixed',
                value: opportunity.additionalCosts
            }];
        }
        
        this.renderCostsList('detail-costs-list');
        this.updateCostsBreakdown('detail-costs-breakdown-content', 'detail-costs-total', calc.estimated.costsBreakdown);
        
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
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    renderChannels(channels) {
        const tbody = document.getElementById('channels-table');
        tbody.innerHTML = '';
        
        if (channels.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No hay canales. Crea uno nuevo para empezar.</td></tr>';
            return;
        }
        
        channels.forEach(channel => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const channelId = channel.id ? String(channel.id) : '';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(channel.name)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${channel.originCosts.length} costes</div>
                    ${channel.originCosts.length > 0 ? `<div class="text-xs text-gray-500">${channel.originCosts.map(c => this.escapeHtml(c.name)).join(', ')}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${channel.destCosts.length} costes</div>
                    ${channel.destCosts.length > 0 ? `<div class="text-xs text-gray-500">${channel.destCosts.map(c => this.escapeHtml(c.name)).join(', ')}</div>` : ''}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="app.editChannel('${channelId}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                    <button onclick="app.deleteChannel('${channelId}')" class="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },
    
    renderChannelForm(channel = null) {
        const form = document.getElementById('channel-form');
        
        if (!form) {
            console.error('Channel form not found');
            return;
        }
        
        if (channel && channel.id) {
            const channelIdInput = document.getElementById('channel-id');
            const channelNameInput = document.getElementById('channel-name');
            
            if (channelIdInput) {
                channelIdInput.value = String(channel.id || '');
            }
            
            if (channelNameInput) {
                channelNameInput.value = String(channel.name || '');
            }
            
            app.channelOriginCosts = (channel.originCosts && Array.isArray(channel.originCosts)) 
                ? JSON.parse(JSON.stringify(channel.originCosts)) 
                : [];
            app.channelDestCosts = (channel.destCosts && Array.isArray(channel.destCosts)) 
                ? JSON.parse(JSON.stringify(channel.destCosts)) 
                : [];
        } else {
            if (form) {
                form.reset();
            }
            const channelIdInput = document.getElementById('channel-id');
            if (channelIdInput) {
                channelIdInput.value = '';
            }
            app.channelOriginCosts = [];
            app.channelDestCosts = [];
        }
        
        this.renderChannelCostsList('channel-origin-costs-list', app.channelOriginCosts);
        this.renderChannelCostsList('channel-dest-costs-list', app.channelDestCosts);
    },
    
    renderChannelCostsList(containerId, costs) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        if (!costs || costs.length === 0) {
            container.innerHTML = '<div class="text-sm text-gray-500 italic text-center py-4">No hay costes añadidos</div>';
            return;
        }
        
        const isOrigin = containerId === 'channel-origin-costs-list';
        
        costs.forEach((cost, index) => {
            const costDiv = document.createElement('div');
            costDiv.className = 'border border-gray-200 rounded-lg p-3 bg-white';
            costDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-11 gap-2 items-end">
                    <div class="md:col-span-3">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" data-cost-index="${index}" data-cost-role="${isOrigin ? 'origin' : 'destination'}" data-cost-field="name" value="${this.escapeHtml(cost.name || '')}" placeholder="Ej: Envío" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                        <select data-cost-index="${index}" data-cost-role="${isOrigin ? 'origin' : 'destination'}" data-cost-field="type" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                            <option value="fixed" ${cost.type === 'fixed' ? 'selected' : ''}>Fijo</option>
                            <option value="percentage" ${cost.type === 'percentage' ? 'selected' : ''}>%</option>
                        </select>
                    </div>
                    <div class="md:col-span-2 channel-base-field" id="channel-base-${containerId}-${index}" style="${cost.type === 'percentage' ? '' : 'display: none;'}">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Base</label>
                        <select data-cost-index="${index}" data-cost-role="${isOrigin ? 'origin' : 'destination'}" data-cost-field="base" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                            <option value="purchase" ${cost.base === 'purchase' ? 'selected' : ''}>Compra</option>
                            <option value="sale" ${cost.base === 'sale' ? 'selected' : ''}>Venta</option>
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">${cost.type === 'percentage' ? '%' : '€'}</label>
                        <input type="number" data-cost-index="${index}" data-cost-role="${isOrigin ? 'origin' : 'destination'}" data-cost-field="value" value="${cost.value || ''}" step="0.01" min="0" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                    </div>
                    <div class="md:col-span-2 flex items-end">
                        <button type="button" onclick="app.removeChannelCost('${isOrigin ? 'origin' : 'destination'}', ${index})" class="w-full px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(costDiv);
            
            const typeSelect = costDiv.querySelector('[data-cost-field="type"]');
            const baseField = costDiv.querySelector(`#channel-base-${containerId}-${index}`);
            const valueLabel = costDiv.querySelector('label[for*="value"]') || costDiv.querySelector('input[data-cost-field="value"]').previousElementSibling;
            
            typeSelect.addEventListener('change', (e) => {
                const isPercentage = e.target.value === 'percentage';
                if (baseField) {
                    baseField.style.display = isPercentage ? '' : 'none';
                }
                if (valueLabel) {
                    valueLabel.textContent = isPercentage ? '%' : '€';
                }
                const costs = isOrigin ? app.channelOriginCosts : app.channelDestCosts;
                if (costs && costs[index]) {
                    costs[index].type = e.target.value;
                    if (e.target.value === 'percentage' && !costs[index].base) {
                        costs[index].base = 'purchase';
                    } else if (e.target.value === 'fixed') {
                        costs[index].base = null;
                    }
                }
            });
            
            ['name', 'value', 'base'].forEach(field => {
                const input = costDiv.querySelector(`[data-cost-field="${field}"]`);
                if (input) {
                    input.addEventListener('input', () => {
                        const costs = isOrigin ? app.channelOriginCosts : app.channelDestCosts;
                        if (costs && costs[index]) {
                            if (field === 'value') {
                                costs[index][field] = parseFloat(input.value) || 0;
                            } else {
                                costs[index][field] = input.value;
                            }
                        }
                    });
                    input.addEventListener('change', () => {
                        const costs = isOrigin ? app.channelOriginCosts : app.channelDestCosts;
                        if (costs && costs[index]) {
                            if (field === 'value') {
                                costs[index][field] = parseFloat(input.value) || 0;
                            } else {
                                costs[index][field] = input.value;
                            }
                        }
                    });
                }
            });
        });
    },
    
    populateChannelSelects(channels) {
        const originSelect = document.getElementById('origin-channel-select');
        const destSelect = document.getElementById('dest-channel-select');
        
        if (!originSelect || !destSelect) {
            console.warn('Channel selectors not found in DOM');
            return;
        }
        
        if (!channels || channels.length === 0) {
            originSelect.innerHTML = '<option value="">Selecciona un canal</option>';
            destSelect.innerHTML = '<option value="">Selecciona un canal</option>';
            return;
        }
        
        const options = '<option value="">Selecciona un canal</option>' + 
            channels.map(ch => `<option value="${ch.id}">${this.escapeHtml(ch.name)}</option>`).join('');
        
        originSelect.innerHTML = options;
        destSelect.innerHTML = options;
    }
};
