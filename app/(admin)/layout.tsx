import type { Metadata } from "next";
import { Inter } from "next/font/google"; // duplicating font load is fine
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MedicaHub Admin",
    description: "Administrace systému",
};

export default function AdminRootLayout({
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
