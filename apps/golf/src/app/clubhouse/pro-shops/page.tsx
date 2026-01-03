'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import styles from './pro-shops.module.css';

interface ProShop {
  id: string;
  name: string;
  location: string;
  description: string;
  logo_url?: string;
  is_active: boolean;
}

interface RedemptionItem {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  credits_required: number;
  image_url?: string;
  stock_available: number;
}

export default function ProShopsPage() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [shops, setShops] = useState<ProShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    const supabase = createClient();
    
    // Fetch user credits
    const { data: walletData } = await supabase
      .from('clubhouse_wallets')
      .select('credits')
      .eq('user_id', user!.id)
      .single();

    if (walletData) {
      setCredits(walletData.credits);
    }

    // Mock pro shops data (in real system would be from database)
    const mockShops: ProShop[] = [
      {
        id: '1',
        name: 'St Andrews Pro Shop',
        location: 'Scotland',
        description: 'Historic golf course merchandise',
        is_active: true
      },
      {
        id: '2',
        name: 'Augusta National',
        location: 'Georgia, USA',
        description: 'Masters tournament gear',
        is_active: true
      },
      {
        id: '3',
        name: 'Pebble Beach',
        location: 'California, USA',
        description: 'Premium coastal golf apparel',
        is_active: true
      }
    ];

    setShops(mockShops);
    setLoading(false);
  }

  const canAfford = (price: number) => credits >= price;

  return (
    <RequireAuth>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <i className="fas fa-store"></i>
              Pro Shops
            </h1>
            <p className={styles.subtitle}>Redeem your credits for exclusive golf merchandise</p>
          </div>
          <div className={styles.creditsCard}>
            <i className="fas fa-coins"></i>
            <div>
              <span className={styles.creditsLabel}>Your Credits</span>
              <span className={styles.creditsValue}>{credits.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonIcon}>
            <i className="fas fa-shopping-bag"></i>
          </div>
          <h2>Pro Shop Redemptions Coming Soon!</h2>
          <p>We're partnering with top golf courses and brands to bring you exclusive merchandise you can redeem with your clubhouse credits.</p>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <i className="fas fa-tshirt"></i>
              <h3>Premium Apparel</h3>
              <p>Shirts, hats, and accessories from world-renowned courses</p>
            </div>
            <div className={styles.feature}>
              <i className="fas fa-golf-ball"></i>
              <h3>Equipment</h3>
              <p>Balls, tees, gloves, and other essential golf gear</p>
            </div>
            <div className={styles.feature}>
              <i className="fas fa-ticket-alt"></i>
              <h3>Experiences</h3>
              <p>Rounds at partner courses and exclusive tournament access</p>
            </div>
          </div>

          <div className={styles.shopPreview}>
            <h3>Featured Partner Courses</h3>
            <div className={styles.shopGrid}>
              {shops.map(shop => (
                <div key={shop.id} className={styles.shopCard}>
                  <div className={styles.shopIcon}>
                    <i className="fas fa-store-alt"></i>
                  </div>
                  <h4>{shop.name}</h4>
                  <p>
                    <i className="fas fa-map-marker-alt"></i>
                    {shop.location}
                  </p>
                  <span className={styles.comingSoonBadge}>Coming Soon</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.cta}>
            <p>In the meantime, keep earning credits by competing in clubhouse tournaments!</p>
            <Link href="/clubhouse/events" className={styles.eventsBtn}>
              <i className="fas fa-trophy"></i>
              View Events
            </Link>
          </div>
        </div>

        {/* Notify Me Section */}
        <div className={styles.notifySection}>
          <h3>Get notified when Pro Shop launches</h3>
          <p>We'll send you an email when redemptions become available</p>
          <button className={styles.notifyBtn} disabled>
            <i className="fas fa-bell"></i>
            Notify Me (Coming Soon)
          </button>
        </div>
      </div>
    </RequireAuth>
  );
}
