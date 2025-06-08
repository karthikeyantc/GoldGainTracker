
"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react" // Added Laptop icon
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else { // Covers 'system' and handles potential undefined initial state if needed
      setTheme('light');
    }
  };

  // Wait until mounted to prevent hydration mismatch
  if (!mounted) {
    // Render a placeholder or a disabled button
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
      {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
      {theme === 'system' && <Laptop className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />}
      <span className="sr-only">Toggle theme (Currently: {theme})</span>
    </Button>
  )
}
