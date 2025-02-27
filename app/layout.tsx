import type { ReactNode } from "react";
export const metadata = {
  title: "Gestión de Clientes",
  description: "Administra y lleva el control de tus clientes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
