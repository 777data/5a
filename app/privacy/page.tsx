export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Politique de confidentialité</h1>
      
      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Cette politique de confidentialité explique comment 5A (Advanced Automated API Auditing & Assessment) collecte, utilise et protège les informations que vous nous fournissez lorsque vous utilisez notre service.
        </p>
        <p>
          Nous nous engageons à assurer la protection de votre vie privée. Si nous vous demandons de fournir certaines informations permettant de vous identifier lors de l'utilisation de 5A, vous pouvez être assuré qu'elles ne seront utilisées que conformément à la présente politique de confidentialité.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">2. Informations collectées</h2>
        <p>
          Nous pouvons collecter les informations suivantes :
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Nom et prénom</li>
          <li>Adresse e-mail professionnelle</li>
          <li>Informations sur votre organisation</li>
          <li>Préférences et configurations d'utilisation</li>
          <li>Informations techniques sur les API testées</li>
          <li>Données d'utilisation et de performances</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">3. Utilisation des informations</h2>
        <p>
          Ces informations sont collectées pour comprendre vos besoins et vous fournir un meilleur service. En particulier, nous utilisons ces informations pour :
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Gérer votre compte et personnaliser votre expérience</li>
          <li>Améliorer nos produits et services</li>
          <li>Envoyer des communications périodiques concernant des mises à jour ou des informations liées au service</li>
          <li>Améliorer la sécurité et prévenir la fraude</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">4. Sécurité</h2>
        <p>
          Nous nous engageons à garantir la sécurité de vos informations. Afin d'empêcher tout accès non autorisé ou divulgation, nous avons mis en place des procédures physiques, électroniques et de gestion appropriées pour sauvegarder et sécuriser les informations que nous collectons en ligne.
        </p>
        <p>
          Les données relatives aux API testées sont traitées de manière confidentielle et ne sont accessibles qu'aux utilisateurs autorisés de votre organisation.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">5. Cookies et technologies similaires</h2>
        <p>
          Un cookie est un petit fichier placé sur le disque dur de votre ordinateur. 5A utilise des cookies pour :
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Mémoriser vos préférences d'utilisation</li>
          <li>Comprendre comment vous utilisez notre application</li>
          <li>Améliorer l'expérience utilisateur et l'efficacité du service</li>
        </ul>
        <p>
          Vous pouvez choisir d'accepter ou de refuser les cookies. La plupart des navigateurs Web acceptent automatiquement les cookies, mais vous pouvez généralement modifier les paramètres de votre navigateur pour refuser les cookies si vous le préférez.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">6. Partage des informations</h2>
        <p>
          Nous ne vendons, n'échangeons ni ne transférons vos informations personnelles identifiables à des tiers. Cela n'inclut pas les tiers de confiance qui nous aident à exploiter notre site Web ou à mener nos activités, tant que ces parties acceptent de garder ces informations confidentielles.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">7. Conservation des données</h2>
        <p>
          Vos données personnelles sont conservées uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées et dans le respect des dispositions légales et réglementaires applicables.
        </p>
        <p>
          Les résultats des tests API sont conservés selon vos paramètres de rétention configurés dans l'application, avec une période par défaut de 12 mois.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">8. Vos droits</h2>
        <p>
          Conformément aux réglementations sur la protection des données, vous disposez des droits suivants concernant vos données personnelles :
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Droit d'accès à vos données</li>
          <li>Droit de rectification des informations inexactes</li>
          <li>Droit à l'effacement de vos données</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité des données</li>
          <li>Droit d'opposition au traitement</li>
        </ul>
        <p>
          Pour exercer ces droits, veuillez nous contacter à l'adresse indiquée à la fin de cette politique.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">9. Modifications de notre politique de confidentialité</h2>
        <p>
          Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page et, si les modifications sont importantes, nous vous fournirons une notification plus visible.
        </p>
        
        <h2 className="text-xl font-semibold mt-8 mb-4">10. Contact</h2>
        <p>
          Si vous avez des questions concernant cette politique de confidentialité ou vos données personnelles, veuillez nous contacter à :
        </p>
        <p>
          contact@leonaar.com
        </p>
        
        <div className="mt-8">
          <p className="italic">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
} 