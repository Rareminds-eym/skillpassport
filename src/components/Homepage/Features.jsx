const Features = () => {
  return (
    <section style={{ 
      padding: '80px 20px', 
      backgroundColor: '#ffffff',
      backgroundImage: 'url(/assets/HomePage/Vector.svg)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom center',
      backgroundSize: 'contain',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Main Heading */}
        <h2 style={{ 
          fontSize: '40px', 
          fontWeight: '700', 
          marginBottom: '24px',
          color: '#000',
          lineHeight: '1.2'
        }}>
          Move beyond attendance sheets and completion certificates.
        </h2>

        {/* Subheading */}
        <p style={{ 
          fontSize: '20px', 
          color: '#666',
          marginBottom: '40px',
          lineHeight: '1.6',
          maxWidth: '900px',
          margin: '0 auto 40px'
        }}>
          The Skill Passport captures and verifies every competency developed inside your organization, linking learning to performance and business results.
        </p>

        {/* CTA Button */}
        <button style={{
          backgroundColor: '#000',
          color: '#d4af37',
          padding: '16px 32px',
          borderRadius: '9999px',
          fontSize: '16px',
          fontWeight: '600',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          From learning hours to skill power.
        </button>
      </div>
    </section>
  );
};

export default Features;
