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
    <section style={{ 
      backgroundColor: '#000', 
      color: '#fff',
      padding: '80px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        {/* Heading */}
        <h2 style={{ 
          fontSize: '48px', 
          fontWeight: '700', 
          marginBottom: '16px',
          color: '#fff'
        }}>
          Business Impact
        </h2>

        {/* Subheading */}
        <p style={{ 
          fontSize: '18px', 
          color: '#ccc',
          marginBottom: '60px'
        }}>
          Measurable results that matter to your bottom line
        </p>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          marginBottom: '60px'
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '64px', 
                fontWeight: '700',
                color: '#d4af37',
                marginBottom: '12px'
              }}>
                {stat.percentage}
              </div>
              <p style={{ 
                fontSize: '16px',
                color: '#ccc',
                lineHeight: '1.5'
              }}>
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <p style={{ 
          fontSize: '18px',
          fontStyle: 'italic',
          color: '#ccc'
        }}>
          Because what gets measured — gets mastered.
        </p>
      </div>
    </section>
  );
};

export default BusinessImpact;
