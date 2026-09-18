import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

let lenis = null;

/* ==========================================================================
   CONFIGURABLE SHOPIFY STORE URL
   ========================================================================== */
const SHOP_URL = "https://charchandpage2.vercel.app/";

/* ==========================================================================
   VIDEO CONFIGURATION & SECTION MANIFEST (CINEMATIC SCROLL-SCRUBBED SECTIONS)
   ========================================================================== */
const VIDEOS_CONFIG = [
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

/* ==========================================================================
   INITIALIZATION & ENTRY POINT
   ========================================================================== */
function init() {
  setupShopNowButtons();
  initLenisSmoothScroll();
  initHeroVideo();
  initVideoScrollTriggers();

  // Fast luxury preloader fade-out
  runPreloader().then(() => {
    hidePreloader();
    // Ensure Hero video is actively playing
    playHeroVideo();
  });
}

/* ==========================================================================
   1. SHOP NOW BUTTON BINDINGS & ATELIER NOTICE
   ========================================================================== */
function showAtelierNotice(message) {
  let toast = document.getElementById('atelier-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'atelier-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    toast.style.backgroundColor = '#360B12';
    toast.style.color = '#FAF8F5';
    toast.style.border = '1px solid #C5A059';
    toast.style.padding = '0.9rem 1.8rem';
    toast.style.borderRadius = '50px';
    toast.style.fontFamily = "'Montserrat', sans-serif";
    toast.style.fontSize = '0.75rem';
    toast.style.letterSpacing = '0.12em';
    toast.style.textAlign = 'center';
    toast.style.maxWidth = '90vw';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.45)';
    toast.style.zIndex = '999999';
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, 4000);
}

function setupShopNowButtons() {
  const shopBtns = [document.getElementById('shop-now-btn'), document.getElementById('final-shop-btn')];
  shopBtns.forEach(btn => {
    if (btn) {
      btn.href = SHOP_URL;
      btn.addEventListener('click', (e) => {
        if (SHOP_URL === '#SHOPIFY_URL') {
          e.preventDefault();
          showAtelierNotice('ATELIER NOTICE: Store link placeholder (#SHOPIFY_URL). Update SHOP_URL in main.js to link your store.');
        }
      });
    }
  });
}

/* ==========================================================================
   2. LENIS SMOOTH SCROLLING (OPTIMIZED 60 FPS FOR MOBILE & DESKTOP)
   ========================================================================== */
function initLenisSmoothScroll() {
  const isMobile = window.innerWidth <= 768;

  lenis = new Lenis({
    duration: isMobile ? 0.75 : 0.95,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: isMobile ? 1.2 : 1.5,
    syncTouch: false,
  });

  const scrollTracker = document.getElementById('global-scroll-progress');
  const navbar = document.getElementById('navbar');

  lenis.on('scroll', (e) => {
    ScrollTrigger.update();

    if (scrollTracker && typeof e.progress === 'number') {
      scrollTracker.style.transform = `scaleX(${e.progress})`;
    }

    if (navbar) {
      if (e.scroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // lagSmoothing(0) prevents GSAP jumpiness and stutter during Lenis smooth scrolling
  gsap.ticker.lagSmoothing(0);
}

/* ==========================================================================
   3. HERO VIDEO ENGINE (AUTOPLAY + CINEMATIC LOOP + MOBILE GESTURE FALLBACK)
   ========================================================================== */
function playHeroVideo() {
  const heroVideo = document.getElementById('hero-video');
  if (!heroVideo) return;

  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.loop = true;

  const promise = heroVideo.play();
  if (promise !== undefined) {
    promise.catch((err) => {
      console.warn('Hero video autoplay deferred by browser policy:', err);
      // Fallback: resume immediately on any user gesture
      const resumeOnGesture = () => {
        heroVideo.play().catch(() => {});
        ['click', 'touchstart', 'scroll', 'wheel', 'keydown'].forEach(evt => {
          window.removeEventListener(evt, resumeOnGesture);
        });
      };
      ['click', 'touchstart', 'scroll', 'wheel', 'keydown'].forEach(evt => {
        window.addEventListener(evt, resumeOnGesture, { passive: true, once: true });
      });
    });
  }
}

function initHeroVideo() {
  const heroVideo = document.getElementById('hero-video');
  if (!heroVideo) return;

  heroVideo.muted = true;
  heroVideo.playsInline = true;
  heroVideo.autoplay = true;
  heroVideo.loop = true;

  playHeroVideo();

  // User interaction insurance: ensure video starts playing on first tap/scroll
  const ensurePlaying = () => {
    if (heroVideo.paused) {
      heroVideo.play().catch(() => {});
    }
  };
  window.addEventListener('click', ensurePlaying, { passive: true });
  window.addEventListener('touchstart', ensurePlaying, { passive: true });
  window.addEventListener('scroll', ensurePlaying, { passive: true });
}

/* ==========================================================================
   4. FAST LUXURY PRELOADER
   ========================================================================== */
function runPreloader() {
  return new Promise((resolve) => {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    let resolved = false;

    const complete = () => {
      if (resolved) return;
      resolved = true;
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.innerText = '100%';
      setTimeout(resolve, 60);
    };

    // Quick initial jump
    if (progressBar) progressBar.style.width = '55%';
    if (progressText) progressText.innerText = '55%';

    // Any touch/click/key skips preloader immediately
    ['click', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, complete, { once: true, passive: true });
    });

    // Fast finish in ~140ms
    setTimeout(() => {
      if (progressBar) progressBar.style.width = '90%';
      if (progressText) progressText.innerText = '90%';
    }, 50);

    setTimeout(complete, 140);
  });
}

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  document.body.classList.remove('loading-state');
  if (preloader) {
    preloader.classList.add('fade-out');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 350);
  }
}

/* ==========================================================================
   5. GSAP SCROLLTRIGGER CINEMATIC VIDEO SCRUBBING ENGINE
   ========================================================================== */
function initVideoScrollTriggers() {
  VIDEOS_CONFIG.forEach(cfg => {
    const sectionElem = document.getElementById(cfg.id);
    const videoElem = document.getElementById(cfg.videoId);
    const stickyElem = sectionElem ? sectionElem.querySelector('.sticky-container') : null;
    const overlayContent = sectionElem ? sectionElem.querySelector('.editorial-content') : null;

    if (!sectionElem || !videoElem || !stickyElem) return;

    videoElem.pause();
    videoElem.muted = true;
    videoElem.playsInline = true;

    // Progressive buffer: warm up video stream only when user approaches the section
    ScrollTrigger.create({
      trigger: sectionElem,
      start: 'top 150%',
      once: true,
      onEnter: () => {
        if (videoElem.preload !== 'auto') {
          videoElem.preload = 'auto';
        }
      }
    });

    let targetTime = 0;
    let pendingSeek = false;

    const performSeek = () => {
      if (videoElem.readyState < 1 || !videoElem.duration || isNaN(videoElem.duration)) {
        return;
      }
      if (Math.abs(videoElem.currentTime - targetTime) <= 0.02) {
        return;
      }
      // If hardware decoder is already seeking, queue latest target time
      // to avoid decoder abort loops that freeze the browser
      if (videoElem.seeking) {
        pendingSeek = true;
        return;
      }

      try {
        if (typeof videoElem.fastSeek === 'function') {
          videoElem.fastSeek(targetTime);
        } else {
          videoElem.currentTime = targetTime;
        }
      } catch (err) {
        videoElem.currentTime = targetTime;
      }
    };

    videoElem.addEventListener('seeked', () => {
      if (pendingSeek) {
        pendingSeek = false;
        performSeek();
      }
    });

    ScrollTrigger.create({
      trigger: sectionElem,
      pin: stickyElem,
      start: 'top top',
      end: 'bottom bottom',
      pinSpacing: false,
      scrub: 0.1,
      onUpdate: (self) => {
        const progress = self.progress;
        const duration = videoElem.duration || 5.0;

        const startTime = duration * cfg.startRatio;
        const endTime = duration * cfg.endRatio;
        targetTime = startTime + progress * (endTime - startTime);

        performSeek();

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
   EXECUTE APP LIFECYCLE
   ========================================================================== */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
