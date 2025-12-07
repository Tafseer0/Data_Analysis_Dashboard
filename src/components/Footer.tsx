import React from "react";

export default function Footer() {
  return (
    <footer className="bg-muted/50 dark:bg-muted-800/40 border-t border-muted-200 dark:border-muted-700 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Branding / short description */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 dark:bg-primary/20 overflow-hidden">
            <img
                src="/images/data-science.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
            />
        </div>

            

            <div>
              <p className="text-sm font-semibold">Data Analysis Dashboard</p>
              <p className="text-xs text-muted-foreground">Clean insights for smarter decisions</p>
            </div>
          </div>

          {/* Middle: Links */}
          <nav className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm hover:underline text-muted-foreground"
              aria-label="Documentation"
            >
              Docs
            </a>
            <a

              href="https://github.com/Tafseer0"
              target="_blank"
              className="text-sm hover:underline text-muted-foreground"
              aria-label="GitHub repository"
            >
              Github
            </a>
            
            <a
              href="https://www.linkedin.com/in/tafseeralam/"
              target="_blank"
              className="text-sm hover:underline text-muted-foreground"
              aria-label="Linkedin profile"
            >
              Linkedin
            </a>    
          </nav>

          {/* Right: Built-by + small copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm">
              Built with ❤️ by <span className="font-medium">Tafseer Alam</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">© {new Date().getFullYear()} Tafseer Alam. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
