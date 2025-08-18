import type { AppProps } from "next/app";
import { AuthProvider } from "../lib/auth";
import Header from "../components/Header";
import "../styles/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Header />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
