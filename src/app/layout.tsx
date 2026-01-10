import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
    title: "CineMind | Your AI Film Director",
    description: "Advanced AI-powered cinematography and directorial guidance.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body suppressHydrationWarning>
                <div className="cinematic-bg"></div>
                {children}
            </body>
        </html>
    );
}
