"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import "@/styles/globals.css";
import Link from 'next/link';

interface Cliente {
  CODIGO: number;
  DESC: string;
  SALD: string;
  TELGAR1: string;
  TELGAR2: string;
  fechaVencimiento?: Date; // Propiedad para la fecha de vencimiento
  diasRestantes?: number; // Propiedad para los días restantes
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevoCliente, setNuevoCliente] = useState<Cliente>({
    CODIGO: 0,
    DESC: "",
    SALD: "",
    TELGAR1: "",
    TELGAR2: ""
  });
  const [filtroSald, setFiltroSald] = useState<string>("todos");
  const [busquedaCodigo, setBusquedaCodigo] = useState<string>("");
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState<boolean>(false);

  // Función para procesar fechas en formato DD/MM/AAAA
  const parsearFecha = (fechaString: string): Date => {
    if (!fechaString) return new Date();
  
    try {
      const partes = fechaString.split('/');
  
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mes en JS es 0-11
        const anio = parseInt(partes[2], 10); // Ahora es un año completo (ej. 2024)
  
        return new Date(anio, mes, dia);
      }
  
      return new Date(fechaString); // Intentar con formato ISO si el split falla
    } catch (e) {
      console.error("Error al parsear fecha:", e);
      return new Date();
    }
  };
  
  // Ejemplos de uso:
  console.log(parsearFecha("01/02/24")); // 1 de febrero de 2024
  console.log(parsearFecha("15/07/99")); // 15 de julio de 1999
  console.log(parsearFecha("30/12/00")); // 30 de diciembre de 2000
  

  // Función para calcular fecha de vencimiento (8 días incluyendo domingos)
  const calcularFechaVencimiento = (fechaInicial: Date): Date => {
    let fechaVencimiento = new Date(fechaInicial);
    // Simplemente agregar 8 días a la fecha inicial
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 8);
    return fechaVencimiento;
  };

  // Función para calcular días restantes (incluyendo domingos)
  const calcularDiasRestantes = (fechaVencimiento: Date): number => {
    const hoy = new Date();
    
    // Normalizar las fechas para comparar solo fechas sin tiempo
    hoy.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaVencimiento);
    fechaFin.setHours(0, 0, 0, 0);
    
    // Si la fecha de vencimiento ya pasó
    if (fechaFin < hoy) {
      return -1; // Retorna -1 para indicar que está vencido
    }
    
    // Calcular la diferencia en milisegundos
    const diferenciaMilisegundos = fechaFin.getTime() - hoy.getTime();
    
    // Convertir milisegundos a días (1 día = 24 * 60 * 60 * 1000 milisegundos)
    const diasRestantes = Math.ceil(diferenciaMilisegundos / (24 * 60 * 60 * 1000));
    
    return diasRestantes;
  };

  // Función para procesar los datos del cliente y añadir fechas de vencimiento
  const procesarDatosCliente = (clientesData: Cliente[]): Cliente[] => {
    return clientesData.map(cliente => {
      // Utilizar TELGAR1 como fecha base en formato DD/MM/AAAA
      const fechaBase = parsearFecha(cliente.TELGAR1);
      const fechaVencimiento = calcularFechaVencimiento(fechaBase);
      const diasRestantes = calcularDiasRestantes(fechaVencimiento);
      
      return {
        ...cliente,
        fechaVencimiento,
        diasRestantes
      };
    });
  };

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Intentar obtener datos directamente de la tabla CLIENTES sin consultar el catálogo
        const { data: clientesData, error: clientesError } = await supabase
          .from('CLIENTES')
          .select('*');
        
        if (clientesError) {
          console.error("Error al obtener clientes:", clientesError);
          setError(`Error al cargar clientes: ${clientesError.message}`);
          
          // Si no hay datos, usar datos de ejemplo para demostración
          const datosEjemplo: Cliente[] = [
            { CODIGO: 1, DESC: "Cliente Ejemplo 1", SALD: "Activo", TELGAR1: "01/02/2024", TELGAR2: "555-1234" },
            { CODIGO: 2, DESC: "Cliente Ejemplo 2", SALD: "Inactivo", TELGAR1: "15/02/2024", TELGAR2: "555-5678" }
          ];
          
          const clientesConFechas = procesarDatosCliente(datosEjemplo);
          setClientes(clientesConFechas);
        } else {
          console.log("Datos de CLIENTES:", clientesData);
          
          // Procesar las fechas de vencimiento y días restantes
          const clientesConFechas = procesarDatosCliente(clientesData || []);
          setClientes(clientesConFechas);
        }
      } catch (err) {
        console.error("Error no manejado:", err);
        setError("Error inesperado al cargar datos. Verifica la conexión a la base de datos.");
        
        // Usar datos de ejemplo para demostración en caso de error
        const datosEjemplo: Cliente[] = [
          { CODIGO: 1, DESC: "Cliente Ejemplo 1", SALD: "Activo", TELGAR1: "01/02/2024", TELGAR2: "555-1234" },
          { CODIGO: 2, DESC: "Cliente Ejemplo 2", SALD: "Inactivo", TELGAR1: "15/02/2024", TELGAR2: "555-5678" }
        ];
        
        const clientesConFechas = procesarDatosCliente(datosEjemplo);
        setClientes(clientesConFechas);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientes();
  }, []);

  const agregarCliente = async () => {
    if (!nuevoCliente.CODIGO || !nuevoCliente.DESC) {
      alert("Por favor, completa los campos código y descripción.");
      return;
    }
    
    // Formatear la fecha actual como DD/MM/AAAA si TELGAR1 está vacío
    const fechaActual = new Date();
    const dia = fechaActual.getDate().toString().padStart(2, '0');
    const mes = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaActual.getFullYear();
    
    const clienteConFecha = {
      ...nuevoCliente,
      TELGAR1: nuevoCliente.TELGAR1 || `${dia}/${mes}/${anio}`
    };
    
    try {
      const { error } = await supabase.from("CLIENTES").insert([clienteConFecha]);
      if (error) {
        console.error("Error al agregar cliente:", error);
        alert(`Error al agregar cliente: ${error.message}`);
      } else {
        // Calcular fechas para el nuevo cliente
        const fechaBase = parsearFecha(clienteConFecha.TELGAR1);
        const fechaVencimiento = calcularFechaVencimiento(fechaBase);
        const diasRestantes = calcularDiasRestantes(fechaVencimiento);
        
        const nuevoClienteCompleto = {
          ...clienteConFecha,
          fechaVencimiento,
          diasRestantes
        };
        
        setClientes([...clientes, nuevoClienteCompleto]);
        setNuevoCliente({ CODIGO: 0, DESC: "", SALD: "", TELGAR1: "", TELGAR2: "" });
        alert("Cliente agregado con éxito");
      }
    } catch (err) {
      console.error("Error no manejado al agregar cliente:", err);
      alert("Error inesperado al agregar cliente. Inténtalo de nuevo.");
    }
  };

  const eliminarCliente = async (codigo: number) => {
    try {
      const { error } = await supabase.from("CLIENTES").delete().eq("CODIGO", codigo);
      if (error) {
        console.error("Error al eliminar cliente:", error);
        alert(`Error al eliminar cliente: ${error.message}`);
      } else {
        setClientes(clientes.filter(cliente => cliente.CODIGO !== codigo));
        alert("Cliente eliminado con éxito");
      }
    } catch (err) {
      console.error("Error no manejado al eliminar cliente:", err);
      alert("Error inesperado al eliminar cliente. Inténtalo de nuevo.");
    }
  };

  const iniciarEdicion = (cliente: Cliente) => {
    setClienteEditando(cliente);
  };

  const guardarEdicion = async () => {
    if (!clienteEditando) return;
    
    try {
      const { error } = await supabase.from("CLIENTES").update({
        DESC: clienteEditando.DESC,
        SALD: clienteEditando.SALD,
        TELGAR1: clienteEditando.TELGAR1,
        TELGAR2: clienteEditando.TELGAR2
      }).eq("CODIGO", clienteEditando.CODIGO);
      
      if (error) {
        console.error("Error al editar cliente:", error);
        alert(`Error al editar cliente: ${error.message}`);
      } else {
        // Recalcular fechas para el cliente editado
        const fechaBase = parsearFecha(clienteEditando.TELGAR1);
        const fechaVencimiento = calcularFechaVencimiento(fechaBase);
        const diasRestantes = calcularDiasRestantes(fechaVencimiento);
        
        const clienteEditadoCompleto = {
          ...clienteEditando,
          fechaVencimiento,
          diasRestantes
        };
        
        setClientes(clientes.map(cliente => 
          (cliente.CODIGO === clienteEditando.CODIGO ? clienteEditadoCompleto : cliente)
        ));
        setClienteEditando(null);
        alert("Cliente actualizado con éxito");
      }
    } catch (err) {
      console.error("Error no manejado al editar cliente:", err);
      alert("Error inesperado al editar cliente. Inténtalo de nuevo.");
    }
  };

  const clientesFiltrados = clientes
    .filter(cliente => filtroSald === "todos" || cliente.SALD === filtroSald)
    .filter(cliente => busquedaCodigo === "" || cliente.CODIGO.toString().includes(busquedaCodigo));

  // Filtrar clientes por vencimiento (para notificaciones)
  const clientesPorVencer = clientes.filter(cliente => 
    cliente.diasRestantes !== undefined && cliente.diasRestantes >= 0 && cliente.diasRestantes <= 2
  );

  // Formatear fecha al formato DD/MM/AAAA
  const formatearFecha = (fecha: Date | undefined): string => {
    if (!fecha) return "N/A";
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  return (
    <div className="min-h-screen p-8 bg-yellow-50 text-gray-800">
      <h1 className="text-4xl font-bold text-yellow-700 mb-6 text-center">
        Lista de Clientes
      </h1>
      
      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-6 p-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 rounded-md">
          <p className="font-bold">Advertencia:</p>
          <p>{error}</p>
          <p className="mt-2">La aplicación está funcionando en modo demostración con datos de ejemplo.</p>
        </div>
      )}
      
      {/* Mostrar indicador de carga */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-md flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-3 text-blue-700" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando datos...</span>
        </div>
      )}
      
      {/* Banner de notificaciones */}
      {clientesPorVencer.length > 0 && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">¡Hay {clientesPorVencer.length} cliente(s) con plazo próximo a vencer!</h3>
            <button 
              onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              {mostrarNotificaciones ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
          </div>
          
          {mostrarNotificaciones && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              <table className="w-full bg-white rounded-md overflow-hidden">
                <thead className="bg-red-200">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-left">Fecha Inicio</th>
                    <th className="p-2 text-left">Fecha Vencimiento</th>
                    <th className="p-2 text-left">Días Restantes</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesPorVencer.map(cliente => (
                    <tr key={`notif-${cliente.CODIGO}`} className="border-b hover:bg-red-50">
                      <td className="p-2">{cliente.CODIGO}</td>
                      <td className="p-2">{cliente.DESC}</td>
                      <td className="p-2">{cliente.TELGAR1}</td>
                      <td className="p-2">{formatearFecha(cliente.fechaVencimiento)}</td>
                      <td className="p-2 font-bold">
                        {cliente.diasRestantes === 0 
                          ? '¡HOY!' 
                          : cliente.diasRestantes === 1 
                            ? '¡Mañana!' 
                            : `${cliente.diasRestantes} días`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6 p-6 bg-yellow-200 shadow-lg rounded-xl">
        <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Agregar Cliente</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input 
            type="number" 
            placeholder="Código" 
            value={nuevoCliente.CODIGO || ''} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, CODIGO: parseInt(e.target.value) || 0 })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <input 
            type="text" 
            placeholder="Descripción" 
            value={nuevoCliente.DESC} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, DESC: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <input 
            type="text" 
            placeholder="Saldo" 
            value={nuevoCliente.SALD} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, SALD: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <input 
            type="text" 
            placeholder="Ultima compra (DD/MM/AAAA)" 
            value={nuevoCliente.TELGAR1} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, TELGAR1: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <input 
            type="text" 
            placeholder="Ultimo pago" 
            value={nuevoCliente.TELGAR2} 
            onChange={(e) => setNuevoCliente({ ...nuevoCliente, TELGAR2: e.target.value })} 
            className="p-3 border border-yellow-400 rounded-lg w-full sm:w-auto" 
          />
          <button 
            onClick={agregarCliente} 
            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition"
          >
            Agregar Cliente
          </button>
        </div>
      </div>

      {/* Componente de filtros */}
      <div className="mb-6 p-6 bg-yellow-200 shadow-lg rounded-xl">
        <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Filtros</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-yellow-800 mb-2">Filtrar por saldo:</label>
            <input
              type="text"
              value={filtroSald}
              onChange={(e) => setFiltroSald(e.target.value)}
              placeholder="Ingrese saldo o 'todos'"
              className="p-3 border border-yellow-400 rounded-lg w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-yellow-800 mb-2">Buscar por código:</label>
            <input
              type="text"
              value={busquedaCodigo}
              onChange={(e) => setBusquedaCodigo(e.target.value)}
              placeholder="Ingrese código del cliente"
              className="p-3 border border-yellow-400 rounded-lg w-full"
            />
          </div>
        </div>
      </div>

      {clienteEditando && (
        <div className="mb-6 p-6 bg-yellow-200 shadow-lg rounded-xl">
          <h2 className="text-2xl font-semibold text-yellow-800 mb-4">Editar Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input 
              type="text" 
              value={clienteEditando.DESC} 
              onChange={(e) => setClienteEditando({ ...clienteEditando, DESC: e.target.value })} 
              className="p-3 border border-yellow-400 rounded-lg" 
              placeholder="Descripción"
            />
            <input 
              type="text" 
              value={clienteEditando.SALD} 
              onChange={(e) => setClienteEditando({ ...clienteEditando, SALD: e.target.value })} 
              className="p-3 border border-yellow-400 rounded-lg" 
              placeholder="Saldo"
            />
            <input 
              type="text" 
              value={clienteEditando.TELGAR1} 
              onChange={(e) => setClienteEditando({ ...clienteEditando, TELGAR1: e.target.value })} 
              className="p-3 border border-yellow-400 rounded-lg" 
              placeholder="Fecha Inicial (DD/MM/AAAA)"
            />
            <input 
              type="text" 
              value={clienteEditando.TELGAR2} 
              onChange={(e) => setClienteEditando({ ...clienteEditando, TELGAR2: e.target.value })} 
              className="p-3 border border-yellow-400 rounded-lg" 
              placeholder="Teléfono Garante 2"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={guardarEdicion} 
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
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
        </div>
      )}

      <table className="w-full bg-white shadow-lg rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-yellow-500 text-white">
            <th className="p-4 text-left">Código</th>
            <th className="p-4 text-left">Descripción</th>
            <th className="p-4 text-left">Saldo</th>
            <th className="p-4 text-left">Ultima Compra</th>
            <th className="p-4 text-left">Fecha Vencimiento</th>
            <th className="p-4 text-left">Días Restantes</th>
            <th className="p-4 text-left">Ultimo Pago</th>
            <th className="p-4 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map((cliente) => (
              <tr 
                key={cliente.CODIGO} 
                className={`border-b hover:bg-yellow-100 ${
                  cliente.diasRestantes !== undefined && cliente.diasRestantes <= 2 && cliente.diasRestantes >= 0
                    ? 'bg-red-100'
                    : ''
                }`}
              >
                <td className="p-4">{cliente.CODIGO}</td>
                <td className="p-4">{cliente.DESC}</td>
                <td className="p-4">{cliente.SALD}</td>
                <td className="p-4">{cliente.TELGAR1}</td>
                <td className="p-4">{formatearFecha(cliente.fechaVencimiento)}</td>
                <td className={`p-4 font-semibold ${
                  cliente.diasRestantes !== undefined && cliente.diasRestantes <= 2 && cliente.diasRestantes >= 0
                    ? 'text-red-600'
                    : cliente.diasRestantes !== undefined && cliente.diasRestantes < 0
                      ? 'text-red-800'
                      : 'text-green-600'
                }`}>
                  {cliente.diasRestantes !== undefined
                    ? cliente.diasRestantes < 0
                      ? 'Vencido'
                      : cliente.diasRestantes === 0
                        ? '¡HOY!'
                        : `${cliente.diasRestantes} días`
                    : 'N/A'}
                </td>
                <td className="p-4">{cliente.TELGAR2}</td>
                <td className="p-4">
                  <button 
                    onClick={() => iniciarEdicion(cliente)} 
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => eliminarCliente(cliente.CODIGO)} 
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">
                {loading ? "Cargando datos..." : "No se encontraron clientes con los filtros aplicados"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}