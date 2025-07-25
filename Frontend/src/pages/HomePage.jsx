import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";

// Reusable slideshow that navigates on click
const Slideshow = ({ images, label, onClick }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer w-[300px] h-[220px] sm:w-[400px] sm:h-[280px] overflow-hidden relative rounded-md shadow-lg transform hover:scale-105 transition"
    >
      <img
        src={images[index]}
        alt={`${label} ${index + 1}`}
        className="w-full h-full object-cover transition-all duration-700"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
        {label}
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  const foodImages = ["/images/food1.jpg", "/images/food2.jpg", "/images/food3.jpg"];
  const snacksImages = ["/images/snacks1.jpg", "/images/snacks2.jpg", "/images/snacks3.jpg"];
  const drinksImages = ["/images/drinks1.jpg", "/images/drinks2.jpg", "/images/drinks3.jpg"];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center">
      {/* Header */}
      <div className="w-full px-8 py-4 flex justify-between items-center shadow-md bg-white z-10">
        <h1 className="text-3xl font-bold text-amber-700">MEALY</h1>
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-amber-700 hover:underline"
        >
          Login
        </button>
      </div>

      {/* Banner */}
      <div
        className="w-full h-64 sm:h-80 bg-cover bg-center relative"
        style={{ backgroundImage: "url('/images/banner.jpg')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h2 className="text-white text-4xl sm:text-5xl font-bold">Delicious Meals Delivered Fast</h2>
        </div>
      </div>

      {/* Welcome Text */}
      <h3 className="text-2xl font-semibold text-amber-700 mt-8 text-center">
        Welcome to Mealy, Place your order
      </h3>

      {/* Slideshows */}
      <div className="flex flex-col sm:flex-row justify-center gap-8 mt-8 px-4">
        <Slideshow images={foodImages} label="Food" onClick={() => navigate("/login")} />
        <Slideshow images={snacksImages} label="Snacks" onClick={() => navigate("/login")} />
        <Slideshow images={drinksImages} label="Drinks" onClick={() => navigate("/login")} />
      </div>

      {/* Footer / Partner */}
      <div className="mt-12 border-t pt-6 w-full text-center px-4">
        <h3 className="text-xl font-bold">Partner with us</h3>
        <p className="text-sm mt-2">
          Enjoy a wide range of customers. Let’s grow your business together
        </p>
        <button
          onClick={() => navigate("/register")}
          className="mt-2 text-amber-700 font-semibold hover:underline"
        >
          Register here
        </button>

        {/* Social Icons */}
        <div className="flex justify-center space-x-6 mt-4 text-2xl text-amber-700">
          {/* Render each icon as a JSX element, not as an array/object */}
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <FaInstagram className="hover:text-pink-600" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer">
            <FaFacebook className="hover:text-blue-600" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <FaTwitter className="hover:text-blue-400" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HomePage;