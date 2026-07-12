import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "GitDeo — Turn Code Into Showcase Videos",
  description: "Paste an Arduino sketch or C++ file and get a rendered showcase video back.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
