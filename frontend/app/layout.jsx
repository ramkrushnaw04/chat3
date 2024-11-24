"use client";

import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "react-redux";
import store from "./store/store";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, useTheme } from "next-themes";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function ThemedToastContainer() {
  const { theme } = useTheme();

  return <ToastContainer position="bottom-right" theme={theme === "dark" ? "dark" : "light"} />;
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class">
          <Provider store={store}>
            {children}
            <ThemedToastContainer />
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
