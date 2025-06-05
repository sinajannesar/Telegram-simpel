// src/components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { type ThemeProviderProps as NextThemeProviderProps } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: NextThemeProviderProps["attribute"];
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}