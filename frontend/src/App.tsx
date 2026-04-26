import { useEffect, useState } from 'react'
import { Rocket, Shield, Cpu, Activity } from 'lucide-react'

interface BackendStatus {
  message: string;
  status: string;
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/');
        const data = await response.json();
        setBackendStatus(data);
      } catch (error) {
        console.error('Failed to connect to backend:', error);
        setBackendStatus({ message: 'Disconnected', status: 'offline' });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <header className="fade-in" style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span className={`badge ${backendStatus?.status === 'online' ? 'badge-online' : 'badge-offline'}`}>
            <Activity size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            API: {loading ? 'Checking...' : backendStatus?.status || 'Offline'}
          </span>
        </div>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }} className="gradient-text">
          Lumio Fullstack
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
          A high-performance monorepo boilerplate powered by FastAPI and React. 
          Built for speed, security, and exceptional user experience.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a href="#" className="btn btn-primary">
            <Rocket size={18} /> Get Started
          </a>
          <a href="https://github.com" target="_blank" className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg> Documentation
          </a>
        </div>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-card fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <Cpu size={24} />
          </div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>FastAPI Backend</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Python-powered high performance API with automatic documentation and type safety via Pydantic.
          </p>
        </div>

        <div className="glass-card fade-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--secondary)' }}>
            <Rocket size={24} />
          </div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>React + Vite</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Lightning fast development and optimized production builds with the most modern React toolchain.
          </p>
        </div>

        <div className="glass-card fade-in" style={{ animationDelay: '0.3s' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent)' }}>
            <Shield size={24} />
          </div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Modern Security</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Built-in CORS handling, environment variable support, and modular architecture for secure scaling.
          </p>
        </div>
      </section>

      <footer style={{ marginTop: '8rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Lumio Open Source Project</p>
      </footer>
    </div>
  )
}

export default App
