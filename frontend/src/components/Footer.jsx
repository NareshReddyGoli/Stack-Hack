export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="copy">© {new Date().getFullYear()} CampusHub</div>
        <nav className="footer-links" aria-label="Footer">
          <a href="#" aria-label="Privacy Policy">Privacy</a>
          <a href="#" aria-label="Terms of Service">Terms</a>
          <a href="#" aria-label="Support">Support</a>
        </nav>
      </div>
    </footer>
  )
}


