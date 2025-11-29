import React from 'react';
import Spline from '@splinetool/react-spline';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center text-cream p-6 relative">
      <div className="absolute inset-0 z-1000">
        <Spline scene="https://prod.spline.design/SsGTbqYKisrW188l/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-7xl lg:text-8xl font-extrabold mb-4 leading-tight">
          <span className="text-[#F6F5E3] font-bold">FastNCeano</span>
          <span className="ml-4 text-[#FDC823] text-3xl md:text-4xl lg:text-5xl font-semibold align-baseline">Library Portal</span>
        </h1>
        <p className="text-[#F2F1E6] text-lg md:text-xl mb-10">Scan your QR to log library visits quickly and securely.</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/student"
            className="px-8 py-4 rounded-xl bg-[#064519] bg-opacity-50 hover:bg-opacity-95 text-white font-semibold shadow-lg border border-white/10 backdrop-blur-md"
          >
            Student
          </Link>

          <Link
            to="/login"
            className="px-8 py-4 rounded-xl bg-[#FDC823] bg-opacity-85 hover:brightness-95 text-[#05220F] font-semibold shadow-lg border border-white/10 backdrop-blur-md"
          >
            Admin
          </Link>
        </div>

      </div>
    </div>
  );
}
