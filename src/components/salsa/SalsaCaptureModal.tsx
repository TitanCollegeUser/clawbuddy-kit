import { X, Camera, Upload, Youtube, HardDrive } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const OPTIONS = [
  { icon: Camera, label: "Record from Camera", color: "bg-red-600/20 border-red-600/30 text-red-400", iconBg: "bg-red-600" },
  { icon: Upload, label: "Upload from Device", color: "bg-orange-600/20 border-orange-600/30 text-orange-400", iconBg: "bg-orange-500" },
  { icon: Youtube, label: "Paste YouTube Link", color: "bg-red-700/20 border-red-700/30 text-red-300", iconBg: "bg-red-700" },
  { icon: HardDrive, label: "Attach from Drive", color: "bg-blue-600/20 border-blue-600/30 text-blue-400", iconBg: "bg-blue-600" },
];

export function SalsaCaptureModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm md:max-w-md bg-[#161616] border border-white/10 rounded-t-2xl md:rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">⚡</span>
            <h2 className="text-lg font-bold">Quick Capture</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-white/50 mb-5">
          Capture a class or idea quickly, add notes later.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-2">
          {OPTIONS.map(({ icon: Icon, label, color, iconBg }) => (
            <button
              key={label}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${color} hover:bg-white/10 transition-colors`}
            >
              <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
