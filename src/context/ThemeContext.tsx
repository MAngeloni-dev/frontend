"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const STORAGE_KEY = "theme";
const THEME_EVENT = "crm-theme-change";

const ThemeContext = createContext<
  ThemeContextType | undefined
>(undefined);

// Conserva el cambio durante esta sesión si el navegador
// no permite acceder a localStorage.
let temaTemporal: Theme | undefined;

function obtenerTema(): Theme {
  if (temaTemporal) {
    return temaTemporal;
  }

  try {
    const guardado = window.localStorage.getItem(STORAGE_KEY);

    if (guardado === "light" || guardado === "dark") {
      return guardado;
    }
  } catch {
    // Usamos la preferencia del sistema.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function obtenerTemaServidor(): Theme {
  return "light";
}

function suscribirse(notificar: () => void) {
  const preferencia = window.matchMedia(
    "(prefers-color-scheme: dark)",
  );

  function cambioDeAlmacenamiento(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) {
      temaTemporal = undefined;
      notificar();
    }
  }

  window.addEventListener("storage", cambioDeAlmacenamiento);
  window.addEventListener(THEME_EVENT, notificar);
  preferencia.addEventListener("change", notificar);

  return () => {
    window.removeEventListener("storage", cambioDeAlmacenamiento);
    window.removeEventListener(THEME_EVENT, notificar);
    preferencia.removeEventListener("change", notificar);
  };
}

function alternarTema() {
  const siguiente: Theme =
    obtenerTema() === "light" ? "dark" : "light";

  try {
    window.localStorage.setItem(STORAGE_KEY, siguiente);
    temaTemporal = undefined;
  } catch {
    temaTemporal = siguiente;
  }

  // El evento storage solo se dispara en otras pestañas.
  // Este evento actualiza la pestaña actual.
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const theme = useSyncExternalStore(
    suscribirse,
    obtenerTema,
    obtenerTemaServidor,
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark",
    );

    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme: alternarTema }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme debe utilizarse dentro de ThemeProvider",
    );
  }

  return context;
}