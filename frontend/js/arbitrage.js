const arbitrage = {
    calculate(opportunity) {
        const purchasePrice = parseFloat(opportunity.originPrice) || 0;
        const estimatedSalePrice = parseFloat(opportunity.destPrice) || 0;
        const realSalePrice = opportunity.realSalePrice ? parseFloat(opportunity.realSalePrice) : null;
        
        const estimatedCosts = this.calculateCosts(opportunity, purchasePrice, estimatedSalePrice);
        const estimatedTotalCosts = purchasePrice + estimatedCosts.total;
        const estimatedGrossMargin = estimatedSalePrice - purchasePrice;
        const estimatedNetMargin = estimatedSalePrice - estimatedTotalCosts;
        const estimatedProfitability = estimatedTotalCosts > 0 ? (estimatedNetMargin / estimatedTotalCosts) * 100 : 0;
        
        let realNetMargin = null;
        let realProfitability = null;
        let realCosts = null;
        let marginDifference = null;
        
        if (realSalePrice !== null && !isNaN(realSalePrice)) {
            realCosts = this.calculateCosts(opportunity, purchasePrice, realSalePrice);
            const realTotalCosts = purchasePrice + realCosts.total;
            realNetMargin = realSalePrice - realTotalCosts;
            realProfitability = realTotalCosts > 0 ? (realNetMargin / realTotalCosts) * 100 : 0;
            marginDifference = realNetMargin - estimatedNetMargin;
        }
        
        return {
            estimated: {
                grossMargin: estimatedGrossMargin,
                totalCosts: estimatedTotalCosts,
                netMargin: estimatedNetMargin,
                profitability: estimatedProfitability,
                costsBreakdown: estimatedCosts.breakdown
            },
            real: realSalePrice !== null && !isNaN(realSalePrice) ? {
                netMargin: realNetMargin,
                profitability: realProfitability,
                costsBreakdown: realCosts.breakdown
            } : null,
            marginDifference: marginDifference
        };
    },
    
    calculateCosts(opportunity, purchasePrice, salePrice) {
        let total = 0;
        const breakdown = [];
        
        if (opportunity.costs && Array.isArray(opportunity.costs)) {
            opportunity.costs.forEach(cost => {
                let costValue = 0;
                let description = '';
                
                if (cost.type === 'fixed') {
                    costValue = parseFloat(cost.value) || 0;
                    description = `${cost.name}: ${this.formatCurrency(costValue)}`;
                } else if (cost.type === 'percentage') {
                    const base = cost.base === 'sale' ? salePrice : purchasePrice;
                    costValue = (base * parseFloat(cost.value)) / 100;
                    const baseText = cost.base === 'sale' ? 'venta' : 'compra';
                    description = `${cost.name}: ${cost.value}% sobre precio de ${baseText} = ${this.formatCurrency(costValue)}`;
                }
                
                total += costValue;
                breakdown.push({
                    name: cost.name,
                    value: costValue,
                    description: description
                });
            });
        } else if (opportunity.additionalCosts) {
            const legacyCost = parseFloat(opportunity.additionalCosts) || 0;
            total = legacyCost;
            breakdown.push({
                name: 'Costes adicionales',
                value: legacyCost,
                description: `Costes adicionales: ${this.formatCurrency(legacyCost)}`
            });
        }
        
        return { total, breakdown };
    },
    
    getCapitalInmovilizado(opportunities) {
        const states = ['aprobado', 'comprado'];
        return opportunities
            .filter(o => states.includes(o.status))
            .reduce((sum, o) => {
                const calc = this.calculate(o);
                return sum + calc.estimated.totalCosts;
            }, 0);
    },
    
    getTotalMargenPotencial(opportunities) {
        return opportunities
            .filter(o => !['vendido', 'descartado'].includes(o.status))
            .reduce((sum, o) => {
                const calc = this.calculate(o);
                return sum + calc.estimated.netMargin;
            }, 0);
    },
    
    getTotalMargenReal(opportunities) {
        const withReal = opportunities.filter(o => o.realSalePrice && !['descartado'].includes(o.status));
        return withReal.reduce((sum, o) => {
            const calc = this.calculate(o);
            return sum + (calc.real ? calc.real.netMargin : 0);
        }, 0);
    },
    
    getAverageRentabilidad(opportunities) {
        const active = opportunities.filter(o => !['vendido', 'descartado'].includes(o.status));
        if (active.length === 0) return 0;
        
        const total = active.reduce((sum, o) => {
            const calc = this.calculate(o);
            return sum + calc.estimated.profitability;
        }, 0);
        
        return total / active.length;
    },
    
    getAverageRentabilidadReal(opportunities) {
        const withReal = opportunities.filter(o => o.realSalePrice && !['descartado'].includes(o.status));
        if (withReal.length === 0) return null;
        
        const total = withReal.reduce((sum, o) => {
            const calc = this.calculate(o);
            return sum + (calc.real ? calc.real.profitability : 0);
        }, 0);
        
        return total / withReal.length;
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },
    
    formatPercent(value) {
        return `${value.toFixed(2)}%`;
    },
    
    getStatusColor(status) {
        const statusLower = status ? String(status).toLowerCase() : '';
        const colors = {
            // Nuevos valores permitidos
            detectada: 'bg-blue-100 text-blue-800',
            descartada: 'bg-red-100 text-red-800',
            convertida: 'bg-green-100 text-green-800',
            // Valores antiguos (por compatibilidad)
            detectado: 'bg-blue-100 text-blue-800',
            analizado: 'bg-blue-100 text-blue-800',
            analizada: 'bg-blue-100 text-blue-800',
            aprobado: 'bg-yellow-100 text-yellow-800',
            aprobada: 'bg-yellow-100 text-yellow-800',
            comprado: 'bg-purple-100 text-purple-800',
            comprada: 'bg-purple-100 text-purple-800',
            vendido: 'bg-green-100 text-green-800',
            vendida: 'bg-green-100 text-green-800',
            descartado: 'bg-red-100 text-red-800',
            convertido: 'bg-green-100 text-green-800',
            converted: 'bg-green-100 text-green-800'
        };
        return colors[statusLower] || 'bg-gray-100 text-gray-800';
    }
};
