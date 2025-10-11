const BusinessImpact = () => {
  const stats = [
    {
      percentage: '40%',
      description: 'reduction in manual reporting time'
    },
    {
      percentage: '25%',
      description: 'faster internal mobility decisions'
    },
    {
      percentage: '30%',
      description: 'increase in training effectiveness tracking'
    }
  ];

  return (
    <section className="bg-black text-white px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl text-center">
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
          Business Impact
        </h2>

        {/* Subheading */}
        <p className="text-base md:text-lg text-gray-300 mb-12">
          Measurable results that matter to your bottom line
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl sm:text-6xl font-bold text-amber-400 mb-3">
                {stat.percentage}
              </div>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p className="text-base md:text-lg italic text-gray-300">
          Because what gets measured — gets mastered.
        </p>
      </div>
    </section>
  );
};

export default BusinessImpact;
