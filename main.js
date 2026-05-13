/**
 * Luna Beauvois Portfolio - Interactive Controller
 * Mobile-first responsive portfolio with touch gestures and desktop scroll-jacking
 */

class PortfolioController {
    constructor() {
        this.currentSection = 0;
        this.totalSections = 5;
        this.isTransitioning = false;
        this.isMobile = window.innerWidth < 768 || (window.innerWidth <= 1024 && 'ontouchstart' in window);
        this.hasInteracted = false;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        
        // Desktop scroll handling
        this.wheelTimeout = null;
        this.scrollTimeout = null;
        
        // Mobile mosaic cycling
        this.mosaicIntervals = {};
        this.mosaicCurrentIndex = {};
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateActiveStates(0);
        this.hideSwipeHintsAfterDelay();
        
        // Initialize desktop scroll position
        if (!this.isMobile) {
            window.scrollTo(0, 0);
        }
        
        // Initialize mobile mosaic cycling
        if (this.isMobile) {
            this.initMosaicCycling();
            this.preventMobileScrolling();
        }
        
        // Handle resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768 || (window.innerWidth <= 1024 && 'ontouchstart' in window);
            
            if (wasMobile !== this.isMobile) {
                this.handleBreakpointChange();
            }
        });
    }
    
    bindEvents() {
        // Mobile top timeline
        document.querySelectorAll('.mobile-top-timeline .timeline-logo').forEach((logo, index) => {
            logo.addEventListener('click', () => this.navigateToSection(index));
        });
        
        // Desktop timeline
        document.querySelectorAll('.timeline-item').forEach((item, index) => {
            item.addEventListener('click', () => this.navigateToSection(index));
        });
        
        // Touch events for mobile
        this.bindTouchEvents();
        
        // Desktop scroll events
        this.bindDesktopScrollEvents();
        
        // Keyboard navigation
        this.bindKeyboardEvents();
        
        // Content card interactions
        this.bindContentCardEvents();
    }
    
    bindTouchEvents() {
        const container = document.querySelector('.portfolio-container');
        
        container.addEventListener('touchstart', (e) => {
            // Check if touch started within a content card
            const touchTarget = e.target;
            const contentCard = touchTarget.closest('.content-card');
            
            // If touch is within a content card, don't track for navigation
            if (contentCard) return;
            
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
            this.hideSwipeHints();
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            if (this.isTransitioning || !this.isMobile) return;
            
            // Check if touch ended within a content card
            const touchTarget = e.target;
            const contentCard = touchTarget.closest('.content-card');
            
            // If touch is within a content card, don't handle as navigation swipe
            if (contentCard) return;
            
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            
            this.handleSwipeGesture();
        }, { passive: true });
    }
    
    handleSwipeGesture() {
        const deltaX = this.touchStartX - this.touchEndX;
        const deltaY = this.touchStartY - this.touchEndY;
        
        // Only handle horizontal swipes
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
        
        if (isHorizontalSwipe) {
            // Horizontal swipe
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                const direction = deltaX > 0 ? 1 : -1;
                this.navigateByDirection(direction);
            }
        }
        // Removed vertical swipe functionality
    }
    
    bindDesktopScrollEvents() {
        // Chunky scroll behavior for desktop
        window.addEventListener('wheel', (e) => {
            if (this.isMobile || this.isTransitioning) {
                return; // Don't prevent default on mobile
            }
            
            e.preventDefault();
            clearTimeout(this.wheelTimeout);
            
            this.wheelTimeout = setTimeout(() => {
                const direction = e.deltaY > 0 ? 1 : -1;
                this.navigateByDirection(direction);
            }, 50);
        }, { passive: false });
        
        // Handle manual scrolling on desktop
        window.addEventListener('scroll', (e) => {
            if (!this.isMobile && !this.isTransitioning) {
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    const scrollTop = window.pageYOffset;
                    const viewportHeight = window.innerHeight;
                    const nearestSection = Math.round(scrollTop / viewportHeight);
                    
                    if (nearestSection !== this.currentSection && nearestSection >= 0 && nearestSection < this.totalSections) {
                        this.updateActiveStates(nearestSection);
                    }
                }, 100);
            }
        });
    }
    
    bindKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            if (this.isTransitioning || this.isMobile) return;
            
            let direction = 0;
            
            switch (e.key) {
                case 'ArrowDown':
                case ' ':
                    e.preventDefault();
                    direction = 1;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    direction = -1;
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                    e.preventDefault();
                    const sectionIndex = parseInt(e.key) - 1;
                    this.navigateToSection(sectionIndex);
                    return;
            }
            
            if (direction !== 0) {
                this.navigateByDirection(direction);
            }
        });
    }
    
    bindContentCardEvents() {
        document.querySelectorAll('.content-card').forEach(card => {
            // Tap to expand/collapse
            card.addEventListener('click', (e) => {
                if (!this.isMobile) return;
                
                // Don't trigger if clicking on links or interactive elements
                if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
                
                card.classList.toggle('expanded');
            });
            
            // Handle drag to expand with scroll-aware dismissal
            let startY = 0;
            let currentY = 0;
            let isDragging = false;
            let initialScrollTop = 0;
            
            card.addEventListener('touchstart', (e) => {
                if (!this.isMobile) return;
                startY = e.touches[0].clientY;
                isDragging = false;
                initialScrollTop = card.scrollTop;
            }, { passive: true });
            
            card.addEventListener('touchmove', (e) => {
                if (!this.isMobile) return;
                currentY = e.touches[0].clientY;
                const deltaY = startY - currentY;
                
                if (Math.abs(deltaY) > 10) {
                    isDragging = true;
                    
                    if (deltaY > 0 && !card.classList.contains('expanded')) {
                        // Dragging up - expand
                        card.classList.add('expanded');
                        e.preventDefault(); // Prevent any scroll interference
                    } else if (deltaY < -30 && card.classList.contains('expanded')) {
                        // Only collapse if:
                        // 1. Dragging down (30px threshold - reduced to prevent accidental refresh)
                        // 2. User is at the top of the content (scrollTop <= 3)
                        // 3. User hasn't scrolled content during this gesture
                        const currentScrollTop = card.scrollTop;
                        const hasScrolledContent = Math.abs(currentScrollTop - initialScrollTop) > 3;
                        
                        if (currentScrollTop <= 3 && !hasScrolledContent) {
                            card.classList.remove('expanded');
                            e.preventDefault(); // Prevent any scroll interference
                        }
                    }
                }
            }, { passive: false });
            
            card.addEventListener('touchend', () => {
                if (!this.isMobile) return;
                isDragging = false;
            }, { passive: true });
        });
    }
    
    navigateToSection(index) {
        if (index === this.currentSection || this.isTransitioning) return;
        if (index < 0 || index >= this.totalSections) return;
        
        this.hideSwipeHints();
        
        if (this.isMobile) {
            this.transitionMobileSection(index);
        } else {
            this.scrollToSection(index);
        }
    }
    
    navigateByDirection(direction) {
        const nextSection = this.currentSection + direction;
        if (nextSection >= 0 && nextSection < this.totalSections) {
            this.navigateToSection(nextSection);
        }
    }
    
    transitionMobileSection(index) {
        const sections = document.querySelectorAll('.portfolio-section');
        const currentSectionEl = sections[this.currentSection];
        const nextSectionEl = sections[index];
        
        this.isTransitioning = true;
        
        // Set up transition classes
        if (index > this.currentSection) {
            // Moving forward
            nextSectionEl.style.transform = 'translateX(100%)';
            nextSectionEl.classList.add('active');
            
            setTimeout(() => {
                currentSectionEl.style.transform = 'translateX(-100%)';
                nextSectionEl.style.transform = 'translateX(0)';
            }, 10);
        } else {
            // Moving backward
            nextSectionEl.style.transform = 'translateX(-100%)';
            nextSectionEl.classList.add('active');
            
            setTimeout(() => {
                currentSectionEl.style.transform = 'translateX(100%)';
                nextSectionEl.style.transform = 'translateX(0)';
            }, 10);
        }
        
        setTimeout(() => {
            currentSectionEl.classList.remove('active');
            currentSectionEl.style.transform = '';
            this.isTransitioning = false;
            
            // Update states after transition
            this.updateActiveStates(index);
            
            // Collapse any expanded cards
            document.querySelectorAll('.content-card.expanded').forEach(card => {
                card.classList.remove('expanded');
            });
        }, 600);
    }
    
    scrollToSection(index, smooth = true) {
        if (!this.isMobile) {
            this.isTransitioning = true;
            const targetY = index * window.innerHeight;
            
            if (smooth) {
                this.smoothScrollTo(targetY, () => {
                    this.isTransitioning = false;
                    this.updateActiveStates(index);
                });
            } else {
                window.scrollTo(0, targetY);
                this.isTransitioning = false;
                this.updateActiveStates(index);
            }
        }
    }
    
    smoothScrollTo(targetY, callback) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const duration = 800;
        let startTime = null;
        
        const easeInOutCubic = (t) => {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };
        
        const animateScroll = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const easedProgress = easeInOutCubic(progress);
            window.scrollTo(0, startY + distance * easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else if (callback) {
                callback();
            }
        };
        
        requestAnimationFrame(animateScroll);
    }
    
    initMosaicCycling() {
        // Initialize cycling for each section with mosaic items
        const sections = document.querySelectorAll('.portfolio-section');
        
        sections.forEach((section, sectionIndex) => {
            const mosaicItems = section.querySelectorAll('.mobile-mosaic-item');
            if (mosaicItems.length > 1) {
                this.mosaicCurrentIndex[sectionIndex] = 0;
                this.startMosaicCycling(sectionIndex, mosaicItems);
            }
        });
    }
    
    startMosaicCycling(sectionIndex, mosaicItems) {
        // Clear existing interval if any
        if (this.mosaicIntervals[sectionIndex]) {
            clearInterval(this.mosaicIntervals[sectionIndex]);
        }
        
        // Start cycling every 2 seconds
        this.mosaicIntervals[sectionIndex] = setInterval(() => {
            // Only cycle if this section is active and we're on mobile
            if (this.currentSection === sectionIndex && this.isMobile) {
                const currentIndex = this.mosaicCurrentIndex[sectionIndex];
                const nextIndex = (currentIndex + 1) % mosaicItems.length;
                
                // Remove active class from current item
                mosaicItems[currentIndex].classList.remove('active');
                
                // Add active class to next item
                mosaicItems[nextIndex].classList.add('active');
                
                // Update current index
                this.mosaicCurrentIndex[sectionIndex] = nextIndex;
            }
        }, 2000);
    }
    
    stopMosaicCycling(sectionIndex) {
        if (this.mosaicIntervals[sectionIndex]) {
            clearInterval(this.mosaicIntervals[sectionIndex]);
            delete this.mosaicIntervals[sectionIndex];
        }
    }
    
    stopAllMosaicCycling() {
        Object.keys(this.mosaicIntervals).forEach(sectionIndex => {
            this.stopMosaicCycling(sectionIndex);
        });
    }
    
    updateActiveStates(index) {
        this.currentSection = index;
        
        // Update mobile top timeline
        document.querySelectorAll('.mobile-top-timeline .timeline-logo').forEach((logo, i) => {
            logo.classList.toggle('active', i === index);
        });
        
        // Update desktop timeline
        document.querySelectorAll('.timeline-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // Update desktop content panels
        document.querySelectorAll('.content-panel').forEach((panel, i) => {
            panel.classList.toggle('visible', i === index);
        });
        
        // Add stagger effect to desktop mosaic items
        if (!this.isMobile) {
            const sections = document.querySelectorAll('.portfolio-section');
            const activeMosaic = sections[index].querySelector('.desktop-mosaic');
            if (activeMosaic) {
                const mosaicItems = activeMosaic.querySelectorAll('.mosaic-item');
                mosaicItems.forEach((item, i) => {
                    item.style.transitionDelay = `${i * 0.02}s`;
                    item.style.transform = 'scale(1)';
                });
            }
        }
    }
    
    hideSwipeHints() {
        if (!this.hasInteracted) {
            this.hasInteracted = true;
            document.querySelectorAll('.swipe-hint').forEach(hint => {
                hint.classList.add('hidden');
            });
        }
    }
    
    hideSwipeHintsAfterDelay() {
        if (this.isMobile) {
            setTimeout(() => {
                if (!this.hasInteracted) {
                    this.hideSwipeHints();
                }
            }, 5000); // Hide after 5 seconds if no interaction
        }
    }
    
    handleBreakpointChange() {
        // Reset states when switching between mobile/desktop
        this.isTransitioning = false;
        
        // Stop all mosaic cycling when switching layouts
        this.stopAllMosaicCycling();
        
        
        // Reset section positions
        document.querySelectorAll('.portfolio-section').forEach((section, index) => {
            section.style.transform = '';
            section.classList.toggle('active', index === this.currentSection);
        });
        
        // Collapse expanded cards
        document.querySelectorAll('.content-card.expanded').forEach(card => {
            card.classList.remove('expanded');
        });
        
        // Update scroll position for desktop
        if (!this.isMobile) {
            window.scrollTo(0, this.currentSection * window.innerHeight);
        } else {
            // Reinitialize mosaic cycling for mobile
            this.initMosaicCycling();
            this.preventMobileScrolling();
        }
        
        this.updateActiveStates(this.currentSection);
    }
    
    preventMobileScrolling() {
        // Aggressive scroll prevention for mobile
        if (!this.isMobile) return;
        
        // Prevent scroll events on multiple targets
        const targets = [document, window, document.documentElement, document.body];
        targets.forEach(target => {
            target.addEventListener('scroll', this.preventScroll, { passive: false });
            target.addEventListener('wheel', this.preventScroll, { passive: false });
            target.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        });
        
        // Ensure scroll position is always 0
        this.resetScrollPosition();
    }
    
    resetScrollPosition() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (document.scrollingElement) {
            document.scrollingElement.scrollTop = 0;
            document.scrollingElement.scrollLeft = 0;
        }
    }
    
    preventScroll = (e) => {
        if (this.isMobile) {
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo(0, 0);
            return false;
        }
    }
    
    handleTouchMove = (e) => {
        if (!this.isMobile) return;
        
        // Allow touch move within content cards and for swipe navigation
        const target = e.target;
        const contentCard = target.closest('.content-card');
        const portfolioContainer = target.closest('.portfolio-container');
        
        // Allow if it's within a content card or the main portfolio container
        if (contentCard || portfolioContainer) {
            return true;
        }
        
        // Block everything else
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

// Performance optimizations
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-duration', '0.01ms');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PortfolioController();
    });
} else {
    new PortfolioController();
}

// Video optimization for mobile
if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target.tagName === 'VIDEO') {
                if (entry.isIntersecting) {
                    // Only load video when it becomes visible
                    const video = entry.target;
                    if (video.readyState === 0) {
                        video.load(); // Trigger loading
                    }
                    
                    // Play when loaded enough
                    if (video.readyState >= 2) {
                        video.play().catch(() => {
                            console.log('Autoplay prevented for video');
                        });
                    } else {
                        video.addEventListener('canplay', () => {
                            video.play().catch(() => {
                                console.log('Autoplay prevented for video');
                            });
                        }, { once: true });
                    }
                } else {
                    entry.target.pause();
                }
            }
        });
    }, { threshold: 0.3 });
    
    document.querySelectorAll('video').forEach(video => {
        videoObserver.observe(video);
    });
}

// Lazy loading for images and iframes
if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.dataset.src) {
                    element.src = element.dataset.src;
                    element.removeAttribute('data-src');
                    lazyObserver.unobserve(element);
                }
            }
        });
    });
    
    // Observe images and iframes with data-src
    document.querySelectorAll('img[data-src], iframe[data-src]').forEach(element => {
        lazyObserver.observe(element);
    });
}