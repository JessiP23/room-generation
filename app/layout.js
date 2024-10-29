import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"
import myIcon from '../public/3d.png'
import Image from "next/image";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "3D Room Generation",
  description: "3D app that generates 3d room in different environments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/3d.png" type="image/png"/>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <div style={{ position: 'fixed', bottom: '10px', right: '10px' }}>
          <Image 
            src={myIcon} 
            alt="Custom Analytics Icon" 
            width={40} 
            height={40} 
          />

        </div>
      </body>
    </html>
  );
}
