import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { HiCheckCircle } from 'react-icons/hi';
import SEO from '../components/seo/SEO';
import API from '../utils/api';
import { useCurrency } from '../context/CurrencyContext';

const ThankYouPage = () => {
    const location = useLocation();
    const { formatPrice } = useCurrency();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pull the orderNumber/_id from the query string set by CheckoutPage.
    const orderRef = new URLSearchParams(location.search).get('order') || '';

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!orderRef) return;
        let cancelled = false;
        setLoading(true);
        API.get(`/orders/${encodeURIComponent(orderRef)}`)
            .then(({ data }) => { if (!cancelled) setOrder(data); })
            .catch((err) => {
                if (cancelled) return;
                setError(err.response?.data?.message || 'Could not load order details');
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [orderRef]);

    return (
        <div className="min-h-screen bg-primary pt-32 pb-20 flex flex-col items-center justify-center">
            <SEO title="Thank You | GPSFDK" description="Thank you for your purchase!" noindex />
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

                    {/* Order reference — always shown if we have it, even before details load */}
                    {orderRef && (
                        <p className="text-sm text-gray-500 mb-3">
                            Order reference:&nbsp;
                            <span className="font-mono font-bold text-secondary">{order?.orderNumber || orderRef}</span>
                        </p>
                    )}

                    <p className="text-gray-500 text-sm md:text-base mb-4 max-w-sm mx-auto">
                        Your purchase was successful. We are getting your order ready to be shipped. We will notify you once it&apos;s on the way.
                    </p>

                    {/* Order summary — only shown when we successfully loaded the order */}
                    {loading && (
                        <p className="text-xs text-gray-400 mb-6">Loading your order details…</p>
                    )}
                    {error && (
                        <p className="text-xs text-red-500 mb-6">{error}</p>
                    )}
                    {order && (
                        <div className="text-left bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Items</span>
                                <span className="text-secondary">{order.items?.length || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-secondary">{formatPrice(Math.round(order.itemsPrice || 0))}</span>
                            </div>
                            {order.discountPrice > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="text-green-600">-{formatPrice(Math.round(order.discountPrice))}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                <span className="text-secondary">{order.shippingPrice > 0 ? formatPrice(Math.round(order.shippingPrice)) : 'FREE'}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 mt-2">
                                <span className="text-secondary">Total</span>
                                <span className="text-secondary">{formatPrice(Math.round(order.totalPrice || 0))}</span>
                            </div>
                        </div>
                    )}

                    <p className="text-xs font-bold text-accent bg-accent/5 py-1 px-3 rounded-full inline-block mb-8">
                        Check your Spam/Junk folder if you don&apos;t receive an email.
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
