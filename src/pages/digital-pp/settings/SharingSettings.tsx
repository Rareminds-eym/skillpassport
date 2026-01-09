import { Check, Copy, Globe, Link2, Linkedin, Lock, Mail, MessageCircle, Share2, Twitter } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolio } from '../../../context/PortfolioContext';
import { copyToClipboard, downloadQRCode, generateQRCode, generateShareableLink, sharePortfolio } from '../../../utils/exportppUtils';

const SharingSettings: React.FC = () => {
  const navigate = useNavigate();
  const { student } = usePortfolio();
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Generate initial share link
  useEffect(() => {
    const userId = student?.id || 'demo-user';
    const link = generateShareableLink(userId);
    setShareLink(link);
    
    // Generate QR code
    generateQRCode(link).then(url => {
      setQrCodeUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code:', err);
    });
  }, [student?.id]);

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleGenerateLink = () => {
    const randomId = Math.random().toString(36).substring(7);
    const newLink = generateShareableLink(randomId);
    setShareLink(newLink);
    
    // Regenerate QR code
    generateQRCode(newLink).then(url => {
      setQrCodeUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code:', err);
    });
  };

  const handleSocialShare = async (platform: string) => {
    const title = `${student?.profile.name || 'My'} Portfolio`;
    const text = `Check out my digital portfolio!`;
    
    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + shareLink)}`;
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareLink)}`, '_blank');
        break;
      default:
        // Try Web Share API with fallback to copy
        await sharePortfolio(title, text, shareLink);
    }
  };

  const handleDownloadQR = async () => {
    const fileName = `${student?.profile.name?.replace(/\s+/g, '_') || 'Portfolio'}_QR.png`;
    await downloadQRCode(shareLink, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-cyan-950 dark:to-blue-950 transition-colors duration-300">
      {/* Copy Confirmation Toast */}
      {copied && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2 animate-slide-in">
          <Check className="w-5 h-5" />
          <span>Link copied to clipboard!</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="space-y-6">
          {/* Share Link Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Portfolio Link</h2>
                <p className="text-gray-600 dark:text-gray-400">Share your portfolio with others</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-mono text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center space-x-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </span>
                  <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
                </button>
              </div>

              <button
                onClick={handleGenerateLink}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
              >
                Generate New Link
              </button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
                <p className="text-gray-600 dark:text-gray-400">Control who can see your portfolio</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    {isPublic ? <Globe className="w-5 h-5 text-green-600 dark:text-green-400" /> : <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                      {isPublic ? 'Portfolio is Public' : 'Portfolio is Private'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isPublic ? 'Anyone with the link can view your portfolio' : 'Only you can view your portfolio'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-cyan-600"></div>
                </label>
              </div>

              {/* Privacy Options */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                  <span className="text-gray-700 dark:text-gray-300">Allow search engine indexing</span>
                  <input
                    type="checkbox"
                    defaultChecked={isPublic}
                    disabled={!isPublic}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                  <span className="text-gray-700 dark:text-gray-300">Show contact information</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                  <span className="text-gray-700 dark:text-gray-300">Display email address</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                  <span className="text-gray-700 dark:text-gray-300">Show phone number</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500 transition-all">
                  <span className="text-gray-700 dark:text-gray-300">Enable contact form</span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Social Sharing</h2>
                <p className="text-gray-600 dark:text-gray-400">Share on social media platforms</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => handleSocialShare('linkedin')}
                className="group p-6 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all hover:shadow-2xl hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-blue-400 blur-xl -z-10"></div>
                <Linkedin className="w-8 h-8 mb-2 mx-auto drop-shadow-lg" />
                <div className="font-semibold text-sm">LinkedIn</div>
              </button>
              <button 
                onClick={() => handleSocialShare('twitter')}
                className="group p-6 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white transition-all hover:shadow-2xl hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-sky-400 blur-xl -z-10"></div>
                <Twitter className="w-8 h-8 mb-2 mx-auto drop-shadow-lg" />
                <div className="font-semibold text-sm">Twitter</div>
              </button>
              <button 
                onClick={() => handleSocialShare('email')}
                className="group p-6 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white transition-all hover:shadow-2xl hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-purple-400 blur-xl -z-10"></div>
                <Mail className="w-8 h-8 mb-2 mx-auto drop-shadow-lg" />
                <div className="font-semibold text-sm">Email</div>
              </button>
              <button 
                onClick={() => handleSocialShare('whatsapp')}
                className="group p-6 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white transition-all hover:shadow-2xl hover:scale-105 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-green-400 blur-xl -z-10"></div>
                <MessageCircle className="w-8 h-8 mb-2 mx-auto drop-shadow-lg" />
                <div className="font-semibold text-sm">WhatsApp</div>
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code</h2>
                <p className="text-gray-600 dark:text-gray-400">Quick access to your portfolio</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-48 h-48 bg-white border-4 border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-6xl">📱</div>
                )}
              </div>
              <button 
                onClick={handleDownloadQR}
                disabled={!qrCodeUrl}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="relative z-10">Download QR Code</span>
                <span className="absolute top-0 left-[-40px] h-full w-0 bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-600 dark:to-indigo-600 transform skew-x-[45deg] transition-all duration-700 group-hover:w-[160%] -z-0"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharingSettings;
