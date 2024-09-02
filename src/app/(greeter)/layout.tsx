import logo from "@/public/branding/logo.svg"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div id="guest-bg" className="p-8 flex flex-col bg-white h-svh">
        <figure className="w-full basis-24 grow-0 shrink min-h-0 p-4 mb-24">
          <img src={logo.src} className="h-full w-full object-contain" />
        </figure>
        {children}
      </div>
    </>
  );
}
