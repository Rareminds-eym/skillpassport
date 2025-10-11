const CaseHighlights = () => {
  const testimonials = [
    {
      quote: '"Rareminds helped us translate training outcomes into verified capabilities visible across teams."',
      author: 'HR Director, Toyota Kirloskar Motors'
    },
    {
      quote: '"We moved from reports to real skill dashboards within weeks."',
      author: 'L&D Head, Manufacturing Sector'
    }
  ];

  return (
    <section style={{ 
      backgroundColor: '#f8f8f8', 
      padding: '80px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        {/* Heading */}
        <h2 style={{ 
          fontSize: '48px', 
          fontWeight: '700', 
          marginBottom: '12px',
          color: '#000'
        }}>
          Case Highlights
        </h2>

        {/* Subheading */}
        <p style={{ 
          fontSize: '18px', 
          color: '#666',
          marginBottom: '60px'
        }}>
          Trusted by leading enterprises worldwide
        </p>

        {/* Testimonials Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '30px'
        }}>
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              style={{ 
                backgroundColor: '#fff',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                textAlign: 'left',
                position: 'relative'
              }}
            >
              {/* Quote icon */}
              <div style={{ 
                fontSize: '48px',
                color: '#d4af37',
                fontWeight: '700',
                marginBottom: '20px',
                fontFamily: 'Georgia, serif'
              }}>
                ❝❝
              </div>

              {/* Quote text */}
              <p style={{ 
                fontSize: '18px',
                fontStyle: 'italic',
                color: '#333',
                marginBottom: '24px',
                lineHeight: '1.6'
              }}>
                {testimonial.quote}
              </p>

              {/* Author */}
              <p style={{ 
                fontSize: '14px',
                fontWeight: '600',
                color: '#000'
              }}>
                — {testimonial.author}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseHighlights;
