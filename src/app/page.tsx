"use client";

import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import Workflow from "@/components/Workflow";

export default function Home() {
    const [page, setPage] = useState<"landing" | "workflow">("landing");

    return (
        <main>
            {page === "landing" ? (
                <LandingPage onStart={() => setPage("workflow")} />
            ) : (
                <Workflow onBack={() => setPage("landing")} />
            )}
        </main>
    );
}
