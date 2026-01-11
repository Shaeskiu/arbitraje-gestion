import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://benevolent-dieffenbachia-31b8be.netlify.app',
  'https://shaeskiu.github.io/arbitraje-gestion/'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sin origin (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/opportunities', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_costs (
          id,
          name,
          type,
          value,
          base,
          source
        )
      `)
      .neq('status', 'converted')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_costs (
          id,
          name,
          type,
          value,
          base,
          source
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Opportunity not found' });
      }
      console.error('Supabase error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/opportunities', async (req, res) => {
  try {
    const opportunity = req.body;
    const costs = opportunity.costs || [];
    delete opportunity.costs;

    // Normalizar status a los valores permitidos
    if (opportunity.status) {
      const statusValue = String(opportunity.status).toLowerCase().trim();
      opportunity.status = statusValue === 'detectado' ? 'detectada'
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
      opportunity.status = 'detectada';
    }

    const { data: newOpportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert([opportunity])
      .select()
      .single();

    if (oppError) {
      console.error('Supabase error:', oppError);
      return res.status(500).json({ error: 'Database error', details: oppError.message });
    }

    if (costs && costs.length > 0) {
      const costsToInsert = costs
        .filter(cost => cost && cost.name && cost.name.trim().length > 0)
        .map(cost => {
          const costValue = parseFloat(cost.value);
          if (isNaN(costValue) || costValue < 0) {
            throw new Error(`Invalid cost value for "${cost.name}": ${cost.value}`);
          }

          const costData = {
            opportunity_id: newOpportunity.id,
            name: String(cost.name).trim(),
            type: String(cost.type),
            value: costValue,
            source: cost.source || 'manual'
          };

          if (cost.type === 'percentage') {
            if (!cost.base || (cost.base !== 'purchase' && cost.base !== 'sale')) {
              throw new Error(`Invalid base for percentage cost "${cost.name}": ${cost.base}`);
            }
            costData.base = cost.base;
          } else {
            costData.base = null;
          }

          return costData;
        });

      if (costsToInsert.length > 0) {
        const { error: costsError } = await supabase
          .from('opportunity_costs')
          .insert(costsToInsert);

        if (costsError) {
          console.error('Costs insert error:', costsError);
          return res.status(500).json({ error: 'Database error', details: costsError.message });
        }
      }
    }

    const { data: fullOpportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_costs (
          id,
          name,
          type,
          value,
          base,
          source
        )
      `)
      .eq('id', newOpportunity.id)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return res.status(500).json({ error: 'Database error', details: fetchError.message });
    }

    res.status(201).json(fullOpportunity);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.put('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    const updates = req.body;
    const costs = updates.costs;
    delete updates.costs;

    // Normalizar status a los valores permitidos si viene en los updates
    if (updates.status) {
      const statusValue = String(updates.status).toLowerCase().trim();
      updates.status = statusValue === 'detectado' ? 'detectada'
        : statusValue === 'descartado' ? 'descartada'
        : statusValue === 'convertido' ? 'convertida'
        : statusValue === 'comprado' || statusValue === 'comprada' ? 'convertida'
        : statusValue === 'vendido' || statusValue === 'vendida' ? 'convertida'
        : statusValue === 'analizado' || statusValue === 'analizada' ? 'detectada'
        : statusValue === 'aprobado' || statusValue === 'aprobada' ? 'detectada'
        : (statusValue === 'detectada' || statusValue === 'descartada' || statusValue === 'convertida')
            ? statusValue
            : 'detectada'; // Valor por defecto
    }

    const { error: oppError } = await supabase
      .from('opportunities')
      .update(updates)
      .eq('id', id);

    if (oppError) {
      console.error('Supabase error:', oppError);
      return res.status(500).json({ error: 'Database error', details: oppError.message });
    }

    if (costs !== undefined) {
      await supabase
        .from('opportunity_costs')
        .delete()
        .eq('opportunity_id', id);

      if (costs && costs.length > 0) {
        const costsToInsert = costs
          .filter(cost => cost && cost.name && cost.name.trim().length > 0)
          .map(cost => {
            const costValue = parseFloat(cost.value);
            if (isNaN(costValue) || costValue < 0) {
              throw new Error(`Invalid cost value for "${cost.name}": ${cost.value}`);
            }

            const costData = {
              opportunity_id: id,
              name: String(cost.name).trim(),
              type: String(cost.type),
              value: costValue,
              source: cost.source || 'manual'
            };

            if (cost.type === 'percentage') {
              if (!cost.base || (cost.base !== 'purchase' && cost.base !== 'sale')) {
                throw new Error(`Invalid base for percentage cost "${cost.name}": ${cost.base}`);
              }
              costData.base = cost.base;
            } else {
              costData.base = null;
            }

            return costData;
          });

        if (costsToInsert.length > 0) {
          const { error: costsError } = await supabase
            .from('opportunity_costs')
            .insert(costsToInsert);

          if (costsError) {
            console.error('Costs insert error:', costsError);
            return res.status(500).json({ error: 'Database error', details: costsError.message });
          }
        }
      }
    }

    const { data: updatedOpportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select(`
        *,
        opportunity_costs (
          id,
          name,
          type,
          value,
          base,
          source
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return res.status(500).json({ error: 'Database error', details: fetchError.message });
    }

    res.json(updatedOpportunity);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.delete('/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/channels', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        channel_costs (
          id,
          cost_role,
          name,
          type,
          value,
          base
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('GET /channels/:id - Received ID:', id, 'Type:', typeof id);
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid channel ID format' });
    }
    
    if (!isValidUUID(id)) {
      console.error('Invalid UUID format:', id);
      return res.status(400).json({ error: 'Invalid UUID format for channel ID', received: id });
    }

    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        channel_costs (
          id,
          cost_role,
          name,
          type,
          value,
          base
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Channel not found' });
      }
      console.error('Supabase error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/channels', async (req, res) => {
  try {
    const channel = req.body;
    const originCosts = channel.originCosts || [];
    const destCosts = channel.destCosts || [];
    delete channel.originCosts;
    delete channel.destCosts;

    const { data: newChannel, error: chError } = await supabase
      .from('channels')
      .insert([{ name: channel.name }])
      .select()
      .single();

    if (chError) {
      console.error('Supabase error:', chError);
      return res.status(500).json({ error: 'Database error', details: chError.message });
    }

    const allCosts = [
      ...originCosts.map(cost => ({ ...cost, channel_id: newChannel.id, cost_role: 'origin' })),
      ...destCosts.map(cost => ({ ...cost, channel_id: newChannel.id, cost_role: 'destination' }))
    ];

    if (allCosts.length > 0) {
      const costsToInsert = allCosts.map(cost => {
        const costData = {
          channel_id: newChannel.id,
          cost_role: cost.cost_role,
          name: String(cost.name).trim(),
          type: String(cost.type),
          value: parseFloat(cost.value) || 0
        };

        if (cost.type === 'percentage') {
          if (!cost.base || (cost.base !== 'purchase' && cost.base !== 'sale')) {
            throw new Error(`Invalid base for percentage cost "${cost.name}": ${cost.base}`);
          }
          costData.base = cost.base;
        } else {
          costData.base = null;
        }

        return costData;
      });

      const { error: costsError } = await supabase
        .from('channel_costs')
        .insert(costsToInsert);

      if (costsError) {
        console.error('Costs insert error:', costsError);
        return res.status(500).json({ error: 'Database error', details: costsError.message });
      }
    }

    const { data: fullChannel, error: fetchError } = await supabase
      .from('channels')
      .select(`
        *,
        channel_costs (
          id,
          cost_role,
          name,
          type,
          value,
          base
        )
      `)
      .eq('id', newChannel.id)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return res.status(500).json({ error: 'Database error', details: fetchError.message });
    }

    res.status(201).json(fullChannel);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.put('/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const channel = req.body;
    const originCosts = channel.originCosts;
    const destCosts = channel.destCosts;
    delete channel.originCosts;
    delete channel.destCosts;

    const { error: chError } = await supabase
      .from('channels')
      .update({ name: channel.name })
      .eq('id', id);

    if (chError) {
      console.error('Supabase error:', chError);
      return res.status(500).json({ error: 'Database error', details: chError.message });
    }

    if (originCosts !== undefined || destCosts !== undefined) {
      await supabase
        .from('channel_costs')
        .delete()
        .eq('channel_id', id);

      const allCosts = [
        ...(originCosts || []).map(cost => ({ ...cost, channel_id: id, cost_role: 'origin' })),
        ...(destCosts || []).map(cost => ({ ...cost, channel_id: id, cost_role: 'destination' }))
      ];

      if (allCosts.length > 0) {
        const costsToInsert = allCosts.map(cost => {
          const costData = {
            channel_id: id,
            cost_role: cost.cost_role,
            name: String(cost.name).trim(),
            type: String(cost.type),
            value: parseFloat(cost.value) || 0
          };

          if (cost.type === 'percentage') {
            if (!cost.base || (cost.base !== 'purchase' && cost.base !== 'sale')) {
              throw new Error(`Invalid base for percentage cost "${cost.name}": ${cost.base}`);
            }
            costData.base = cost.base;
          } else {
            costData.base = null;
          }

          return costData;
        });

        const { error: costsError } = await supabase
          .from('channel_costs')
          .insert(costsToInsert);

        if (costsError) {
          console.error('Costs insert error:', costsError);
          return res.status(500).json({ error: 'Database error', details: costsError.message });
        }
      }
    }

    const { data: updatedChannel, error: fetchError } = await supabase
      .from('channels')
      .select(`
        *,
        channel_costs (
          id,
          cost_role,
          name,
          type,
          value,
          base
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return res.status(500).json({ error: 'Database error', details: fetchError.message });
    }

    res.json(updatedChannel);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.delete('/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid channel ID' });
    }

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ============================================
// COMPRAS ENDPOINTS
// ============================================

app.post('/compras', async (req, res) => {
  try {
    const { oportunidad_id, canal_origen_id, product_name, precio_unitario, unidades, costes_compra, fecha_compra } = req.body;

    // Validaciones
    if (!canal_origen_id || typeof canal_origen_id !== 'string' || !isValidUUID(canal_origen_id)) {
      return res.status(400).json({ error: 'Valid canal_origen_id is required' });
    }

    if (!product_name || typeof product_name !== 'string' || !product_name.trim()) {
      return res.status(400).json({ error: 'Valid product_name is required' });
    }

    if (precio_unitario === undefined || precio_unitario === null || parseFloat(precio_unitario) < 0) {
      return res.status(400).json({ error: 'Valid precio_unitario is required (>= 0)' });
    }

    if (!unidades || parseInt(unidades) <= 0) {
      return res.status(400).json({ error: 'Valid unidades is required (> 0)' });
    }

    // Validar oportunidad si se proporciona
    let productName = product_name.trim();
    if (oportunidad_id) {
      if (typeof oportunidad_id !== 'string' || !isValidUUID(oportunidad_id)) {
        return res.status(400).json({ error: 'Invalid oportunidad_id format' });
      }

      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('id, status, product_name')
        .eq('id', oportunidad_id)
        .single();

      if (oppError || !opportunity) {
        return res.status(404).json({ error: 'Oportunidad not found' });
      }

      if (opportunity.status === 'convertida') {
        return res.status(400).json({ error: 'Oportunidad ya está convertida' });
      }

      // Usar el product_name de la oportunidad si no se proporciona explícitamente
      if (opportunity.product_name) {
        productName = opportunity.product_name;
      }
    }

    // Validar canal origen
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('id', canal_origen_id)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Canal origen not found' });
    }

    // Calcular total de compra
    const precioUnitarioNum = parseFloat(precio_unitario);
    const unidadesNum = parseInt(unidades);
    const costesCompraArray = Array.isArray(costes_compra) ? costes_compra : [];
    const totalCostes = costesCompraArray.reduce((sum, coste) => {
      return sum + (parseFloat(coste.value) || 0);
    }, 0);
    const totalCompra = (precioUnitarioNum * unidadesNum) + totalCostes;

    // Crear compra
    const compraData = {
      oportunidad_id: oportunidad_id || null,
      canal_origen_id: canal_origen_id,
      product_name: productName,
      precio_unitario: precioUnitarioNum,
      unidades: unidadesNum,
      costes_compra: costesCompraArray,
      total_compra: totalCompra,
      fecha_compra: fecha_compra || new Date().toISOString().split('T')[0]
    };

    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .insert(compraData)
      .select('*')
      .single();

    if (compraError) {
      console.error('Error creating compra:', compraError);
      return res.status(500).json({ error: 'Error creating compra', details: compraError.message });
    }

    // El stock se crea automáticamente mediante trigger, obtenerlo
    const { data: stockCreated, error: stockError } = await supabase
      .from('stock')
      .select('*')
      .eq('compra_id', compra.id)
      .single();

    // Actualizar estado de oportunidad si existe
    if (oportunidad_id) {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ status: 'convertida' })
        .eq('id', oportunidad_id);

      if (updateError) {
        console.error('Error updating opportunity status:', updateError);
        // No revertir la compra, solo loggear el error
      }
    }

    res.status(201).json({
      compra,
      stock: stockCreated
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/compras', async (req, res) => {
  try {
    const { data: compras, error } = await supabase
      .from('compras')
      .select('*')
      .order('fecha_compra', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Enriquecer con datos de canales y oportunidades
    if (compras && compras.length > 0) {
      const channelIds = [...new Set(compras.map(c => c.canal_origen_id).filter(Boolean))];
      const oppIds = [...new Set(compras.map(c => c.oportunidad_id).filter(Boolean))];

      const [channelsData, oppsData] = await Promise.all([
        channelIds.length > 0 ? supabase.from('channels').select('id, name').in('id', channelIds) : { data: [] },
        oppIds.length > 0 ? supabase.from('opportunities').select('id, product_name').in('id', oppIds) : { data: [] }
      ]);

      const channelsMap = {};
      if (channelsData.data) {
        channelsData.data.forEach(ch => { channelsMap[ch.id] = ch.name; });
      }

      const oppsMap = {};
      if (oppsData.data) {
        oppsData.data.forEach(opp => { oppsMap[opp.id] = opp.product_name; });
      }

      const enriched = compras.map(compra => ({
        ...compra,
        canal_origen_name: channelsMap[compra.canal_origen_id] || null,
        oportunidad_product_name: oppsMap[compra.oportunidad_id] || null
      }));

      return res.json(enriched);
    }

    res.json([]);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ============================================
// STOCK ENDPOINTS (Nuevo modelo)
// ============================================

app.get('/stock', async (req, res) => {
  try {
    const { data: stockItems, error } = await supabase
      .from('stock')
      .select('*')
      .gt('unidades_disponibles', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Enriquecer con datos de compras
    if (stockItems && stockItems.length > 0) {
      const compraIds = [...new Set(stockItems.map(s => s.compra_id).filter(Boolean))];
      
      const { data: compras } = await supabase
        .from('compras')
        .select('id, oportunidad_id, canal_origen_id, product_name, fecha_compra')
        .in('id', compraIds);

      const channelIds = [...new Set(compras?.map(c => c.canal_origen_id).filter(Boolean) || [])];

      const channelsData = channelIds.length > 0 
        ? await supabase.from('channels').select('id, name').in('id', channelIds)
        : { data: [] };

      const comprasMap = {};
      if (compras) {
        compras.forEach(c => { comprasMap[c.id] = c; });
      }

      const channelsMap = {};
      if (channelsData.data) {
        channelsData.data.forEach(ch => { channelsMap[ch.id] = ch.name; });
      }

      const enriched = stockItems.map(stock => {
        const compra = comprasMap[stock.compra_id];
        return {
          ...stock,
          product_name: compra?.product_name || stock.product_name || null,
          compra: compra ? {
            ...compra,
            canal_origen: channelsMap[compra.canal_origen_id] ? { id: compra.canal_origen_id, name: channelsMap[compra.canal_origen_id] } : null
          } : null
        };
      });

      return res.json(enriched);
    }

    res.json([]);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/stock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid stock ID' });
    }

    const { data: stockItem, error } = await supabase
      .from('stock')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Stock item not found' });
      }
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    if (!stockItem) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    // Enriquecer con datos de compra
    if (stockItem.compra_id) {
      const { data: compra } = await supabase
        .from('compras')
        .select('*')
        .eq('id', stockItem.compra_id)
        .single();

      if (compra) {
        const channelData = compra.canal_origen_id 
          ? await supabase.from('channels').select('id, name').eq('id', compra.canal_origen_id).single()
          : { data: null };

        stockItem.product_name = compra.product_name || stockItem.product_name || null;
        stockItem.compra = {
          ...compra,
          canal_origen: channelData.data ? { id: channelData.data.id, name: channelData.data.name } : null
        };
      }
    }

    res.json(stockItem);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ============================================
// VENTAS ENDPOINTS
// ============================================

app.post('/ventas', async (req, res) => {
  try {
    const { stock_id, canal_destino_id, precio_unitario, unidades, costes_venta, fecha_venta } = req.body;

    // Validaciones
    if (!stock_id || typeof stock_id !== 'string' || !isValidUUID(stock_id)) {
      return res.status(400).json({ error: 'Valid stock_id is required' });
    }

    if (!canal_destino_id || typeof canal_destino_id !== 'string' || !isValidUUID(canal_destino_id)) {
      return res.status(400).json({ error: 'Valid canal_destino_id is required' });
    }

    if (precio_unitario === undefined || precio_unitario === null || parseFloat(precio_unitario) < 0) {
      return res.status(400).json({ error: 'Valid precio_unitario is required (>= 0)' });
    }

    if (!unidades || parseInt(unidades) <= 0) {
      return res.status(400).json({ error: 'Valid unidades is required (> 0)' });
    }

    // Verificar stock disponible y obtener product_name
    const { data: stockItem, error: stockError } = await supabase
      .from('stock')
      .select('unidades_disponibles, coste_unitario_real, compra_id')
      .eq('id', stock_id)
      .single();

    if (stockError || !stockItem) {
      return res.status(404).json({ error: 'Stock item not found' });
    }

    const unidadesNum = parseInt(unidades);
    if (stockItem.unidades_disponibles < unidadesNum) {
      return res.status(400).json({ 
        error: 'No hay suficientes unidades disponibles', 
        disponibles: stockItem.unidades_disponibles,
        solicitadas: unidadesNum
      });
    }

    // Obtener product_name desde compras -> opportunities
    let productName = null;
    if (stockItem.compra_id) {
      const { data: compra, error: compraError } = await supabase
        .from('compras')
        .select('product_name, oportunidad_id')
        .eq('id', stockItem.compra_id)
        .single();

      if (!compraError && compra) {
        productName = compra.product_name;
        
        // Si no tiene product_name en compra, intentar obtenerlo desde opportunity
        if (!productName && compra.oportunidad_id) {
          const { data: opportunity, error: oppError } = await supabase
            .from('opportunities')
            .select('product_name')
            .eq('id', compra.oportunidad_id)
            .single();

          if (!oppError && opportunity && opportunity.product_name) {
            productName = opportunity.product_name;
          }
        }
      }
    }

    // Si aún no tenemos product_name, usar un valor por defecto
    if (!productName || !productName.trim()) {
      productName = 'Producto vendido';
    }

    // Validar canal destino
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('id', canal_destino_id)
      .single();

    if (channelError || !channel) {
      return res.status(404).json({ error: 'Canal destino not found' });
    }

    // Calcular total de venta
    const precioUnitarioNum = parseFloat(precio_unitario);
    const costesVentaArray = Array.isArray(costes_venta) ? costes_venta : [];
    const totalCostes = costesVentaArray.reduce((sum, coste) => {
      return sum + (parseFloat(coste.value) || 0);
    }, 0);
    const totalVenta = (precioUnitarioNum * unidadesNum) - totalCostes;

    // Crear venta (el trigger descontará el stock automáticamente)
    const ventaData = {
      stock_id: stock_id,
      canal_destino_id: canal_destino_id,
      product_name: productName.trim(),
      precio_unitario: precioUnitarioNum,
      unidades: unidadesNum,
      costes_venta: costesVentaArray,
      total_venta: totalVenta,
      fecha_venta: fecha_venta || new Date().toISOString().split('T')[0]
    };

    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert(ventaData)
      .select('*')
      .single();

    if (ventaError) {
      console.error('Error creating venta:', ventaError);
      return res.status(500).json({ error: 'Error creating venta', details: ventaError.message });
    }

    res.status(201).json(venta);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/ventas', async (req, res) => {
  try {
    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('*')
      .order('fecha_venta', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Enriquecer con datos relacionados
    if (ventas && ventas.length > 0) {
      const stockIds = [...new Set(ventas.map(v => v.stock_id).filter(Boolean))];
      const channelIds = [...new Set(ventas.map(v => v.canal_destino_id).filter(Boolean))];

      // Obtener stock con coste_unitario_real para calcular margen
      const { data: stockItems } = stockIds.length > 0
        ? await supabase.from('stock').select('id, compra_id, coste_unitario_real').in('id', stockIds)
        : { data: [] };

      const compraIds = [...new Set(stockItems?.map(s => s.compra_id).filter(Boolean) || [])];
      
      const [channelsData, comprasData] = await Promise.all([
        channelIds.length > 0 ? supabase.from('channels').select('id, name').in('id', channelIds) : { data: [] },
        compraIds.length > 0 ? supabase.from('compras').select('id, oportunidad_id, product_name').in('id', compraIds) : { data: [] }
      ]);

      const oppIds = [...new Set(comprasData.data?.map(c => c.oportunidad_id).filter(Boolean) || [])];
      const { data: oppsData } = oppIds.length > 0 
        ? await supabase.from('opportunities').select('id, product_name').in('id', oppIds)
        : { data: [] };

      const stockMap = {};
      if (stockItems) {
        stockItems.forEach(s => { stockMap[s.id] = s; });
      }

      const comprasMap = {};
      if (comprasData.data) {
        comprasData.data.forEach(c => { comprasMap[c.id] = c; });
      }

      const channelsMap = {};
      if (channelsData.data) {
        channelsData.data.forEach(ch => { channelsMap[ch.id] = ch.name; });
      }

      const oppsMap = {};
      if (oppsData) {
        oppsData.forEach(opp => { oppsMap[opp.id] = opp.product_name; });
      }

      const enriched = ventas.map(venta => {
        const stock = stockMap[venta.stock_id];
        const compra = stock ? comprasMap[stock.compra_id] : null;
        
        // Obtener product_name: primero de la venta (denormalized), luego de compra, luego de opportunity
        let productName = venta.product_name;
        if (!productName && compra) {
          productName = compra.product_name || (compra.oportunidad_id && oppsMap[compra.oportunidad_id]) || null;
        }
        
        // Calcular margen: total_venta - (coste_unitario_real del stock * unidades)
        let margen = null;
        if (stock && stock.coste_unitario_real) {
          const costeTotal = parseFloat(stock.coste_unitario_real) * parseInt(venta.unidades);
          const totalVenta = parseFloat(venta.total_venta) || 0;
          margen = totalVenta - costeTotal;
        }
        
        return {
          ...venta,
          product_name: productName || 'Producto vendido',
          canal_destino_name: channelsMap[venta.canal_destino_id] || null,
          margen: margen
        };
      });

      return res.json(enriched);
    }

    res.json([]);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ============================================
// DASHBOARD ENDPOINTS
// ============================================

app.get('/dashboard/immobilized-capital', async (req, res) => {
  try {
    // Get all stock items with available units
    const { data: stockItems, error } = await supabase
      .from('stock')
      .select('unidades_disponibles, coste_unitario_real')
      .gt('unidades_disponibles', 0);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Calculate total immobilized capital
    // Formula: unidades_disponibles × coste_unitario_real
    let totalValue = 0;
    if (stockItems && stockItems.length > 0) {
      totalValue = stockItems.reduce((sum, item) => {
        const unidades = parseInt(item.unidades_disponibles) || 0;
        const costeUnitario = parseFloat(item.coste_unitario_real) || 0;
        return sum + (unidades * costeUnitario);
      }, 0);
    }

    res.json({ value: totalValue });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/dashboard/sales-over-time', async (req, res) => {
  try {
    const { grouping = 'month', range = 'last-6-months', start_date, end_date } = req.query;

    // Determine date range
    let startDate, endDate;
    const now = new Date();
    
    if (range === 'custom' && start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999); // Include full end date
    } else if (range === 'last-12-months') {
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
    } else { // last-6-months (default)
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
    }

    // Get ventas within date range (based on fecha_venta)
    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('fecha_venta, total_venta, unidades')
      .gte('fecha_venta', startDate.toISOString().split('T')[0])
      .lte('fecha_venta', endDate.toISOString().split('T')[0]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    // Group by period
    const grouped = {};
    
    if (ventas && ventas.length > 0) {
      ventas.forEach(venta => {
        const saleDate = new Date(venta.fecha_venta);
        let period;
        
        if (grouping === 'day') {
          period = saleDate.toISOString().split('T')[0];
        } else if (grouping === 'week') {
          const weekStart = new Date(saleDate);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          period = `W${weekStart.toISOString().split('T')[0]}`;
        } else { // month
          period = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        }
        
        if (!grouped[period]) {
          grouped[period] = 0;
        }
        
        // Use total_venta (already calculated: precio_unitario * unidades - costes_venta)
        grouped[period] += parseFloat(venta.total_venta) || 0;
      });
    }

    // Convert to array format
    const result = Object.entries(grouped).map(([period, amount]) => ({
      period,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => a.period.localeCompare(b.period));

    res.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/dashboard/margins', async (req, res) => {
  try {
    const { range = 'last-6-months', start_date, end_date } = req.query;

    // Determine date range
    let startDate, endDate;
    const now = new Date();
    
    if (range === 'custom' && start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === 'last-12-months') {
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
    } else { // last-6-months (default)
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
    }

    // Get ventas within date range
    const { data: ventas, error: ventasError } = await supabase
      .from('ventas')
      .select('id, stock_id, fecha_venta, total_venta, precio_unitario, unidades, costes_venta')
      .gte('fecha_venta', startDate.toISOString().split('T')[0])
      .lte('fecha_venta', endDate.toISOString().split('T')[0]);

    if (ventasError) {
      console.error('Supabase error:', ventasError);
      return res.status(500).json({ error: 'Database error', details: ventasError.message });
    }

    if (!ventas || ventas.length === 0) {
      return res.json([]);
    }

    // Get stock and compras data
    const stockIds = [...new Set(ventas.map(v => v.stock_id))];
    const { data: stockItems } = await supabase
      .from('stock')
      .select('id, compra_id, coste_unitario_real')
      .in('id', stockIds);

    const compraIds = [...new Set(stockItems?.map(s => s.compra_id).filter(Boolean) || [])];
    const { data: compras } = compraIds.length > 0
      ? await supabase
          .from('compras')
          .select('id, total_compra, unidades, costes_compra')
          .in('id', compraIds)
      : { data: [] };

    // Create maps for quick lookup
    const stockMap = {};
    if (stockItems) {
      stockItems.forEach(s => { stockMap[s.id] = s; });
    }

    const comprasMap = {};
    if (compras) {
      compras.forEach(c => { comprasMap[c.id] = c; });
    }

    // Group by month and calculate margins
    const monthlyMargins = {};
    
    ventas.forEach(venta => {
      const saleDate = new Date(venta.fecha_venta);
      const month = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMargins[month]) {
        monthlyMargins[month] = { gross_margin: 0, net_margin: 0 };
      }
      
      const stock = stockMap[venta.stock_id];
      if (!stock) return;

      const compra = comprasMap[stock.compra_id];
      if (!compra) return;

      // Calculate coste de compra proporcional
      const unidadesVendidas = parseInt(venta.unidades) || 0;
      const costeUnitarioCompra = stock.coste_unitario_real;
      const costeCompraProporcional = costeUnitarioCompra * unidadesVendidas;

      // Calculate total venta (ya incluye descuento de costes_venta)
      const totalVenta = parseFloat(venta.total_venta) || 0;

      // Gross margin = total_venta - coste_compra_proporcional
      const grossMargin = totalVenta - costeCompraProporcional;
      monthlyMargins[month].gross_margin += grossMargin;

      // Calculate costes de venta (ya están descontados en total_venta, pero los incluimos para net margin)
      const costesVentaArray = Array.isArray(venta.costes_venta) ? venta.costes_venta : [];
      const totalCostesVenta = costesVentaArray.reduce((sum, coste) => {
        return sum + (parseFloat(coste.value) || 0);
      }, 0);

      // Net margin = total_venta - coste_compra_proporcional - costes_venta
      // Pero total_venta ya incluye descuento de costes_venta, así que:
      // Net margin = (precio_unitario * unidades) - coste_compra_proporcional - costes_venta
      const precioUnitario = parseFloat(venta.precio_unitario) || 0;
      const ingresosBrutos = precioUnitario * unidadesVendidas;
      const netMargin = ingresosBrutos - costeCompraProporcional - totalCostesVenta;
      
      monthlyMargins[month].net_margin += netMargin;
    });

    // Convert to array format
    const result = Object.entries(monthlyMargins).map(([month, margins]) => ({
      month,
      gross_margin: parseFloat(margins.gross_margin.toFixed(2)),
      net_margin: parseFloat(margins.net_margin.toFixed(2))
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});