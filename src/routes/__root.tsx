import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SessionProvider } from "@/lib/session";
import { OfflineBanner } from "@/components/OfflineBanner";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Swasthya Sathi — Your health companion" },
      { name: "description", content: "Voice-first rural health triage for patients and digital workflows for ASHA workers across India." },
      { name: "author", content: "Swasthya Sathi" },
      { property: "og:title", content: "Swasthya Sathi — Your health companion" },
      { property: "og:description", content: "Voice-first rural health triage for patients and digital workflows for ASHA workers across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Swasthya Sathi — Your health companion" },
      { name: "twitter:description", content: "Voice-first rural health triage for patients and digital workflows for ASHA workers across India." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4581216f-d85f-4ba8-9e28-7ea9c1b5823b/id-preview-5685d9e3--d9cf1b39-ecde-4dc2-a13d-4ed2e5250b60.lovable.app-1776630204286.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4581216f-d85f-4ba8-9e28-7ea9c1b5823b/id-preview-5685d9e3--d9cf1b39-ecde-4dc2-a13d-4ed2e5250b60.lovable.app-1776630204286.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <SessionProvider>
      <OfflineBanner />
      <Outlet />
      <Toaster position="top-center" />
    </SessionProvider>
  );
}
