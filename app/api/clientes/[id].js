// pages/api/clientes/[id].js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    // Obtener datos del cliente y sus fechas
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (clienteError) return res.status(400).json({ error: clienteError.message });

    const { data: fechas, error: fechasError } = await supabase
      .from('fechas_clientes')
      .select('*')
      .eq('cliente_id', id)
      .order('fecha', { ascending: true });
    
    if (fechasError) return res.status(400).json({ error: fechasError.message });

    res.status(200).json({ cliente, fechas });
  }

  if (req.method === 'POST') {
    // Agregar una nueva fecha
    const { fecha } = req.body;
    const { error } = await supabase.from('fechas_clientes').insert([{ cliente_id: id, fecha }]);
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Fecha agregada' });
  }

  if (req.method === 'DELETE') {
    // Eliminar una fecha
    const { fechaId } = req.body;
    const { error } = await supabase.from('fechas_clientes').delete().eq('id', fechaId);
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json({ message: 'Fecha eliminada' });
  }
}
