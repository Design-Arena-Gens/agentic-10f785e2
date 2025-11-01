import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Part Search Agent",
  description: "Search part name/number across selected websites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="header">
            <h1 className="h1">Part Search Agent</h1>
            <div className="badge">Fast site-scoped search</div>
          </div>
          {children}
          <div className="footer small">
            Tip: Add domains like example.com then search by part name and number.
          </div>
        </div>
      </body>
    </html>
  );
}
