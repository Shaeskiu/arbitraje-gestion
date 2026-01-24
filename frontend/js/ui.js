const ui = {
    renderOpportunities(opportunities, filterStatus = '', searchTerm = '') {
        // Filtrar oportunidades convertidas por defecto (solo mostrar si el filtro lo solicita explícitamente)
        let filtered = filterStatus === 'convertida' 
            ? opportunities 
            : opportunities.filter(o => o.status !== 'convertida');
        
        if (filterStatus && filterStatus !== 'convertida') {
            filtered = filtered.filter(o => o.status === filterStatus);
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o => 
                o.productName.toLowerCase().includes(term) ||
                (o.originChannel && o.originChannel.toLowerCase().includes(term)) ||
                (o.destChannel && o.destChannel.toLowerCase().includes(term))
            );
        }
        
        const tbody = document.getElementById('opportunities-table');
        if (!tbody) {
            console.error('Opportunities table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No hay oportunidades</td></tr>';
            return;
        }
        
        filtered.forEach(opportunity => {
            const precioCompra = opportunity.precioEstimadoCompra !== undefined && opportunity.precioEstimadoCompra !== null
                ? parseFloat(opportunity.precioEstimadoCompra)
                : (opportunity.originPrice !== undefined ? parseFloat(opportunity.originPrice) : 0);
            
            const precioVenta = opportunity.precioEstimadoVenta !== undefined && opportunity.precioEstimadoVenta !== null
                ? parseFloat(opportunity.precioEstimadoVenta)
                : (opportunity.destPrice !== undefined ? parseFloat(opportunity.destPrice) : 0);
            
            // Asegurar que la oportunidad tenga los campos necesarios para arbitrage.calculate()
            const opportunityForCalc = {
                ...opportunity,
                originPrice: precioCompra,
                destPrice: precioVenta
            };
            
            // Calcular margen y rentabilidad teniendo en cuenta los costes
            const calc = arbitrage.calculate(opportunityForCalc);
            const margenNeto = calc.estimated.netMargin;
            const rentabilidadEstimada = calc.estimated.profitability;
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const originChannelName = opportunity.originChannel || 'N/A';
            const destChannelName = opportunity.destChannel || 'N/A';
            
            const statusColors = {
                'detectada': 'bg-blue-100 text-blue-800',
                'descartada': 'bg-red-100 text-red-800',
                'convertida': 'bg-green-100 text-green-800'
            };
            
            const statusLabels = {
                'detectada': 'Detectada',
                'descartada': 'Descartada',
                'convertida': 'Convertida'
            };
            
            const statusClass = statusColors[opportunity.status] || 'bg-gray-100 text-gray-800';
            const statusLabel = statusLabels[opportunity.status] || this.capitalize(opportunity.status || '');
            
            const buttonHtml = opportunity.status === 'convertida' 
                ? '<span class="text-gray-400 text-sm">Convertida</span>'
                : `<button onclick="app.openCompraModal('${opportunity.id}', '${opportunity.canalOrigenId || opportunity.originChannelId || ''}', ${precioCompra}, '${this.escapeHtml(opportunity.productName)}')" class="text-green-600 hover:text-green-900" title="Comprar">
                    <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </button>`;
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(opportunity.productName)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(originChannelName)}</div>
                    <div class="text-sm text-gray-500">→ ${this.escapeHtml(destChannelName)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">Compra Est: ${this.formatCurrency(precioCompra)}</div>
                    <div class="text-sm text-gray-500">Venta Est: ${this.formatCurrency(precioVenta)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.formatCurrency(calc.estimated.grossMargin)}</div>
                    <div class="text-xs text-gray-500">Neto: ${this.formatCurrency(margenNeto)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${rentabilidadEstimada >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${this.formatPercent(rentabilidadEstimada)}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${statusLabel}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="app.showDetail('${opportunity.id}')" class="text-indigo-600 hover:text-indigo-900">Ver</button>
                    ${buttonHtml}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },
    
    formatCurrency(value) {
        return '€' + parseFloat(value || 0).toFixed(2);
    },
    
    formatPercent(value) {
        return parseFloat(value || 0).toFixed(2) + '%';
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
            const offerLinkInput = document.getElementById('offer-link');
            const marketPriceLinkInput = document.getElementById('market-price-link');
            const notesTextarea = document.getElementById('notes');
            
            if (originPriceInput) originPriceInput.value = opportunity.originPrice || '';
            if (destPriceInput) destPriceInput.value = opportunity.destPrice || '';
            if (offerLinkInput) offerLinkInput.value = opportunity.offerLink || '';
            if (marketPriceLinkInput) marketPriceLinkInput.value = opportunity.marketPriceLink || '';
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
            const offerLinkInput = document.getElementById('offer-link');
            const marketPriceLinkInput = document.getElementById('market-price-link');
            const originChannelSelect = document.getElementById('origin-channel-select');
            const destChannelSelect = document.getElementById('dest-channel-select');
            const originChannelIdInput = document.getElementById('origin-channel-id');
            const destChannelIdInput = document.getElementById('dest-channel-id');
            
            if (opportunityIdInput) opportunityIdInput.value = '';
            if (offerLinkInput) offerLinkInput.value = '';
            if (marketPriceLinkInput) marketPriceLinkInput.value = '';
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
        
        const tempOpportunity = {
            originPrice: purchasePrice,
            destPrice: estimatedSalePrice,
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
        
        // Ocultar sección de cálculos reales ya que no se usa en el formulario
        const realSection = document.getElementById('calc-real-section');
        if (realSection) {
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
        
        // Poblar campos editables
        const productNameInput = document.getElementById('detail-product-name');
        if (productNameInput) {
            productNameInput.value = opportunity.productName || '';
        }
        
        // Poblar selects de canales (se poblarán después de cargar los canales)
        const originChannelSelect = document.getElementById('detail-origin-channel-select');
        const destChannelSelect = document.getElementById('detail-dest-channel-select');
        const originChannelIdInput = document.getElementById('detail-origin-channel-id');
        const destChannelIdInput = document.getElementById('detail-dest-channel-id');
        
        if (originChannelSelect && originChannelIdInput) {
            const originChannelId = opportunity.originChannelId || opportunity.canalOrigenId || '';
            originChannelSelect.value = originChannelId;
            originChannelIdInput.value = originChannelId;
        }
        
        if (destChannelSelect && destChannelIdInput) {
            const destChannelId = opportunity.destChannelId || opportunity.canalDestinoId || '';
            destChannelSelect.value = destChannelId;
            destChannelIdInput.value = destChannelId;
        }
        
        // Poblar precios
        const originPriceInput = document.getElementById('detail-origin-price');
        const destPriceInput = document.getElementById('detail-dest-price');
        if (originPriceInput) {
            originPriceInput.value = opportunity.originPrice || opportunity.precioEstimadoCompra || '';
        }
        if (destPriceInput) {
            destPriceInput.value = opportunity.destPrice || opportunity.precioEstimadoVenta || '';
        }
        
        // Poblar enlaces
        const offerLinkInput = document.getElementById('detail-offer-link');
        const marketPriceLinkInput = document.getElementById('detail-market-price-link');
        if (offerLinkInput) {
            offerLinkInput.value = opportunity.offerLink || '';
        }
        if (marketPriceLinkInput) {
            marketPriceLinkInput.value = opportunity.marketPriceLink || '';
        }
        
        // Poblar estado y notas
        document.getElementById('detail-status').value = opportunity.status || 'detectada';
        document.getElementById('detail-notes').value = opportunity.notes || '';
        
        // Poblar costes
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
        
        // Actualizar métricas
        document.getElementById('detail-margin-bruto').textContent = arbitrage.formatCurrency(calc.estimated.grossMargin);
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
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    renderLocalizaciones(localizaciones) {
        const tbody = document.getElementById('localizaciones-table');
        if (!tbody) {
            console.error('Localizaciones table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!localizaciones || localizaciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No hay localizaciones registradas</td></tr>';
            return;
        }
        
        localizaciones.forEach(localizacion => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(localizacion.name)}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-500">${localizacion.description ? this.escapeHtml(localizacion.description) : '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="app.editLocalizacion('${localizacion.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                    <button onclick="app.deleteLocalizacion('${localizacion.id}')" class="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },
    
    renderLocalizacionForm(localizacion = null) {
        const form = document.getElementById('localizacion-form');
        if (!form) {
            console.error('Localizacion form not found');
            return;
        }
        
        if (localizacion) {
            const localizacionIdInput = document.getElementById('localizacion-id');
            const localizacionNameInput = document.getElementById('localizacion-name');
            const localizacionDescriptionInput = document.getElementById('localizacion-description');
            
            if (localizacionIdInput) localizacionIdInput.value = localizacion.id || '';
            if (localizacionNameInput) localizacionNameInput.value = localizacion.name || '';
            if (localizacionDescriptionInput) localizacionDescriptionInput.value = localizacion.description || '';
        } else {
            form.reset();
            const localizacionIdInput = document.getElementById('localizacion-id');
            if (localizacionIdInput) localizacionIdInput.value = '';
        }
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
    },
    
    populateDetailChannelSelects(channels) {
        const originSelect = document.getElementById('detail-origin-channel-select');
        const destSelect = document.getElementById('detail-dest-channel-select');
        
        if (!originSelect || !destSelect) {
            console.warn('Detail channel selectors not found in DOM');
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
    },
    
    renderStock(stockItems) {
        const tbody = document.getElementById('stock-table');
        if (!tbody) {
            console.error('Stock table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!stockItems || stockItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">No hay stock disponible</td></tr>';
            return;
        }
        
        stockItems.forEach(stock => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const valorTotal = stock.unidadesDisponibles * stock.costeUnitarioReal;
            const formattedDate = stock.fechaCompra ? new Date(stock.fechaCompra).toLocaleDateString('es-ES') : 'N/A';
            
            // Mapear estados a badges de color
            const estadoLabels = {
                'pendiente_recibir': 'Pendiente de recibir',
                'recepcionado': 'Recepcionado',
                'disponible': 'Disponible'
            };
            
            const estadoColors = {
                'pendiente_recibir': 'bg-yellow-100 text-yellow-800',
                'recepcionado': 'bg-blue-100 text-blue-800',
                'disponible': 'bg-green-100 text-green-800'
            };
            
            const estado = stock.estado || 'disponible';
            const estadoLabel = estadoLabels[estado] || estado;
            const estadoClass = estadoColors[estado] || 'bg-gray-100 text-gray-800';
            
            // Localización
            const localizacionName = stock.localizacion ? stock.localizacion.name : (stock.localizacionName || '-');
            
            // Botones de acción según estado
            let accionesHtml = '';
            if (estado === 'pendiente_recibir') {
                accionesHtml = `
                    <button onclick="app.recepcionarStock('${stock.id}')" 
                            class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" 
                            title="Recepcionar stock">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </button>
                `;
            } else if (estado === 'recepcionado') {
                accionesHtml = `
                    <button onclick="app.ponerAVentaStock('${stock.id}')" 
                            class="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50" 
                            title="Poner a venta">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </button>
                `;
            } else if (estado === 'disponible' && stock.unidadesDisponibles > 0) {
                accionesHtml = `
                    <button onclick="app.openVentaModal('${stock.id}', ${stock.unidadesDisponibles})" 
                            class="text-green-600 hover:text-green-900" 
                            title="Registrar Venta">
                        Vender
                    </button>
                `;
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(stock.productoName || 'N/A')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(stock.canalOrigenName || 'N/A')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">€${parseFloat(stock.costeUnitarioReal || 0).toFixed(2)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        <span class="font-medium">${stock.unidadesDisponibles}</span>
                        <span class="text-gray-400"> / ${stock.unidadesIniciales}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-indigo-600">€${valorTotal.toFixed(2)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${formattedDate}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
                        ${estadoLabel}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(localizacionName)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    ${accionesHtml}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },
    
    updateImmobilizedCapital(value) {
        const element = document.getElementById('immobilized-capital-value');
        if (element) {
            element.textContent = this.formatCurrency(value);
        }
    },
    
    renderSalesChart(salesData, grouping = 'day') {
        const container = document.getElementById('sales-chart-container');
        if (!container) {
            console.error('Sales chart container not found');
            return;
        }
        
        if (!salesData || salesData.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500">No hay datos de ventas disponibles</div>';
            return;
        }
        
        // Por ahora renderizamos como tabla, después se puede mejorar con un gráfico
        let html = '<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>';
        html += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>';
        html += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ventas</th>';
        html += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidades</th>';
        html += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
        
        salesData.forEach(item => {
            html += '<tr class="hover:bg-gray-50">';
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.escapeHtml(item.period || item.date || 'N/A')}</td>`;
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${this.formatCurrency(item.total_sales || item.total || 0)}</td>`;
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.total_units || item.unidades || 0}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    renderMarginsChart(marginsData) {
        const container = document.getElementById('margins-chart-container');
        if (!container) {
            console.error('Margins chart container not found');
            return;
        }
        
        if (!marginsData || marginsData.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500">No hay datos de márgenes disponibles</div>';
            return;
        }
        
        // Por ahora renderizamos como tabla
        let html = '<table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr>';
        html += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>';
        html += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen Bruto</th>';
        html += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margen Neto</th>';
        html += '</tr></thead><tbody class="bg-white divide-y divide-gray-200">';
        
        marginsData.forEach(item => {
            const grossMargin = parseFloat(item.gross_margin || item.margen_bruto || 0);
            const netMargin = parseFloat(item.net_margin || item.margen_neto || 0);
            
            html += '<tr class="hover:bg-gray-50">';
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.escapeHtml(item.month || item.mes || 'N/A')}</td>`;
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}">${this.formatCurrency(grossMargin)}</td>`;
            html += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}">${this.formatCurrency(netMargin)}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    renderCompras(compras) {
        const tbody = document.getElementById('compras-table');
        if (!tbody) {
            console.error('Compras table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!compras || compras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No hay compras registradas</td></tr>';
            return;
        }
        
        compras.forEach(compra => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const fechaFormateada = compra.fecha_compra 
                ? new Date(compra.fecha_compra).toLocaleDateString('es-ES')
                : 'N/A';
            
            const producto = compra.product_name || compra.oportunidad_product_name || 'Sin producto';
            const canalOrigen = compra.canal_origen_name || 'N/A';
            
            // Renderizar columna "Viene de oportunidad" con icono de ojo si tiene oportunidad
            let desdeOportunidadHtml = '';
            if (compra.oportunidad_id) {
                desdeOportunidadHtml = `
                    <button onclick="app.showDetail('${compra.oportunidad_id}')" 
                            class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" 
                            title="Ver oportunidad">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                `;
            } else {
                desdeOportunidadHtml = '<span class="text-gray-400">-</span>';
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${fechaFormateada}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(producto)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(canalOrigen)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${compra.unidades || 0}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.formatCurrency(compra.precio_unitario || 0)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-indigo-600">${this.formatCurrency(compra.total_compra || 0)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    ${desdeOportunidadHtml}
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },
    
    renderVentas(ventas) {
        const tbody = document.getElementById('ventas-table');
        if (!tbody) {
            console.error('Ventas table body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!ventas || ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No hay ventas registradas</td></tr>';
            return;
        }
        
        ventas.forEach(venta => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            const fechaFormateada = venta.fecha_venta 
                ? new Date(venta.fecha_venta).toLocaleDateString('es-ES')
                : 'N/A';
            
            const producto = venta.product_name || 'Sin producto';
            const canalDestino = venta.canal_destino_name || 'N/A';
            
            // Calcular margen si tenemos el coste del stock asociado
            // Por ahora, si viene en los datos enriquecidos lo usamos, sino mostramos N/A
            let margenHtml = '<span class="text-sm text-gray-500">N/A</span>';
            if (venta.margen !== undefined && venta.margen !== null) {
                const margen = parseFloat(venta.margen);
                const margenClass = margen >= 0 ? 'text-green-600' : 'text-red-600';
                margenHtml = `<span class="text-sm font-medium ${margenClass}">${this.formatCurrency(margen)}</span>`;
            }
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${fechaFormateada}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(producto)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.escapeHtml(canalDestino)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${venta.unidades || 0}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${this.formatCurrency(venta.precio_unitario || 0)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-green-600">${this.formatCurrency(venta.total_venta || 0)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${margenHtml}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="app.showVentaDetail('${venta.id}')" class="text-indigo-600 hover:text-indigo-900">
                        Detalle
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    },

    /**
     * Renderiza la vista de detalle de una venta con los costes de compra y de venta
     */
    renderVentaDetail(detail, compraCosts, ventaCosts) {
        if (!detail || !detail.venta) {
            console.error('Venta detail is missing');
            return;
        }

        const { venta, compra, canal_origen, canal_destino } = detail;

        const productNameEl = document.getElementById('venta-detail-product-name');
        const origenEl = document.getElementById('venta-detail-origin-channel');
        const destinoEl = document.getElementById('venta-detail-dest-channel');
        const fechaCompraEl = document.getElementById('venta-detail-fecha-compra');
        const fechaVentaEl = document.getElementById('venta-detail-fecha-venta');
        const unidadesEl = document.getElementById('venta-detail-unidades');
        const precioCompraEl = document.getElementById('venta-detail-precio-compra');
        const precioVentaEl = document.getElementById('venta-detail-precio-venta');

        if (productNameEl) {
            productNameEl.textContent = venta.product_name || 'Sin producto';
        }

        if (origenEl) {
            origenEl.textContent = canal_origen && canal_origen.name ? canal_origen.name : (compra && compra.canal_origen_id ? 'Canal origen' : 'N/A');
        }

        if (destinoEl) {
            destinoEl.textContent = canal_destino && canal_destino.name ? canal_destino.name : 'N/A';
        }

        if (fechaCompraEl) {
            const fecha = compra && compra.fecha_compra ? new Date(compra.fecha_compra).toLocaleDateString('es-ES') : 'N/A';
            fechaCompraEl.textContent = fecha;
        }

        if (fechaVentaEl) {
            const fechaV = venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString('es-ES') : 'N/A';
            fechaVentaEl.textContent = fechaV;
        }

        if (unidadesEl) {
            unidadesEl.textContent = venta.unidades || 0;
        }

        if (precioCompraEl) {
            const precioUnitarioCompra = compra && compra.precio_unitario ? parseFloat(compra.precio_unitario) : 0;
            precioCompraEl.textContent = this.formatCurrency(precioUnitarioCompra);
        }

        if (precioVentaEl) {
            const precioUnitarioVenta = venta.precio_unitario ? parseFloat(venta.precio_unitario) : 0;
            precioVentaEl.textContent = this.formatCurrency(precioUnitarioVenta);
        }

        // Renderizar listas de costes
        this.renderVentaCostList('venta-compra-costs-list', compraCosts || [], 'compra');
        this.renderVentaCostList('venta-venta-costs-list', ventaCosts || [], 'venta');
    },

    renderVentaCostList(containerId, costs, role) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = '';

        if (!costs || costs.length === 0) {
            container.innerHTML = '<div class="text-sm text-gray-500 italic">No hay costes añadidos</div>';
            return;
        }

        costs.forEach((cost, index) => {
            const costDiv = document.createElement('div');
            costDiv.className = 'border rounded-lg p-4 bg-gray-50 border-gray-200';

            const safeName = this.escapeHtml(cost.name || '');
            const safeValue = cost.value !== undefined && cost.value !== null ? parseFloat(cost.value) : '';

            costDiv.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div class="md:col-span-6">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input type="text" data-venta-cost-role="${role}" data-venta-cost-index="${index}" data-venta-cost-field="name" value="${safeName}" placeholder="Ej: Envío" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                    </div>
                    <div class="md:col-span-4">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Valor (€)</label>
                        <input type="number" data-venta-cost-role="${role}" data-venta-cost-index="${index}" data-venta-cost-field="value" value="${safeValue === '' ? '' : safeValue}" step="0.01" min="0" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm">
                    </div>
                    <div class="md:col-span-2 flex items-end">
                        <button type="button" class="w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100" data-venta-cost-role="${role}" data-venta-cost-index="${index}" data-venta-cost-action="remove">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(costDiv);

            // Eventos
            const nameInput = costDiv.querySelector('input[data-venta-cost-field="name"]');
            const valueInput = costDiv.querySelector('input[data-venta-cost-field="value"]');
            const removeBtn = costDiv.querySelector('button[data-venta-cost-action="remove"]');

            if (nameInput) {
                nameInput.addEventListener('input', () => {
                    app.updateVentaCostField(role, index, 'name', nameInput.value);
                });
            }

            if (valueInput) {
                const handler = () => {
                    app.updateVentaCostField(role, index, 'value', valueInput.value);
                };
                valueInput.addEventListener('input', handler);
                valueInput.addEventListener('change', handler);
            }

            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    app.removeVentaCost(role, index);
                });
            }
        });
    }
};
