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
  'https://benevolent-dieffenbachia-31b8be.netlify.app'
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

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});