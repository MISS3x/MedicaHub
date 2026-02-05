import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MedicaHub - Přihlašování",
    description: "Vstup do systému",
};

export default function AuthRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="cs" className="light">
            <body className={inter.className}>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                    {children}
                </div>
            </body>
        </html>
    );
}
