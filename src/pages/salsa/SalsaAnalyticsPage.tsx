import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { TOP_TAGS, PRACTICE_ACTIVITY } from "@/data/salsaData";

const BPM_TREND = [
  { x: 0, bpm: 90 }, { x: 1, bpm: 88 }, { x: 2, bpm: 92 },
  { x: 3, bpm: 94 }, { x: 4, bpm: 91 }, { x: 5, bpm: 96 },
  { x: 6, bpm: 93 }, { x: 7, bpm: 88 }, { x: 8, bpm: 95 },
  { x: 9, bpm: 96 },
];

const ON1_ON2 = [
  { name: "On1", value: 70, color: "#e53935" },
  { name: "On2", value: 30, color: "#333" },
];

export function SalsaAnalyticsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Analytics Snapshot</h1>
        <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
          View all
        </button>
      </div>

      {/* Top Tags */}
      <section className="bg-[#161616] border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white/70 mb-4">Top Tags (This Month)</h2>
        <div className="space-y-3">
          {TOP_TAGS.map((tag) => (
            <div key={tag.name} className="flex items-center gap-3">
              <span className="text-sm text-white/80 w-36 shrink-0">{tag.name}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(tag.count / 18) * 100}%`,
                    background: tag.color,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-white/70 w-6 text-right">{tag.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* On1 vs On2 + BPM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* On1 vs On2 */}
        <section className="bg-[#161616] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-4">On1 vs On2</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">+70%</div>
              <div className="text-xs text-white/40 mt-1">On1</div>
            </div>
            <div className="relative">
              <PieChart width={100} height={100}>
                <Pie
                  data={ON1_ON2}
                  cx={50}
                  cy={50}
                  innerRadius={30}
                  outerRadius={45}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {ON1_ON2.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white/40">30%</div>
              <div className="text-xs text-white/40 mt-1">On2</div>
            </div>
          </div>
        </section>

        {/* Most Practiced BPM */}
        <section className="bg-[#161616] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white/70 mb-1">Most Practiced BPM</h2>
          <div className="text-3xl font-bold text-white mb-0.5">88 – 96 BPM</div>
          <div className="text-xs text-white/40 mb-4">Your typical practice range</div>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={BPM_TREND}>
              <Line
                type="monotone"
                dataKey="bpm"
                stroke="#e53935"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* Practice Activity */}
      <section className="bg-[#161616] border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white/70 mb-4">
          Practice Activity (This Week)
        </h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={PRACTICE_ACTIVITY} barSize={24}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Bar dataKey="count" fill="#e53935" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Upgrade CTA */}
      <section className="bg-gradient-to-br from-[#1a0a00] to-[#2d1500] border border-orange-900/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400">👑</span>
          <h2 className="text-base font-bold">Upgrade to Pro</h2>
        </div>
        <p className="text-sm text-white/50 mb-4">
          Unlock unlimited boards, video export, advanced analytics and more.
        </p>
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">
          Upgrade Now
        </button>
      </section>
    </div>
  );
}
