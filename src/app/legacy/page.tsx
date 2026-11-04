'use client';
import Workflow from '@/components/Workflow';
import { useRouter } from 'next/navigation';
export default function LegacyPage() { const router = useRouter(); return <Workflow onBack={() => router.push('/dashboard')} />; }
