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
   VIDEO CONFIGURATION & SECTION MANIFEST (LOWER SECTIONS SCROLL-SCRUBBED)
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

// Active Viewport Visibility Map
const sectionActiveMap = new Map();

/* ==========================================================================
   INITIALIZATION & ENTRY POINT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupShopNowButtons();
  initLenisSmoothScroll();
  initHeroVideoTrigger();
  preloadHeroMedia().then(() => {
    hidePreloader();
    setupViewportObserver();
    initVideoScrollTriggers();
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
   2. LENIS SMOOTH SCROLLING (OPTIMIZED 60 FPS FOR MOBILE & DESKTOP)
   ========================================================================== */
let lenis;
function initLenisSmoothScroll() {
  const isMobile = window.innerWidth <= 768;

  lenis = new Lenis({
    duration: isMobile ? 0.85 : 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: isMobile ? 1.3 : 1.8,
    syncTouch: false,
  });

  const scrollTracker = document.getElementById('global-scroll-progress');
  const navbar = document.getElementById('navbar');

  lenis.on('scroll', (e) => {
    ScrollTrigger.update();

    // GPU-friendly transform scaleX without reflow
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

  // Enable lag smoothing to gracefully prevent stutter on frame dips
  gsap.ticker.lagSmoothing(500, 33);
}

/* ==========================================================================
   2.5 HERO VIDEO SMART GESTURE PLAYBACK ENGINE
   ========================================================================== */
let heroVideoStarted = false;
let heroCleanupFns = [];

function triggerHeroPlayback() {
  if (heroVideoStarted) return;
  const heroVideo = document.getElementById('hero-video');
  const posterPicture = document.getElementById('hero-poster-picture');
  if (!heroVideo) return;

  heroVideoStarted = true;

  // Clean up all one-time event listeners
  heroCleanupFns.forEach(fn => {
    try { fn(); } catch (_) {}
  });
  heroCleanupFns = [];

  heroVideo.muted = true;
  heroVideo.playsInline = true;

  const playPromise = heroVideo.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      if (posterPicture) {
        posterPicture.classList.add('fade-out-poster');
      }
    }).catch((err) => {
      console.warn('Hero video autoplay deferred or restricted:', err);
      heroVideoStarted = false; // Allow next user interaction to trigger
    });
  }
}

function initHeroVideoTrigger() {
  const heroSection = document.getElementById('hero');

  // 1. Lenis scroll listener
  if (lenis) {
    const onLenisScroll = (e) => {
      if (Math.abs(e.scroll) > 2 || Math.abs(e.velocity) > 0.02) {
        triggerHeroPlayback();
      }
    };
    lenis.on('scroll', onLenisScroll);
    heroCleanupFns.push(() => lenis.off('scroll', onLenisScroll));
  }

  // 2. Window native scroll
  const onNativeScroll = () => {
    if (window.scrollY > 2) {
      triggerHeroPlayback();
    }
  };
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  heroCleanupFns.push(() => window.removeEventListener('scroll', onNativeScroll));

  // 3. Mouse wheel event (immediate scroll wheel gesture)
  const onWheel = (e) => {
    if (Math.abs(e.deltaY) > 2 || Math.abs(e.deltaX) > 2) {
      triggerHeroPlayback();
    }
  };
  window.addEventListener('wheel', onWheel, { passive: true });
  heroCleanupFns.push(() => window.removeEventListener('wheel', onWheel));

  // 4. Mobile touchstart and touchmove (immediate touch/swipe gesture)
  const onTouch = () => {
    triggerHeroPlayback();
  };
  window.addEventListener('touchstart', onTouch, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  heroCleanupFns.push(() => {
    window.removeEventListener('touchstart', onTouch);
    window.removeEventListener('touchmove', onTouch);
  });

  // 5. User direct click or tap anywhere on the hero section
  if (heroSection) {
    const onPointer = () => triggerHeroPlayback();
    heroSection.addEventListener('pointerdown', onPointer, { passive: true });
    heroCleanupFns.push(() => heroSection.removeEventListener('pointerdown', onPointer));
  }

  // 6. Keyboard navigation keys
  const onKey = (e) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.code)) {
      triggerHeroPlayback();
    }
  };
  window.addEventListener('keydown', onKey, { passive: true });
  heroCleanupFns.push(() => window.removeEventListener('keydown', onKey));
}

/* ==========================================================================
   3. HERO CRITICAL MEDIA PRELOAD & INSTANT LAUNCH ENGINE
   ========================================================================== */
function preloadHeroMedia() {
  return new Promise((resolve) => {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const heroPoster = document.getElementById('hero-poster-img');
    const heroVideo = document.getElementById('hero-video');

    const updateProgress = (pct) => {
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) progressText.innerText = `${pct}%`;
    };

    updateProgress(35);

    if (heroVideo) {
      heroVideo.pause();
      heroVideo.muted = true;
      heroVideo.playsInline = true;
    }

    let isDone = false;
    const finish = () => {
      if (isDone) return;
      isDone = true;
      updateProgress(100);
      resolve();
    };

    // Hero image is eager & prioritized. When decoded or loaded, page can launch immediately
    if (heroPoster) {
      if (heroPoster.complete && heroPoster.naturalWidth > 0) {
        updateProgress(80);
        setTimeout(finish, 180);
      } else {
        heroPoster.addEventListener('load', () => {
          updateProgress(85);
          setTimeout(finish, 150);
        }, { once: true });
        heroPoster.addEventListener('error', finish, { once: true });
      }
    }

    if (heroVideo) {
      if (heroVideo.readyState >= 1) {
        finish();
      } else {
        heroVideo.addEventListener('loadedmetadata', finish, { once: true });
        heroVideo.addEventListener('error', finish, { once: true });
      }
    }

    // Safety fallback: Never keep the user waiting longer than 600ms
    setTimeout(finish, 600);
  });
}

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
    document.body.classList.remove('loading-state');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 600);
  }
}

/* ==========================================================================
   4. VIEWPORT INTERSECTION OBSERVER (VIDEO LAZY-LOAD & MEMORY SAVER)
   ========================================================================== */
function setupViewportObserver() {
  const observerOptions = {
    root: null,
    rootMargin: '80% 0px 80% 0px', // Buffer zone before entering screen
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sectionId = entry.target.id;
      const isVisible = entry.isIntersecting;
      sectionActiveMap.set(sectionId, isVisible);

      const videoElem = entry.target.querySelector('.scrub-video');
      if (videoElem) {
        if (isVisible) {
          // Lazy attach video src when section approaches viewport
          if (videoElem.dataset.src && !videoElem.src) {
            videoElem.src = videoElem.dataset.src;
            videoElem.load();
          }
        } else {
          // Free hardware decoder when far outside screen
          videoElem.pause();
        }
      }
    });
  }, observerOptions);

  VIDEOS_CONFIG.forEach(cfg => {
    const secElem = document.getElementById(cfg.id);
    if (secElem) {
      sectionActiveMap.set(cfg.id, false);
      observer.observe(secElem);
    }
  });

  // Observe Hero section to pause playback when out of screen, resume without reset on return
  const heroElem = document.getElementById('hero');
  const heroVideo = document.getElementById('hero-video');
  if (heroElem && heroVideo) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!heroVideoStarted) return;
        if (entry.isIntersecting) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.05 });
    heroObserver.observe(heroElem);
  }
}

/* ==========================================================================
   5. GSAP SCROLLTRIGGER HARDWARE-FRIENDLY SEEKING ENGINE (~60 FPS)
   ========================================================================== */
function initVideoScrollTriggers() {
  VIDEOS_CONFIG.forEach(cfg => {
    const sectionElem = document.getElementById(cfg.id);
    const videoElem = document.getElementById(cfg.videoId);
    const stickyElem = sectionElem ? sectionElem.querySelector('.sticky-container') : null;
    const overlayContent = sectionElem ? sectionElem.querySelector('.editorial-content') : null;

    if (!sectionElem || !videoElem || !stickyElem) return;

    videoElem.pause();

    // Dedicated seeking queue state to eliminate video decoder thrashing
    let isSeeking = false;
    let nextTargetTime = null;
    let seekTimeoutId = null;
    const FRAME_DELTA = 0.035; // Minimum delta ~1 frame at 24fps

    function performSeek(target) {
      if (videoElem.readyState < 1 || !videoElem.duration || isNaN(videoElem.duration)) {
        return;
      }
      isSeeking = true;
      nextTargetTime = null;

      // Clear any prior safety timeout
      if (seekTimeoutId) clearTimeout(seekTimeoutId);
      seekTimeoutId = setTimeout(() => {
        isSeeking = false;
        processNextSeek();
      }, 120); // Decoder fallback watchdog

      if ('fastSeek' in videoElem && typeof videoElem.fastSeek === 'function') {
        try {
          videoElem.fastSeek(target);
        } catch (e) {
          videoElem.currentTime = target;
        }
      } else {
        videoElem.currentTime = target;
      }
    }

    function processNextSeek() {
      if (seekTimeoutId) {
        clearTimeout(seekTimeoutId);
        seekTimeoutId = null;
      }
      if (nextTargetTime !== null) {
        const target = nextTargetTime;
        if (Math.abs(videoElem.currentTime - target) >= FRAME_DELTA) {
          performSeek(target);
          return;
        }
        nextTargetTime = null;
      }
      isSeeking = false;
    }

    videoElem.addEventListener('seeked', () => {
      isSeeking = false;
      processNextSeek();
    });

    videoElem.addEventListener('error', () => {
      // Graceful error fallback: allow scrolling with poster
      isSeeking = false;
    });

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
        const computedTime = startTime + progress * (endTime - startTime);

        if (!isSeeking && videoElem.readyState >= 2) {
          if (Math.abs(videoElem.currentTime - computedTime) >= FRAME_DELTA) {
            performSeek(computedTime);
          }
        } else {
          // Enqueue newest scroll position for the next decoder cycle
          nextTargetTime = computedTime;
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
