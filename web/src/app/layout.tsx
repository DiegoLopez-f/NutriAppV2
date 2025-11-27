import './globals.css'; // Asegúrate de importar tus estilos globales
import Layout from '../components/Layout'; // Ajusta la ruta

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
        <body>
        {/* Aquí envuelves el contenido con tu nuevo Layout */}
        <Layout>
            {children}
        </Layout>
        </body>
        </html>
    );
}