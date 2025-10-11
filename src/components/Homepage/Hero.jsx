import { ArrowUpRight } from 'lucide-react';

const Hero = () => {
  return (
    <section style={{ minHeight: '100vh', backgroundColor: '#f5f5f0' }} className="flex items-center">
      <div className="w-full px-8 py-16 lg:px-20">
        <div style={{ maxWidth: '1200px' }}>
          {/* Main Heading */}
          <h1 style={{ fontSize: '64px', lineHeight: '1.1', fontWeight: '900', marginBottom: '40px' }} className="text-black">
            <span className="block">Verified Skills.</span>
            <span className="block">Visible Workforce.</span>
            <span className="block">Measurable Impact.</span>
          </h1>

          {/* Subheading */}
          <p style={{ fontSize: '20px', lineHeight: '1.6', marginBottom: '48px', maxWidth: '800px' }} className="text-gray-700">
            The Rareminds Skill Passport gives enterprises a single source of truth for employee
            capabilities — turning training outcomes into real-time talent intelligence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center" style={{ gap: '16px' }}>
            {/* Book a Demo group */}
            <div className="flex items-center" style={{ gap: '10px' }}>
              <button 
                style={{
                  height: '48px',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  borderRadius: '9999px',
                  backgroundColor: '#e63b2e',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 16px rgba(230, 59, 46, 0.3)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                BOOK A DEMO
              </button>
              <button 
                aria-label="Open demo"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '9999px',
                  backgroundColor: '#e63b2e',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(230, 59, 46, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowUpRight style={{ width: '20px', height: '20px', strokeWidth: 2.5 }} />
              </button>
            </div>

            {/* Explore Dashboard group */}
            <div className="flex items-center" style={{ gap: '10px' }}>
              <button 
                style={{
                  height: '48px',
                  paddingLeft: '28px',
                  paddingRight: '28px',
                  borderRadius: '9999px',
                  backgroundColor: 'white',
                  color: 'black',
                  fontSize: '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  border: '2px solid black',
                  cursor: 'pointer'
                }}
              >
                EXPLORE DASHBOARD
              </button>
              <button 
                aria-label="Open dashboard"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '9999px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: '2px solid black',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ArrowUpRight style={{ width: '20px', height: '20px', strokeWidth: 2.5 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
