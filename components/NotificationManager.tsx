'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificationManager() {
  // 1. POPUP DEACTIVATED: Initialized to false[cite: 2]
  const [showPopup, setShowPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedSector, setSelectedSector] = useState('');

  // 2. IP TRACKING REMOVED: Removed country-related state variables[cite: 2]

  const sectors = [
    "Information Technology & Software", "Engineering & Manufacturing",
    "Finance & Banking", "Healthcare & Medical", "Education & Training",
    "Sales & Marketing", "Human Resources & Recruitment",
    "Customer Service & Support", "Media Advertising & Communications",
    "Design Arts & Creative", "Construction & Real Estate",
    "Logistics Transport & Supply Chain", "Agriculture & Agribusiness",
    "Energy & Utilities", "Legal & Compliance", "Government & Public Administration",
    "Retail & E-commerce", "Hospitality & Tourism", "Science & Research",
    "Security & Defense", "Telecommunications", "Nonprofit & NGO",
    "Environment & Sustainability", "Product Management & Operations", "Data & Analytics"
  ];

  useEffect(() => {
    const storedEmail = localStorage.getItem('subscriber-email');
    const storedSector = localStorage.getItem('subscriber-sector');
    if (storedEmail) setEmail(storedEmail);
    if (storedSector) setSelectedSector(storedSector);
  }, []);

  // 3. IP TRACKING REMOVED: The entire detectCountry useEffect block has been deleted[cite: 2]

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 4. NOTIFICATION DEACTIVATED: The timer that previously set showPopup to true is removed[cite: 2]
    const subscribed = localStorage.getItem('email-subscribed');
    if (subscribed) return;

    // Removed: setTimeout logic that triggered the popup after 30 seconds[cite: 2]
  }, []);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('email_subscribers')
        .upsert({
          email: email,
          sector: selectedSector || null,
          country: null, // Removed country data insertion[cite: 2]
          source: 'homepage_popup',
          created_at: new Date().toISOString(),
          status: 'active'
        }, { onConflict: 'email' });

      if (dbError) throw dbError;

      localStorage.setItem('email-subscribed', 'true');
      localStorage.setItem('subscriber-email', email);
      if (selectedSector) localStorage.setItem('subscriber-sector', selectedSector);
      
      setSuccess(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPopup(false);
    localStorage.setItem('email-prompt-dismissed', Date.now().toString());
  };

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* showPopup remains false unless manually changed, deactivating the UI[cite: 2] */}
      {showPopup && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <button onClick={handleDismiss} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>

          <div className="p-5">
            <div className="text-center mb-4">
              <h3 className="font-bold text-blue-600">
                Get Daily Remote and Global Job Updates.
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Stay ahead of every opportunity
              </p>
            </div>

            {success ? (
              <div className="text-center py-3 bg-green-50 rounded-lg">
                <p className="text-green-700 font-medium">✓ Subscribed!</p>
              </div>
            ) : (
              <div>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                >
                  <option value="">Select your sector (optional)</option>
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                />

                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Subscribe'}
                </button>
              </div>
            )}

            <button onClick={handleDismiss} className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600">
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}