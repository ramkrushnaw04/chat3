"use client"

import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "react-redux";
import store from "./store/store";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from 'next-themes';


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


// export const metadata = {
//     title: "Chat3",
//     description: "A seamless and modern chat application.",
//   };


export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <ThemeProvider attribute="class">
                    <Provider store={store}>
                        {children}
                        <ToastContainer position="bottom-right" theme="light" />
                    </Provider>
                </ThemeProvider>
            </body>
        </html>
    );
}
