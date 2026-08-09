import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

export default function Landing() {
  const navigate = useNavigate();
  const textRef = useRef<SVGSVGElement>(null);
  const [isDrawn, setIsDrawn] = useState(false);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const paths = textRef.current.querySelectorAll('path');
    
    // Set initial dasharray and dashoffset
    paths.forEach(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      path.style.stroke = 'white';
      path.style.strokeWidth = '2';
      path.style.fill = 'transparent';
    });

    const tl = gsap.timeline({
      onComplete: () => {
        setIsDrawn(true);
        const token = localStorage.getItem('token');
        if (token) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      },
      onReverseComplete: () => setIsDrawn(false)
    });

    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 1.5,
      ease: "power2.inOut",
      stagger: 0.15
    })
    .to(paths, {
      fill: 'white',
      stroke: 'transparent',
      duration: 0.8,
      ease: "power1.inOut"
    }, "-=0.5");

    animationRef.current = tl;

    return () => {
      tl.kill();
    };
  }, [navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-center group">
        <svg 
          ref={textRef}
          viewBox="0 0 700 150" 
          className="w-full max-w-4xl h-auto"
        >
          {/* T */}
          <path d="M 40 40 L 110 40 M 75 40 L 75 110" />
          {/* R */}
          <path d="M 140 40 L 140 110 M 140 40 L 180 40 C 200 40 200 70 180 70 L 140 70 M 165 70 L 195 110" />
          {/* A */}
          <path d="M 220 110 L 245 40 L 270 110 M 232.5 75 L 257.5 75" />
          {/* C */}
          <path d="M 350 40 C 310 40 290 60 290 75 C 290 90 310 110 350 110" />
          {/* O */}
          <path d="M 400 75 C 400 50 420 40 440 40 C 460 40 480 50 480 75 C 480 100 460 110 440 110 C 420 110 400 100 400 75 Z" />
          {/* R */}
          <path d="M 510 40 L 510 110 M 510 40 L 550 40 C 570 40 570 70 550 70 L 510 70 M 535 70 L 565 110" />
          {/* A */}
          <path d="M 590 110 L 615 40 L 640 110 M 602.5 75 L 627.5 75" />
        </svg>

        {isDrawn && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -inset-10 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl -z-10 rounded-full mix-blend-screen"
          />
        )}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isDrawn ? 1 : 0, y: isDrawn ? 0 : 20 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-zinc-400 font-display tracking-widest uppercase text-sm"
      >
        Loading Tracora...
      </motion.p>
    </motion.div>
  );
}
