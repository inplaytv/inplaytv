/**
 * Scoring Breakdown Component
 * 
 * Displays detailed fantasy points breakdown for a golfer including:
 * - Hole-by-hole scoring
 * - Round bonuses
 * - Streak bonuses
 * - Placement bonuses
 * - Captain multiplier
 */

import React from 'react';
import { type ScoringBreakdown } from '@/lib/fantasy-scoring';

interface ScoringBreakdownProps {
  golferName: string;
  scoring: ScoringBreakdown;
  isCaptain: boolean;
}

export default function ScoringBreakdownComponent({ 
  golferName, 
  scoring, 
  isCaptain 
}: ScoringBreakdownProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: '#fff',
            marginBottom: '4px'
          }}>
            {golferName}
            {isCaptain && (
              <span style={{
                marginLeft: '8px',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                borderRadius: '4px',
                color: '#000'
              }}>
                ⭐ CAPTAIN (2x)
              </span>
            )}
          </h4>
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            margin: 0
          }}>
            Fantasy Points Breakdown
          </p>
        </div>
        <div style={{
          fontSize: '32px',
          fontWeight: 900,
          color: '#10b981',
          textShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
        }}>
          {scoring.finalTotal}
        </div>
      </div>

      {/* Scoring Details */}
      <div style={{ display: 'grid', gap: '12px' }}>
        
        {/* Hole-by-Hole Points */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '2px' }}>
              Hole-by-Hole Scoring
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Base points from all holes
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCaptain && scoring.holeByHolePoints > 0 && (
              <>
                <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                  {scoring.holeByHolePoints}
                </span>
                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>
                  ×2
                </span>
              </>
            )}
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
              {isCaptain ? scoring.holeByHolePoints * 2 : scoring.holeByHolePoints}
            </span>
          </div>
        </div>

        {/* Round Bonuses */}
        {scoring.roundBonuses.length > 0 && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Round Achievements {isCaptain && <span style={{ color: '#fbbf24' }}>×2</span>}
            </div>
            {scoring.roundBonuses.map((bonus, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '6px 0',
                fontSize: '12px'
              }}>
                <span style={{ color: '#9ca3af' }}>{bonus.name}</span>
                <span style={{ fontWeight: 600, color: '#10b981' }}>
                  +{isCaptain ? bonus.points * 2 : bonus.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Streak Bonuses */}
        {scoring.streakBonuses.length > 0 && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
              Scoring Streaks {isCaptain && <span style={{ color: '#fbbf24' }}>×2</span>}
            </div>
            {scoring.streakBonuses.map((bonus, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '6px 0',
                fontSize: '12px'
              }}>
                <span style={{ color: '#9ca3af' }}>{bonus.name}</span>
                <span style={{ fontWeight: 600, color: '#fbbf24' }}>
                  +{isCaptain ? bonus.points * 2 : bonus.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Placement Bonus */}
        {scoring.placementBonus > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '2px' }}>
                Tournament Placement
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                Final position bonus
              </div>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7' }}>
              +{scoring.placementBonus}
            </span>
          </div>
        )}

        {/* Cut Made Bonus */}
        {scoring.cutBonus > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>
                Made the Cut
              </div>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>
              +{scoring.cutBonus}
            </span>
          </div>
        )}
      </div>

      {/* Total Calculation Summary */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '2px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
            <span>Subtotal (before captain)</span>
            <span>{scoring.subtotal}</span>
          </div>
          {isCaptain && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', fontWeight: 600 }}>
              <span>Captain Multiplier (2x scoring & bonuses)</span>
              <span>+{(scoring.holeByHolePoints + scoring.roundBonusTotal + scoring.streakBonusTotal)}</span>
            </div>
          )}
          {(scoring.placementBonus > 0 || scoring.cutBonus > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
              <span>Placement & Cut (not multiplied)</span>
              <span>+{scoring.placementBonus + scoring.cutBonus}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '18px',
            fontWeight: 800,
            color: '#10b981',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span>Final Total</span>
            <span>{scoring.finalTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
