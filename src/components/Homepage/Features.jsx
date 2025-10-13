const Features = () => {
  return (
    <section
      className="relative px-5 py-16 sm:py-20 bg-white"
      style={{
        backgroundImage: 'url(/assets/HomePage/Vector.svg)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'bottom center',
        backgroundSize: 'contain'
      }}
    >
      <div className="relative z-10 mx-auto max-w-7xl text-center">
        {/* Main Heading */}
        <h2 className="font-bold mb-6 text-black leading-tight">
          Move beyond attendance sheets and completion certificates.
        </h2>

        {/* Subheading */}
        <p className="mx-auto mb-10 max-w-3xl text-gray-600 leading-relaxed">
          The Skill Passport captures and verifies every competenc developed inside your organization, linking learning to performance and business results.
        </p>

        {/* CTA Button */}
        <button className="rounded-full bg-black text-amber-400 px-6 py-4 text-sm md:text-base font-semibold transition-colors hover:bg-gray-900">
          From learning hours to skill power.
        </button>
      </div>
    </section>
  );
};

export default Features;
