

function FeatureCard({ title, Icon }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-3 w-[16rem]">
      <div className="flex-none h-10 w-10 rounded-lg bg-[#edf2f9] flex items-center justify-center text-[#5378f1]">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="text-sm font-semibold text-[#000000]">{title}</div>
    </div>
  );
}

export default FeatureCard;