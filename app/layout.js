"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0c234c",
    },
    secondary: {
      main: "#333",
    },
    background: {
      default: "#0c234c",
      paper: "#1b1b1b",
    },
    text: {
      primary: "#f9f6f6",
      secondary: "#ffffff",
    },
  },
  typography: {
    fontFamily: "Arial, sans-serif",
  },
});

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
