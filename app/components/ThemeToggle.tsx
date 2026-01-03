'use client';

import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={clsx(
                "p-2 rounded-lg transition-all duration-200",
                theme === 'dark'
                    ? "bg-secondary text-yellow-400 hover:bg-secondary/80"
                    : "bg-secondary text-primary hover:bg-secondary/80"
            )}
            title={theme === 'dark' ? "Açık Mod'a geç" : "Koyu Mod'a geç"}
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
}
