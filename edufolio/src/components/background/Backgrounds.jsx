import AuroraCanvas from './AuroraCanvas';

function Glow({ className, color, size = 480 }) {
  return (
    <div
      className={`absolute rounded-full blur-[120px] ${className}`}
      style={{ width: size, height: size, background: color, opacity: 0.22 }}
      aria-hidden="true"
    />
  );
}

/** 0–5s cinematic light opening before the app dissolves into Midnight. */
export function SplashBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(160deg,#F8F7F4,#EEEAF6)' }}>
      <div className="grain-overlay" />
      <Glow className="left-1/4 top-1/3" color="#7C3AED" size={360} />
      <Glow className="right-1/4 bottom-1/4" color="#22D3EE" size={320} />
      <AuroraCanvas mode="constellation" intensity="light" colors={['#7C3AED', '#22D3EE']} />
    </div>
  );
}

/** Digital Achievement Universe — strong interactive 3D grid + role glows. */
export function RoleSelectionBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-[8%] top-[20%]" color="#14B8A6" />
      <Glow className="left-1/2 top-[10%] -translate-x-1/2" color="#7C3AED" />
      <Glow className="right-[8%] top-[20%]" color="#E07A3F" />
      <AuroraCanvas mode="grid" intensity="strong" colors={['#7C3AED', '#22D3EE', '#A78BFA']} />
    </div>
  );
}

/** Light orbital motion, tinted per role. */
export function AuthBackground({ accent = 'violet' }) {
  const map = {
    teal: ['#14B8A6', '#5EEAD4'],
    violet: ['#7C3AED', '#A78BFA'],
    copper: ['#E07A3F', '#F4A261'],
    cyan: ['#38BDF8', '#22D3EE']
  };
  const colors = map[accent] ?? map.violet;
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2" color={colors[0]} size={520} />
      <AuroraCanvas mode="orbital" intensity="light" colors={colors} />
    </div>
  );
}

/** Minimal signal atmosphere for Forgot/Reset password. */
export function SecurityBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="#7C3AED" size={380} />
      <AuroraCanvas mode="particles" intensity="minimal" colors={['#22D3EE', '#A78BFA']} />
    </div>
  );
}

/** Premium Digital Hall of Achievement — beams tinted by rank metals. */
export function LeaderboardBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-[15%] top-0" color="#E8C66A" size={260} />
      <Glow className="left-1/2 top-0 -translate-x-1/2" color="#BFC9D9" size={220} />
      <Glow className="right-[15%] top-0" color="#C9826B" size={260} />
      <AuroraCanvas mode="beams" intensity="medium" colors={['#E8C66A', '#BFC9D9', '#C9826B']} />
    </div>
  );
}

/** Personal Achievement Universe for a student's profile. */
export function ProfileBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-[10%] top-[15%]" color="#14B8A6" size={340} />
      <Glow className="right-[10%] bottom-[15%]" color="#22D3EE" size={340} />
      <AuroraCanvas mode="constellation" intensity="medium" colors={['#14B8A6', '#7C3AED', '#22D3EE']} />
    </div>
  );
}

/** Light ambient motion for dashboards. */
export function DashboardBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-1/3 top-0" color="#7C3AED" size={300} />
      <AuroraCanvas mode="particles" intensity="light" colors={['#7C3AED', '#22D3EE']} />
    </div>
  );
}

/** Minimal-motion workspace atmosphere for forms (register / log achievement / add faculty). */
export function FormBackground({ variant = 'registration' }) {
  const map = {
    registration: ['#7C3AED', '#22D3EE'],
    achievement: ['#A78BFA', '#22D3EE'],
    faculty: ['#7C3AED', '#22D3EE']
  };
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-1/4 bottom-0" color={map[variant][0]} size={280} />
      <Glow className="right-1/4 top-0" color={map[variant][1]} size={240} />
      <AuroraCanvas mode="particles" intensity="minimal" colors={map[variant]} />
    </div>
  );
}

/** Almost static ambient zones tinted by role, used on Manage Roles / Settings. */
export function StaticRoleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-midnight-deep">
      <Glow className="left-[12%] top-1/2 -translate-y-1/2" color="#14B8A6" size={260} />
      <Glow className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="#7C3AED" size={260} />
      <Glow className="right-[12%] top-1/2 -translate-y-1/2" color="#E07A3F" size={260} />
    </div>
  );
}
