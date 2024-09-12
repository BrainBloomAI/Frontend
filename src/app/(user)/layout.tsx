import TopbarComponent from "@/app/components/topbar";

import logo from "@/public/branding/logo.svg"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    <div id="guest-bg" className="p-9 flex flex-col bg-white h-svh">
      <TopbarComponent />
      {children}
      </div>
      
    </>
  );

}
