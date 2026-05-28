import { Bell, Lock, User, HelpCircle, LogOut } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile & Name" },
      { icon: Lock, label: "Password & Security" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help & FAQ" },
      { icon: LogOut, label: "Sign Out", danger: true },
    ],
  },
];

export function SalsaSettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Profile card */}
      <div className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
        <img
          src="https://i.pravatar.cc/64?img=3"
          alt="Jon"
          className="w-14 h-14 rounded-full object-cover border-2 border-red-500/30"
        />
        <div>
          <div className="font-semibold text-lg">Jon Salinas</div>
          <div className="text-sm text-white/40">jon@salsanotes.io</div>
          <span className="inline-block mt-1 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
            PRO PLAN
          </span>
        </div>
      </div>

      {SETTINGS_SECTIONS.map((section) => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 px-1">
            {section.title}
          </h2>
          <div className="bg-[#161616] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {section.items.map(({ icon: Icon, label, danger }: any) => (
              <button
                key={label}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-white/5 transition-colors text-left ${
                  danger ? "text-red-400" : "text-white/80"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
