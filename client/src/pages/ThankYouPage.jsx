import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi';
import SEO from '../components/seo/SEO';

const ThankYouPage = () => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-primary pt-32 pb-20 flex flex-col items-center justify-center">
            <SEO title="Thank You | GPSFDK" description="Thank you for your purchase!" />
            <div className="max-w-xl w-full mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] p-8 md:p-12 text-center shadow-2xl border border-gray-100"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    >
                        <HiCheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                    </motion.div>
                    
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-4">
                        Thank You!
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base mb-8 max-w-sm mx-auto">
                        Your purchase was successful. We are getting your order ready to be shipped. We will notify you once it's on the way.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/dashboard"
                            className="w-full sm:w-auto px-8 py-3 border-2 border-gray-200 text-secondary font-bold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            View Order Details
                        </Link>
                        <Link 
                            to="/"
                            className="w-full sm:w-auto px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/30"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ThankYouPage;
