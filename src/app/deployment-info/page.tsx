
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DeploymentInfoPage() {
  // These environment variables are automatically set by Firebase App Hosting.
  const appId = process.env.APP_ID || '[Could not determine App ID]';
  const backendId = process.env.GAE_SERVICE || '[Could not determine Backend ID]';
  const location = process.env.GAE_REGION || '[Could not determine Location]';
  
  // The URL format for App Hosting is well-defined.
  const hostingUrl = `https://${appId}.web.app`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Deployment Information</CardTitle>
          <CardDescription>
            This page provides details about your live deployment on Firebase App Hosting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-col space-y-1">
            <span className="font-semibold text-muted-foreground">Live URL</span>
            <Link 
              href={hostingUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-mono text-primary hover:underline flex items-center gap-2"
            >
              {hostingUrl}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold text-muted-foreground">Firebase Project (App ID)</span>
            <p className="font-mono">{appId}</p>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="font-semibold text-muted-foreground">App Hosting Backend ID</span>
            <p className="font-mono">{backendId}</p>
          </div>
           <div className="flex flex-col space-y-1">
            <span className="font-semibold text-muted-foreground">Region</span>
            <p className="font-mono">{location}</p>
          </div>
           <div className="pt-4 text-xs text-muted-foreground">
             <p>Bookmark this page (`/deployment-info`) for easy access to your live URL after every deployment.</p>
           </div>
        </CardContent>
      </Card>
    </main>
  );
}
