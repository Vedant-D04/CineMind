import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
    title: "CineMind 2.0 | Your Filmmaking Copilot",
    description: "Translate your intention into cinematic shots. Explore options, review frames, and stay in creative control.",
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
