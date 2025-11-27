import React from 'react';
import Link from 'next/link';

interface ButtonRoleProps {
    children: React.ReactNode;
    color?: 'primary' | 'secondary';
    onClick?: () => void;
}

export default function ButtonRole({ children, color = 'primary', onClick }: ButtonRoleProps) {
    const baseStyles = 'w-full py-4 px-6 text-white font-bold text-lg rounded-xl transition duration-300 shadow-md transform hover:scale-[1.02]';
    const colorStyles = color === 'primary'
        ? 'bg-[#059669] hover:bg-[#10B981] hover:shadow-green-400/40'
        : 'bg-[#4ADE80] hover:bg-[#86efac] hover:shadow-green-300/30';

    return (
        <button className={`${baseStyles} ${colorStyles}`} onClick={onClick}>
            {children}
        </button>
    );
}