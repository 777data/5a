'use client';

import { useEffect } from 'react';

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Conditions d\'utilisation - 5A';
  }, []);

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Conditions d'utilisation</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Bienvenue sur 5A (Advanced Automated API Auditing & Assessment). En utilisant notre application, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Description du service</h2>
        <p>
          5A est une plateforme permettant de tester, auditer et évaluer des API. Notre service vous permet de créer et gérer des collections d'API, d'exécuter des tests sur ces API et d'analyser les résultats.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Conditions d'utilisation</h2>
        <p>
          En utilisant 5A, vous vous engagez à :
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Fournir des informations exactes lors de l'utilisation du service</li>
          <li>Utiliser le service conformément aux lois et réglementations applicables</li>
          <li>Ne pas abuser des ressources système ou réseau</li>
          <li>Ne pas utiliser le service pour des activités illégales ou nuisibles</li>
          <li>Respecter les droits de propriété intellectuelle</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Compte utilisateur</h2>
        <p>
          Pour utiliser certaines fonctionnalités de 5A, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos identifiants et de toutes les activités qui se produisent sous votre compte.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Propriété intellectuelle</h2>
        <p>
          Tous les droits de propriété intellectuelle relatifs à 5A, y compris les textes, graphiques, logos, icônes et logiciels, sont la propriété de Leonaar. Rien dans ces conditions ne vous confère un droit, titre ou intérêt dans 5A autre que le droit d'utiliser le service conformément aux présentes conditions.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Limitation de responsabilité</h2>
        <p>
          5A est fourni "tel quel" sans garantie d'aucune sorte. Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou exempt d'erreurs. En aucun cas, Leonaar ne sera responsable des dommages indirects, spéciaux, consécutifs ou punitifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Protection des données</h2>
        <p>
          Nous nous engageons à protéger vos données personnelles. Notre utilisation de vos données est régie par notre politique de confidentialité.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Résiliation</h2>
        <p>
          Nous nous réservons le droit de suspendre ou de résilier votre accès à 5A, à tout moment et pour quelque raison que ce soit, sans préavis.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Modifications des conditions</h2>
        <p>
          Nous pouvons modifier ces conditions d'utilisation à tout moment. Votre utilisation continue du service après la publication des conditions modifiées constitue votre acceptation de ces modifications.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Loi applicable</h2>
        <p>
          Ces conditions sont régies par les lois françaises. Tout litige relatif à ces conditions sera soumis à la compétence exclusive des tribunaux de Paris, France.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">11. Contact</h2>
        <p>
          Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à : contact@leonaar.com
        </p>
        
        <div className="mt-8">
          <p className="italic">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
} 