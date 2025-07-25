import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import { Button } from '@/components/ui/button'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 


const Slideshow = ({ images, label, onClick }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000); 
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer w-full max-w-xs sm:max-w-sm md:max-w-md h-[250px] sm:h-[300px] overflow-hidden relative rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out group"
    >
      <img
        src={images[index]}
        alt={`${label} ${index + 1}`}
        className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110"
       
        onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x300/CCCCCC/333333?text=Image+Error"; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
        <div className="text-white text-xl font-semibold">{label}</div>
      </div>
    </Card>
  );
};

const HomePage = () => { 
  const navigate = useNavigate();

  
  const foodImages = ["/images/food1.jpg", "/images/food2.jpg", "/images/food3.jpg"];
  const snacksImages = ["/images/snacks1.jpg", "/images/snacks2.jpg", "/images/snacks3.jpg"];
  const drinksImages = ["/images/drinks1.jpg", "/images/drinks2.jpg", "/images/drinks3.jpg"];

  return (
    <div className="w-full min-h-screen bg-gradient-background text-foreground flex flex-col font-inter">
      {/* Header (Navbar) */}
      <nav className="w-full p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm shadow-md fixed top-0 z-50">
        <div className="text-3xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">
          MEALY
        </div>
        <div className="space-x-4">
          <Link to="/login">
            <Button variant="ghost" className="text-primary hover:text-primary-light text-lg">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-gradient-primary hover:shadow-glow transition-smooth text-lg px-6 py-2">Sign Up</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-[80px]"> {/* Padding top to clear fixed navbar */}
        {/* Hero Section (Banner) */}
        <section className="relative h-[70vh] flex items-center justify-center text-center px-4 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30" 
            style={{ backgroundImage: "url('/images/banner.jpg')" }} // Original banner image
          ></div>
          <div className="relative z-10 max-w-4xl space-y-6 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold text-primary leading-tight drop-shadow-lg">
              Welcome to Mealy, <br className="hidden md:inline"/> Place your order
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground drop-shadow-md">
              Discover a wide variety of delicious meals from your favorite caterers,
              delivered right to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-smooth text-lg px-8 py-3 rounded-full shadow-lg">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary-light hover:text-white transition-smooth text-lg px-8 py-3 rounded-full shadow-lg">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Section (Slideshows) */}
        <section className="py-16 px-4 bg-card-background">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-primary animate-fade-in-up">
            Explore Our Categories
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 max-w-6xl mx-auto">
            <Slideshow images={foodImages} label="Food" onClick={() => navigate("/login")} />
            <Slideshow images={snacksImages} label="Snacks" onClick={() => navigate("/login")} />
            <Slideshow images={drinksImages} label="Drinks" onClick={() => navigate("/login")} />
          </div>
        </section>

        {/* Partner with us Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary-light to-primary text-white text-center">
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Partner with us
            </h2>
            <p className="text-lg md:text-xl opacity-90">
              Enjoy a wide range of customers. Let’s grow your business together.
            </p>
            <Link to="/register?role=caterer"> 
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 transition-smooth text-lg px-8 py-3 shadow-md hover:shadow-lg rounded-full">
                Register here
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-gray-900 text-gray-300 py-10 px-4">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Mealy Info */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-3xl font-extrabold bg-gradient-primary bg-clip-text text-transparent mb-4">MEALY</h3>
            <p className="text-sm leading-relaxed">Lets grow your business together.</p>
            <p className="text-sm mt-2">Connecting food lovers with passionate caterers.</p>
          </div>

          {/* Column 2: Mealy Caterers */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-4">For Caterers</h3>
            <ul className="space-y-2">
              <li><Link to="/register?role=caterer" className="hover:text-primary-light transition-colors">Become a Partner</Link></li>

            </ul>
          </div>

          {/* Column 3: Links of Interest */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-4">Links of Interest</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-primary-light transition-colors">About Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary-light transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-primary-light transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-light transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Follow us */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-semibold text-white mb-4">Follow Us</h3>
            <div className="flex space-x-6 text-3xl text-primary">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram className="hover:text-pink-500 transition-colors" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebook className="hover:text-blue-600 transition-colors" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaTwitter className="hover:text-blue-400 transition-colors" />
              </a>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-10 border-t border-gray-700 pt-6">
          © {new Date().getFullYear()} Mealy. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
