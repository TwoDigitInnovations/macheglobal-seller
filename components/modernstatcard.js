


const ModernStatsCard = ({ title, value, icon, gradient, accentColor, color, message }) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-3xl px-4 py-5 shadow-xl border border-white/50 overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">

      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>

      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-slate-600 text-[16px] font-semibold tracking-wide uppercase">{title}</p>
            <p className="text-[36px] text-black mt-2  flex-wrap">{value}</p>
            <p style={{ color: accentColor }} className="text-[14px] mt-2 flex-wrap">
              {message}
            </p>

          </div>
          <div
            className="p-1 rounded-[6px] text-black shadow-lg transform group-hover:scale-110 transition-transform duration-300"
            style={{ background: color }}
          >
            {icon}
          </div>

        </div>


      </div>
    </div>
  );
};

export default ModernStatsCard;