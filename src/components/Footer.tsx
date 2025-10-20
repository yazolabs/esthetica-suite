import yazolabsLogo from '@/assets/yazolabs-logo.svg';

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <img 
              src={yazolabsLogo} 
              alt="Yazo Labs" 
              className="h-6 w-auto"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <a 
              href="https://yazolabs.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              yazolabs.com.br
            </a>
            <span className="hidden sm:inline">•</span>
            <a 
              href="mailto:contato@yazolabs.com.br"
              className="hover:text-foreground transition-colors"
            >
              contato@yazolabs.com.br
            </a>
            <span className="hidden sm:inline">•</span>
            <span>© 2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
