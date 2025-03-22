import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-4 px-6 border-t bg-gray-50">
      <div className="container mx-auto flex flex-col md:flex-row justify-center md:justify-between items-center gap-2">
        <p className="text-sm text-gray-600">
          © {currentYear} Leonaar. Tous droits réservés.
        </p>
        <div className="flex space-x-4 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-900 transition-colors">Conditions d&apos;utilisation</Link>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">Politique de confidentialité</Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
} 