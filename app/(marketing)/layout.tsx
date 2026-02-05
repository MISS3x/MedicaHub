import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MedicaHub",
    description: "Centrální správa aplikací pro lékaře",
};

export default function MarketingRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="cs" className="light">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
