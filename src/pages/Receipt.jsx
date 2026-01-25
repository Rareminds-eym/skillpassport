/**
 * Receipt Page - Generate and download PDF receipt
 * Route: /receipt/:orderId
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Header from '../layouts/Header';
import Footer from '../components/Footer';
import { jsPDF } from 'jspdf';

export default function Receipt() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchReceiptData();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Receipt] Fetching data for order ID:', orderId);

      // Try to fetch by razorpay_order_id first
      let { data, error: fetchError } = await supabase
        .from('pre_registrations')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();

      console.log('[Receipt] Query by razorpay_order_id result:', { data, error: fetchError });

      // If not found, try by id (UUID) in case the link uses the registration ID
      if (!data && !fetchError) {
        console.log('[Receipt] Trying to fetch by id (UUID)...');
        const uuidResult = await supabase
          .from('pre_registrations')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        
        data = uuidResult.data;
        fetchError = uuidResult.error;
        console.log('[Receipt] Query by id result:', { data, error: fetchError });
      }

      if (fetchError) {
        console.error('[Receipt] Supabase error:', fetchError);
        throw fetchError;
      }
      
      if (!data) {
        console.error('[Receipt] No data found for order ID:', orderId);
        throw new Error('Receipt not found. Please check your order ID or contact support.');
      }

      console.log('[Receipt] Successfully loaded receipt data:', data);
      setReceiptData(data);
    } catch (err) {
      console.error('[Receipt] Error fetching receipt:', err);
      setError(err.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!receiptData) {
      console.error('[Receipt] Cannot generate PDF: No receipt data');
      return;
    }

    console.log('[Receipt] Generating PDF for order:', orderId);

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('SKILL PASSPORT', 105, 20, { align: 'center' });
      
      doc.setFontSize(18);
      doc.text('Pre-Registration Receipt', 105, 30, { align: 'center' });
      
      // Order details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order ID: ${orderId}`, 20, 50);
      doc.text(`Date: ${new Date(receiptData.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })}`, 20, 58);
      
      // Registration details
      doc.setFont('helvetica', 'bold');
      doc.text('Registration Details', 20, 75);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${receiptData.full_name}`, 20, 85);
      doc.text(`Email: ${receiptData.email}`, 20, 93);
      doc.text(`Phone: ${receiptData.phone}`, 20, 101);
      
      // Payment information
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Information', 20, 118);
      doc.setFont('helvetica', 'normal');
      doc.text(`Amount Paid: Rs. 250`, 20, 128);
      doc.text(`Payment Status: ${receiptData.payment_status || 'Completed'}`, 20, 136);
      doc.text(`Payment Method: Razorpay`, 20, 144);
      
      // Footer
      doc.setFontSize(10);
      doc.text('Thank you for registering with Skill Passport!', 20, 170);
      doc.text('For any queries, contact: marketing@rareminds.in', 20, 178);
      doc.text('Phone: +91 9562481100', 20, 186);
      
      doc.setFontSize(8);
      doc.text('This is a computer-generated receipt.', 20, 200);
      doc.text(`© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.`, 20, 206);
      
      // Download
      const filename = `SkillPassport_Receipt_${orderId}.pdf`;
      console.log('[Receipt] Saving PDF as:', filename);
      doc.save(filename);
      console.log('[Receipt] PDF download initiated successfully');
    } catch (error) {
      console.error('[Receipt] Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading receipt...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Receipt Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Receipt Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Payment Receipt</h1>
              <p className="text-blue-100">Skill Passport Pre-Registration</p>
            </div>

            {/* Receipt Details */}
            <div className="p-8">
              {/* Debug info - can be removed in production */}
              {import.meta.env.DEV && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-mono">
                    Debug: Order ID = {orderId}
                  </p>
                </div>
              )}
              
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Order Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-mono text-sm font-semibold text-gray-900">{orderId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Date</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(receiptData.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Registration Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Name</span>
                    <span className="font-semibold text-gray-900">{receiptData.full_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Email</span>
                    <span className="font-semibold text-gray-900">{receiptData.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-semibold text-gray-900">{receiptData.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Payment Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="text-2xl font-bold text-blue-600">₹250</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Payment Status</span>
                    <span className="font-semibold text-green-600">{receiptData.payment_status || 'Completed'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold text-gray-900">Razorpay</span>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={generatePDF}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF Receipt
              </button>

              {/* Footer Note */}
              <p className="text-center text-sm text-gray-500 mt-6">
                This is a computer-generated receipt. For any queries, contact{' '}
                <a href="mailto:marketing@rareminds.in" className="text-blue-600 hover:underline">
                  marketing@rareminds.in
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
