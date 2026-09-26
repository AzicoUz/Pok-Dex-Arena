import { Link } from 'react-router-dom';

export default function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><span className="footer-mark">◈</span><div><strong>PokéDex Arena</strong><span>Gen I Collection · 6v6 Battle · Arcade</span></div></div><div className="footer-links"><Link to="/inventory">Inventory</Link><Link to="/evolution">Evolution</Link><Link to="/regions">Regions</Link></div><div className="footer-signature" aria-label="Created by Azico"><span className="signature-label">Designed & built by</span><span className="signature-name">Azico</span></div><div className="footer-meta">React · Vite · PokéAPI</div></div></footer>;
}
