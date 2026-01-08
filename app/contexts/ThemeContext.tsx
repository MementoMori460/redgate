'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { updateUserTheme } from '../actions/user-settings';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode, initialTheme?: string | null }) {
    const [theme, setTheme] = useState<Theme>(() => {
        // Use initialTheme from DB if available, valid, else fallback
        if (initialTheme === 'dark' || initialTheme === 'light') return initialTheme;
        return 'dark'; // Default
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        // Persist to DB
        updateUserTheme(newTheme).catch(err => console.error('Failed to persist theme:', err));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
