import TopbarComponent from "@/app/components/topbar";

import logo from "@/public/branding/logo.svg"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TopbarComponent />
      {children}
    </>
  );
}
