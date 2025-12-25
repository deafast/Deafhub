'use client';

import { View, PerspectiveCamera, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import { useRef } from 'react';

export default function AvatarView({ className }: { className?: string }) {
    const container = useRef<HTMLDivElement>(null!);

    return (
        <div ref={container} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${className}`}>
            <View track={container} className="h-full w-full">
                <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={40} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#22D3EE" />
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh>
                        <sphereGeometry args={[1, 64, 64]} />
                        <MeshDistortMaterial
                            color="#22D3EE"
                            speed={2}
                            distort={0.3}
                            roughness={0.1}
                            metalness={0.8}
                        />
                    </mesh>
                </Float>
                <Environment preset="city" />
            </View>
        </div>
    );
}
