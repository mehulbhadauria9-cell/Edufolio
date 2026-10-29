import Sidebar from './Sidebar';

export default function AppLayout({ background, children }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0B0F17]">
      {background}
      <Sidebar />
      <main className="relative z-10 mx-auto w-full max-w-[1700px] px-4 sm:px-8 lg:px-12 xl:px-16 pb-16 pt-20">{children}</main>
    </div>
  );
}
