import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'Notara — Aprende inglés con música',
  description: 'Plataforma de aprendizaje de inglés usando canciones de Spotify e IA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
