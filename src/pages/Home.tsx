import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Cpu, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero-bg.png';

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="glass-card"
    style={{
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'left'
    }}
  >
    <div style={{
      width: '3rem',
      height: '3rem',
      borderRadius: '0.75rem',
      background: 'rgba(139, 92, 246, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'hsl(var(--primary))'
    }}>
      <Icon size={24} />
    </div>
    <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
    <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.95rem', lineHeight: 1.6 }}>
      {description}
    </p>
  </motion.div>
);

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: '2rem',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4,
          zIndex: -1
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, transparent 0%, hsl(var(--background)) 100%)',
          zIndex: -1
        }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ maxWidth: '800px' }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '100px',
            fontSize: '0.8rem',
            marginBottom: '2rem',
            color: 'hsl(var(--primary))',
            fontWeight: 500
          }}>
            <Sparkles size={14} />
            Introducing the future of development
          </div>
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            background: 'linear-gradient(to bottom, #fff, #999)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Build smarter, <br />
            scale faster.
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'hsl(var(--muted-foreground))',
            marginBottom: '2.5rem',
            maxWidth: '600px',
            marginInline: 'auto'
          }}>
            The open source Firebase alternative. Start your project with a Postgres database, Authentication, instant APIs, Edge Functions, Realtime, and Storage.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/tasks')}
              style={{
                padding: '1rem 2rem',
                borderRadius: 'var(--radius)',
                background: 'hsl(var(--primary))',
                color: 'white',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Go to Tasks <ArrowRight size={18} />
            </button>
            <button className="glass" style={{
              padding: '1rem 2rem',
              borderRadius: 'var(--radius)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600
            }}>
              Documentation
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '8rem 2rem', maxWidth: '1200px', marginInline: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Everything you need</h2>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Powerful tools to help you build and scale your app.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <FeatureCard
            icon={Zap}
            title="Instant APIs"
            description="We build your APIs for you automatically. Just focus on your data and we'll handle the rest."
            delay={0.1}
          />
          <FeatureCard
            icon={Cpu}
            title="Edge Functions"
            description="Run logic closer to your users. Deploy serverless functions around the world in seconds."
            delay={0.2}
          />
          <FeatureCard
            icon={Layers}
            title="Realtime Subscriptions"
            description="Listen to database changes in realtime. Perfect for chat apps, dashboards, and games."
            delay={0.3}
          />
        </div>
      </section>
    </>
  );
};

export default Home;
