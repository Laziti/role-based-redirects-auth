
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building, Users, Shield, Zap, ArrowRight, Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-gold-500" />
              <span className="text-xl font-bold text-white">RealEstate Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost" className="text-white hover:text-gold-500">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gold-500 hover:bg-gold-600 text-black">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Your Real Estate
              <span className="text-gold-500 block">Success Platform</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create stunning property listings, share your personalized agent page, and grow your real estate business with our professional platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10 px-8 py-4 text-lg">
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            Everything You Need to Succeed
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Building className="h-12 w-12 text-gold-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">Professional Listings</h3>
              <p className="text-gray-300">
                Create beautiful property listings with multiple images, detailed descriptions, and professional layouts.
              </p>
            </motion.div>
            
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Users className="h-12 w-12 text-gold-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">Personal Agent Pages</h3>
              <p className="text-gray-300">
                Get your own branded agent page with a custom URL to showcase all your properties in one place.
              </p>
            </motion.div>
            
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Shield className="h-12 w-12 text-gold-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-4">Secure & Reliable</h3>
              <p className="text-gray-300">
                Bank-level security with reliable hosting ensures your listings are always available and protected.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-white mb-16">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Free Tier</h3>
              <div className="text-4xl font-bold text-gold-500 mb-6">
                0 ETB<span className="text-lg text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Up to 5 listings per month
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Personal agent page
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Basic listing features
                </li>
              </ul>
              <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10">
                Get Started Free
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-gold-500/20 to-yellow-600/20 backdrop-blur-sm border border-gold-500/30 rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gold-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Pro Plan</h3>
              <div className="text-4xl font-bold text-gold-500 mb-6">
                800 ETB<span className="text-lg text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Up to 20 listings per month
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Premium agent page
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Advanced listing features
                </li>
                <li className="flex items-center text-gray-300">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Priority support
                </li>
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-gold-500 hover:bg-gold-600 text-black">
                  Start Pro Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gold-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful real estate agents who trust our platform to showcase their properties and grow their business.
          </p>
          <Link to="/auth">
            <Button className="bg-gold-500 hover:bg-gold-600 text-black px-8 py-4 text-lg">
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/20 border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="h-6 w-6 text-gold-500" />
              <span className="text-lg font-semibold text-white">RealEstate Pro</span>
            </div>
            <p className="text-gray-400">
              © 2024 RealEstate Pro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
