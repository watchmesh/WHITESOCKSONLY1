import { SpeedInsights } from '@vercel/speed-insights/next';
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
import { Analytics } from '@vercel/analytics/next';
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Next.js</title>
      </head>
      <body>
        {children}
        <Analytics beforeSend={(e) => {
          // if url includes 'private' then dont proceed with analytics
          if(e.url.includes('private')) return null
          return e
        }}/>
      </body>
    </html>
  );
}