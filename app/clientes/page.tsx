"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "@/styles/globals.css";

interface Cliente {
  id: string;
  nombre: string;
  tipo_cliente: "rojo" | "moderado" | "inactivo" | "activo" | "especial";
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevoCliente, setNuevoCliente] = useState<Cliente>({
    id: "",
    nombre: "",
    tipo_cliente: "especial",
  });
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busquedaId, setBusquedaId] = useState<string>("");
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      const { data, error } = await supabase.from("clientes").select("*");
      if (error) {
        console.error("Error al obtener clientes:", error);
      } else {
        setClientes(data || []);
      }
      setLoading(false);
    };
    fetchClientes();
  }, []);

  const agregarCliente = async () => {
    if (!nuevoCliente.id || !nuevoCliente.nombre) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    const { error } = await supabase.from("clientes").insert([nuevoCliente]);
    if (error) {
      console.error("Error al agregar cliente:", error);
    } else {
      setClientes([...clientes, nuevoCliente]);
      setNuevoCliente({ id: "", nombre: "", tipo_cliente: "especial" });
    }
  };

  const eliminarCliente = async (id: string) => {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar cliente:", error);
    } else {
      setClientes(clientes.filter(cliente => cliente.id !== id));
    }
  };

  const iniciarEdicion = (cliente: Cliente) => {
    setClienteEditando(cliente);
  };

  const guardarEdicion = async () => {
    if (!clienteEditando) return;
    const { error } = await supabase.from("clientes").update({
      nombre: clienteEditando.nombre,
      tipo_cliente: clienteEditando.tipo_cliente,
    }).eq("id", clienteEditando.id);
    if (error) {
      console.error("Error al editar cliente:", error);
    } else {
      setClientes(clientes.map(cliente => (cliente.id === clienteEditando.id ? clienteEditando : cliente)));
      setClienteEditando(null);
    }
  };

  const clientesFiltrados = clientes
    .filter(cliente => filtroTipo === "todos" || cliente.tipo_cliente === filtroTipo)
    .filter(cliente => busquedaId === "" || cliente.id.toLowerCase().includes(busquedaId.toLowerCase()));

  return (
    <div className="min-h-screen p-8 bg-yellow-50 text-gray-800">
      <h1 className="text-4xl font-bold text-yellow-700 mb-6 text-center">
        Lista de Clientes
      </h1>
      
      <div className="mb-6 p-6 bg-yellow-200 shadow-lg rounded-xl">
        <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Agregar Cliente</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="ID" 
            value={nuevoCliente.id} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, id: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <input 
            type="text" 
            placeholder="Nombre" 
            value={nuevoCliente.nombre} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <select 
            value={nuevoCliente.tipo_cliente} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_cliente: e.target.value as Cliente["tipo_cliente"] })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto"
          >
            <option value="rojo">Rojo</option>
            <option value="moderado">Moderado</option>
            <option value="inactivo">Inactivo</option>
            <option value="activo">Activo</option>
            <option value="especial">Especial</option>
          </select>
          <button 
            onClick={agregarCliente} 
            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition"
          >
            Agregar Cliente
          </button>
        </div>
      </div>

      {/* Nuevo componente de filtros */}
      <div className="mb-6 p-6 bg-yellow-200 shadow-lg rounded-xl">
        <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Filtros</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-yellow-800 mb-2">Filtrar por tipo:</label>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="p-3 border border-yellow-400 rounded-lg w-full"
            >
              <option value="todos">Todos</option>
              <option value="rojo">Rojo</option>
              <option value="moderado">Moderado</option>
              <option value="inactivo">Inactivo</option>
              <option value="activo">Activo</option>
              <option value="especial">Especial</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-yellow-800 mb-2">Buscar por ID:</label>
            <input
              type="text"
              value={busquedaId}
              onChange={(e) => setBusquedaId(e.target.value)}
              placeholder="Ingrese ID del cliente"
              className="p-3 border border-yellow-400 rounded-lg w-full"
            />
          </div>
        </div>
      </div>

      {clienteEditando && (
        <div className="mb-6 p-6 bg-yellow-200 shadow-lg rounded-xl">
          <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Editar Cliente</h2>
          <input 
            type="text" 
            value={clienteEditando.nombre} 
            onChange={(e) => setClienteEditando({ ...clienteEditando, nombre: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto mb-2 mr-2" 
          />
          <select 
            value={clienteEditando.tipo_cliente} 
            onChange={(e) => setClienteEditando({ ...clienteEditando, tipo_cliente: e.target.value as Cliente["tipo_cliente"] })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto mb-2 mr-2"
          >
            <option value="rojo">Rojo</option>
            <option value="moderado">Moderado</option>
            <option value="inactivo">Inactivo</option>
            <option value="activo">Activo</option>
            <option value="especial">Especial</option>
          </select>
          <button 
            onClick={guardarEdicion} 
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition mr-2"
          >
            Guardar
          </button>
          <button 
            onClick={() => setClienteEditando(null)} 
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
        </div>
      )}

      <table className="w-full bg-white shadow-lg rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-yellow-500 text-white">
            <th className="p-4 text-left">ID</th>
            <th className="p-4 text-left">Nombre</th>
            <th className="p-4 text-left">Tipo de Cliente</th>
            <th className="p-4 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.map((cliente) => (
            <tr key={cliente.id} className="border-b hover:bg-yellow-100">
              <td className="p-4">{cliente.id}</td>
              <td className="p-4">{cliente.nombre}</td>
              <td className="p-4">{cliente.tipo_cliente}</td>
              <td className="p-4">
                <button 
                  onClick={() => iniciarEdicion(cliente)} 
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  Editar
                </button>
                <button 
                  onClick={() => eliminarCliente(cliente.id)} 
                  className="text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}