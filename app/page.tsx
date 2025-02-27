import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Gestión de Clientes</h1>
      <p className="text-lg text-gray-600 mb-4">
        Administra y lleva el control de tus clientes fácilmente.
      </p>
      <Link href="/clientes">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
          Ir a Clientes
        </button>
      </Link>
    </div>
  );
}
