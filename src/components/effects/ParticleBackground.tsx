export const ParticleBackground = () => {
  return (
    <>
      {/* Static dark gradient base */}
      <div className="fixed inset-0 -z-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a0a] to-[#0a0505]" />
        {/* Subtle static red radial glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 30% 40%, hsl(0 70% 15% / 0.15) 0%, transparent 60%), radial-gradient(ellipse at 75% 65%, hsl(0 60% 12% / 0.1) 0%, transparent 55%)',
          }}
        />
      </div>

      {/* Grid pattern */}
      <div className="fixed inset-0 grid-pattern opacity-20 -z-20" />
    </>
  );
};
