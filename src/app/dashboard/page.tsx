"use client";

import Workflow from "@/components/Workflow";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    const handleBack = () => {
        router.push("/");
    };

    return <Workflow onBack={handleBack} />;
}
