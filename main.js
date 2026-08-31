import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   CONFIGURABLE SHOPIFY STORE URL
   ========================================================================== */
const SHOP_URL = "#SHOPIFY_URL";

/* ==========================================================================
   VIDEO CONFIGURATION & SECTION MANIFEST
   ========================================================================== */
const VIDEOS_CONFIG = [
  {
    id: 'hero',
    videoId: 'hero-video',
    startRatio: 0.0,
    endRatio: 1.0,
  },
  {
    id: 'creation',
    videoId: 'creation-video',
    startRatio: 0.0,
    endRatio: 0.5,
  },
  {
    id: 'blouse',
    videoId: 'blouse-video',
    startRatio: 0.5,
    endRatio: 1.0,
  },
  {
    id: 'necklace',
    videoId: 'necklace-video',
    startRatio: 0.0,
    endRatio: 1.0,
  },
  {
    id: 'earring',
    videoId: 'earring-video',
    startRatio: 0.0,
    endRatio: 1.0,
  }
];

// Active Viewport Visibility Map
const sectionActiveMap = new Map();

/* ==========================================================================
   INITIALIZATION & ENTRY POINT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupShopNowButtons();
  initLenisSmoothScroll();
  preloadHeroVideo().then(() => {
    hidePreloader();
    setupViewportObserver();
    initVideoScrollTriggers();
    setupGlobalScrollTracker();
  });
});

/* ==========================================================================
   1. SHOP NOW BUTTON BINDINGS
   ========================================================================== */
function setupShopNowButtons() {
  const shopBtns = [document.getElementById('shop-now-btn'), document.getElementById('final-shop-btn')];
  shopBtns.forEach(btn => {
    if (btn) {
      btn.href = SHOP_URL;
      btn.addEventListener('click', (e) => {
        if (SHOP_URL === '#SHOPIFY_URL') {
          e.preventDefault();
          alert('Shopify integration placeholder: SHOP_URL is set to "#SHOPIFY_URL". Please update the SHOP_URL variable in main.js to link your store.');
        }
      });
    }
  });
}

/* ==========================================================================
   2. LENIS SMOOTH SCROLLING (OPTIMIZED FOR MOBILE & DESKTOP)
   ========================================================================== */
let lenis;
function initLenisSmoothScroll() {
  const isMobile = window.innerWidth <= 768;

  lenis = new Lenis({
    duration: isMobile ? 0.9 : 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: isMobile ? 1.5 : 2,
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/* ==========================================================================
   3. HERO & INITIAL VIDEO PRELOAD ENGINE
   ========================================================================== */
function preloadHeroVideo() {
  return new Promise((resolve) => {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const heroVideo = document.getElementById('hero-video');

    if (!heroVideo) {
      resolve();
      return;
    }

    heroVideo.pause();
    heroVideo.muted = true;
    heroVideo.playsInline = true;

    const onHeroReady = () => {
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.innerText = '100%';
      resolve();
    };

    if (heroVideo.readyState >= 2) {
      onHeroReady();
    } else {
      heroVideo.addEventListener('loadeddata', onHeroReady, { once: true });
      heroVideo.addEventListener('error', onHeroReady, { once: true });
      heroVideo.load();
    }

    // Safety fallback for instant launch
    setTimeout(resolve, 1500);
  });
}

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    document.body.classList.remove('loading-state');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 800);
  }
}

/* ==========================================================================
   4. VIEWPORT INTERSECTION OBSERVER (RESOURCE MANAGEMENT)
   ========================================================================== */
function setupViewportObserver() {
  const observerOptions = {
    root: null,
    rootMargin: '100% 0px 100% 0px', // Buffer 1 viewport height
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sectionId = entry.target.id;
      sectionActiveMap.set(sectionId, entry.isIntersecting);

      const videoElem = entry.target.querySelector('.scrub-video');
      if (videoElem && !entry.isIntersecting) {
        videoElem.pause();
      }
    });
  }, observerOptions);

  VIDEOS_CONFIG.forEach(cfg => {
    const secElem = document.getElementById(cfg.id);
    if (secElem) {
      sectionActiveMap.set(cfg.id, true);
      observer.observe(secElem);
    }
  });
}

/* ==========================================================================
   5. GSAP SCROLLTRIGGER SEEKING ENGINE (PINNED CONTINUOUS STAGE)
   ========================================================================== */
function initVideoScrollTriggers() {
  VIDEOS_CONFIG.forEach(cfg => {
    const sectionElem = document.getElementById(cfg.id);
    const videoElem = document.getElementById(cfg.videoId);
    const stickyElem = sectionElem ? sectionElem.querySelector('.sticky-container') : null;
    const overlayContent = sectionElem ? sectionElem.querySelector('.editorial-content') : null;

    if (!sectionElem || !videoElem || !stickyElem) return;

    videoElem.pause();

    let rAFPending = false;
    let isSeeking = false;
    let targetTime = 0;

    videoElem.addEventListener('seeked', () => {
      isSeeking = false;
    });

    function executeSeek() {
      if (sectionActiveMap.get(cfg.id) !== false && videoElem.duration && !isNaN(videoElem.duration)) {
        if (!isSeeking && Math.abs(videoElem.currentTime - targetTime) > 0.025) {
          isSeeking = true;
          if ('fastSeek' in videoElem && typeof videoElem.fastSeek === 'function') {
            try {
              videoElem.fastSeek(targetTime);
            } catch (e) {
              videoElem.currentTime = targetTime;
            }
          } else {
            videoElem.currentTime = targetTime;
          }
        }
      }
      rAFPending = false;
    }

    ScrollTrigger.create({
      trigger: sectionElem,
      pin: stickyElem,
      start: 'top top',
      end: 'bottom bottom',
      pinSpacing: false, // Prevents white gaps between pinned sections
      scrub: 0.1,
      onUpdate: (self) => {
        if (sectionActiveMap.get(cfg.id) === false) return;

        const progress = self.progress;
        const duration = videoElem.duration || 5.0;

        const startTime = duration * cfg.startRatio;
        const endTime = duration * cfg.endRatio;
        targetTime = startTime + progress * (endTime - startTime);

        if (!rAFPending) {
          rAFPending = true;
          requestAnimationFrame(executeSeek);
        }

        // Editorial Overlay Text Reveal
        if (overlayContent) {
          if (progress > 0.08 && progress < 0.90) {
            overlayContent.classList.add('visible');
          } else {
            overlayContent.classList.remove('visible');
          }
        }
      }
    });
  });
}

/* ==========================================================================
   6. GLOBAL SCROLL TRACKER & NAVBAR STATE
   ========================================================================== */
function setupGlobalScrollTracker() {
  const scrollTracker = document.getElementById('global-scroll-progress');
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;

    if (totalScroll > 0 && scrollTracker) {
      const pct = (currentScroll / totalScroll) * 100;
      scrollTracker.style.width = `${pct}%`;
    }

    if (navbar) {
      if (currentScroll > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }, { passive: true });
}
