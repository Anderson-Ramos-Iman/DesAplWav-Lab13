import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import LogoutButton from "../components/LogoutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Image from "next/image";
import Provider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next Auth App",
  description: "My Next Auth App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="w-full bg-black shadow-sm">
          <div className="mx-auto flex items-center justify-between px-6 py-4">
            <Link href="/" className="text-xl font-semibold">
              MyAuthApp
            </Link>

            <ul className="flex items-center justify-center gap-6 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-gray-600">
                  Dashboard
                </Link>
              </li>

              {session?.user && (
                <li>
                  <Link href="/profile" className="hover:text-gray-600">
                    Profile
                  </Link>
                </li>
              )}

              {!session?.user && (
                <li>
                  <Link href="/signIn" className="hover:text-gray-600">
                    Sign In
                  </Link>
                </li>
              )}

              {session?.user && (
                <li>
                  <LogoutButton />
                </li>
              )}

              {session?.user?.image && (
                <li>
                  <Image
                    height={100}
                    width={100}
                    src={session.user.image}
                    alt="Profile"
                    className="h-10 w-10 rounded-full"
                  />
                </li>
              )}
            </ul>
          </div>
        </nav>

        <Provider session={session}>
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  );
}
