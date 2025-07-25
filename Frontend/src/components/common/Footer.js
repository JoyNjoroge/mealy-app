import React from 'react';

const Footer = () => (
  <footer style={{ textAlign: 'center', padding: '1rem', background: '#f5f5f5' }}>
    <span>© {new Date().getFullYear()} Mealy App. All rights reserved.</span>
  </footer>
);

export default Footer;
