export default function AuthPageLayout({ children }) {
  return (
    <div className="min-h-screen w-full flex bg-[#F9FAFB]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }

        @keyframes scanSweep {
          0%   { transform: translateY(-10%); opacity: 0; }
          8%   { opacity: 0.55; }
          50%  { opacity: 0.55; }
          92%  { opacity: 0; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        .scan-line { animation: scanSweep 5.5s ease-in-out infinite; }
        .live-dot { animation: livePulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .scan-line, .live-dot { animation: none; }
        }
      `}</style>

      {/* Left — form panel */}
      <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col justify-center px-8 sm:px-12 py-12 shrink-0">
        <div className="w-full max-w-sm mx-auto">
          {/* Brand mark */}
          <div className="flex items-center gap-2.5 mb-10">
            <img
              src="/logo.png"
              alt="Tomnenh KH"
              width="34"
              height="34"
              className="shrink-0 rounded-lg object-cover"
            />
            <div>
              <div className="font-display font-semibold text-[19px] leading-none text-[#10151F]">
                Tomnenh KH
              </div>
              <div className="font-mono text-[10px] tracking-[0.14em] text-[#8B92A3] mt-1 uppercase">
                Inventory OS
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>

      {/* Right — warehouse image panel */}
      <div className="hidden lg:block relative flex-1 overflow-hidden rounded-l-[32px] m-3">
        <img
          src="https://res.cloudinary.com/drercy9vt/image/upload/v1784103663/Retail-storage_dua5ed.webp"
          alt="DigiLife warehouse floor"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#10151F]/80 via-[#10151F]/35 to-[#10151F]/85" />
        <div className="absolute inset-0 bg-[#1E3FA6]/25" />

        <div className="absolute inset-x-0 top-0 h-24 pointer-events-none overflow-hidden">
          <div className="scan-line h-px w-full bg-gradient-to-r from-transparent via-[#F4972B] to-transparent shadow-[0_0_18px_2px_rgba(244,151,43,0.7)]" />
        </div>

        <div className="absolute top-8 right-8 text-right">
          <div className="font-display font-semibold text-[22px] text-white/90">
            TOMNENH KH
          </div>
          <div className="font-mono text-[10px] tracking-[0.14em] text-white/50 uppercase mt-0.5">
            Inventory Solutions
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-10">
          <h2 className="font-display font-semibold text-[34px] leading-[1.15] text-white max-w-md mb-3">
            Know what's on every shelf, every second.
          </h2>
          <p className="font-body text-[14px] text-white/70 max-w-sm mb-7">
            Real-time counts across every warehouse, synced the moment stock
            moves.
          </p>

          <div className="flex items-center gap-2 font-mono text-[12px] text-white/80 border-t border-white/15 pt-5">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#4ADE80] inline-block" />
            <span>LIVE</span>
            <span className="text-white/30 mx-1">·</span>
            <span>12,480 SKUs tracked</span>
            <span className="text-white/30 mx-1">·</span>
            <span>24 sites</span>
            <span className="text-white/30 mx-1">·</span>
            <span>99.9% sync uptime</span>
            <span className="text-white/30 mx-1">·</span>
            <span>Engineered, Designed & Developed with Care by SanTin ❤️</span>
          </div>
        </div>
      </div>
    </div>
  );
}