import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Contact</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-semibold mb-4">Nous contacter</h2>
          <p className="text-gray-600 mb-6">
            Vous avez des questions, des suggestions ou besoin d'assistance ? 
            N'hésitez pas à nous contacter en utilisant le formulaire ci-contre ou 
            directement via notre adresse email ci-dessous.
          </p>
          
          <div className="space-y-4 mt-8">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-gray-600">contact@leonaar.com</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="font-medium mb-2">À propos de 5A</h3>
            <p className="text-gray-600">
              5A (Advanced Automated API Auditing & Assessment) est une solution 
              complète pour tester, auditer et évaluer vos APIs. Notre plateforme 
              vous aide à garantir la qualité, la sécurité et la performance de 
              vos interfaces de programmation.
            </p>
          </div>
          
          <div className="mt-8">
            <h3 className="font-medium mb-2">Support technique</h3>
            <p className="text-gray-600">
              Notre équipe de support est disponible pour répondre à vos questions
              et vous aider à résoudre tout problème que vous pourriez rencontrer
              avec notre plateforme.
            </p>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Envoyez-nous un message</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nom complet
              </label>
              <Input
                id="name"
                placeholder="Votre nom"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre-email@exemple.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">
                Sujet
              </label>
              <Input
                id="subject"
                placeholder="Sujet de votre message"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Votre message..."
                className="min-h-[150px]"
                required
              />
            </div>
            
            <div className="pt-2">
              <Button type="submit" className="w-full">
                Envoyer le message
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                En soumettant ce formulaire, vous acceptez notre <a href="/privacy" className="underline hover:text-gray-700">politique de confidentialité</a>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 