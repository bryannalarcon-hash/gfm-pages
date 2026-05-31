'use client';

/**
 * SceneNav — fixed top-right dot navigator + progress bar (Scene 1-7 indicator)
 * Responds to scroll position; keyboard ArrowUp/Down/Home/End navigation.
 */

import React, { useEffect, useState, useCallback } from 'react';

const TOTAL_SCENES = 7;

export function SceneNav() {
  const [activeScene, setActiveScene] = useState(0);

  const scrollToScene = useCallback((index: number) => {
    const el = document.getElementById(`scene-${index + 1}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    const scenes = Array.from(
      { length: TOTAL_SCENES },
      (_, i) => document.getElementById(`scene-${i + 1}`)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            const idx = parseInt(id.replace('scene-', ''), 10) - 1;
            setActiveScene(idx);
          }
        }
      },
      { threshold: 0.5 }
    );

    scenes.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToScene(Math.min(activeScene + 1, TOTAL_SCENES - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToScene(Math.max(activeScene - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToScene(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToScene(TOTAL_SCENES - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeScene, scrollToScene]);

  const progressPct = ((activeScene + 1) / TOTAL_SCENES) * 100;

  return (
    <>
      {/* 1px progress bar — top edge, full width */}
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_SCENES}
        aria-valuenow={activeScene + 1}
        aria-label={`Scene ${activeScene + 1} of ${TOTAL_SCENES}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          width: `${progressPct}%`,
          background: '#4a9d44',
          transition: 'width 0.3s ease',
          zIndex: 60,
          pointerEvents: 'none',
        }}
      />

      {/* Scene dot column — top-right */}
      <nav
        aria-label="Scene navigation"
        style={{
          position: 'fixed',
          top: '50%',
          right: '1.5rem',
          transform: 'translateY(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {Array.from({ length: TOTAL_SCENES }, (_, i) => (
          <button
            key={i}
            aria-label={`Go to scene ${i + 1}`}
            onClick={() => scrollToScene(i)}
            style={{
              width: i === activeScene ? '10px' : '8px',
              height: i === activeScene ? '10px' : '8px',
              borderRadius: '50%',
              background: i === activeScene ? '#232323' : '#b7b7b6',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.2s, width 0.2s, height 0.2s',
              display: 'block',
            }}
          />
        ))}
      </nav>
    </>
  );
}
