/**
 * Askit Educate Template Kit Interactive JavaScript
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("Askit Educate Template Kit JS Initialized.");

  // 1. Accordion Functionality
  initAccordions();

  // 2. Mobile Menu Toggle
  initMobileMenu();

  // 3. Search Popup
  initSearchPopup();

  // 4. Number Counters Animation
  initCounters();

  // 5. Initialize Swiper Carousels
  initSwipers();

  // 6. Sticky Header
  initStickyHeader();

  // 7. Form Submissions
  initFormHandlers();
});

/* --- Accordions --- */
function initAccordions() {
  // Elementor Nested Accordions & ElementsKit Accordions
  const accordionTitles = document.querySelectorAll(
    ".e-n-accordion-item-title, .elementskit-card-header, .elementor-tab-title"
  );

  accordionTitles.forEach(title => {
    title.addEventListener("click", function (e) {
      e.preventDefault();
      
      const item = title.closest(".e-n-accordion-item, .elementskit-card, .elementor-tab-title");
      const parentContainer = title.closest(".e-n-accordion, .elementskit-accordion, .elementor-accordion");
      
      // Find content panel
      let content = title.nextElementSibling;
      if (!content && item) {
        content = item.querySelector(".e-n-accordion-item-content, .elementskit-card-body, .elementor-tab-content");
      }

      if (!content) return;

      const isExpanded = title.getAttribute("aria-expanded") === "true" || title.classList.contains("active");

      // Optional: Close sibling accordion items in the same container
      if (parentContainer) {
        const siblingTitles = parentContainer.querySelectorAll(".e-n-accordion-item-title, .elementskit-card-header, .elementor-tab-title");
        const siblingContents = parentContainer.querySelectorAll(".e-n-accordion-item-content, .elementskit-card-body, .elementor-tab-content");

        siblingTitles.forEach(t => {
          t.setAttribute("aria-expanded", "false");
          t.classList.remove("active");
        });

        siblingContents.forEach(c => {
          c.setAttribute("hidden", "true");
          c.style.display = "none";
          if (c.classList.contains("show")) {
            c.classList.remove("show");
          }
        });
      }

      if (!isExpanded) {
        title.setAttribute("aria-expanded", "true");
        title.classList.add("active");
        content.removeAttribute("hidden");
        content.style.display = "block";
        content.classList.add("show");
      }
    });
  });
}

/* --- Mobile Menu Drawer --- */
function initMobileMenu() {
  const togglers = document.querySelectorAll(".elementskit-menu-toggler, .elementskit-nav-identity-panel button, .navbar-toggler");
  const offcanvasMenu = document.querySelector(".elementskit-menu-offcanvas-elements, .elementskit-navbar-nav-default, .elementskit-menu-container");

  togglers.forEach(toggler => {
    toggler.addEventListener("click", function () {
      if (offcanvasMenu) {
        offcanvasMenu.classList.toggle("active");
        offcanvasMenu.classList.toggle("elementskit-menu-open");
      }
    });
  });

  // Mobile Submenu Accordions
  const dropdownItems = document.querySelectorAll(".elementskit-dropdown-has > a, .menu-item-has-children > a");
  dropdownItems.forEach(item => {
    item.addEventListener("click", function (e) {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        const submenu = item.nextElementSibling;
        if (submenu) {
          submenu.classList.toggle("elementskit-dropdown-open");
          submenu.style.display = submenu.style.display === "block" ? "none" : "block";
        }
      }
    });
  });
}

/* --- Search Popup --- */
function initSearchPopup() {
  const searchButtons = document.querySelectorAll('a[href="#search"], .ekit_search-button, .header-search-icon');
  
  // Create search modal HTML if not present
  let modal = document.querySelector(".custom-search-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "custom-search-modal";
    modal.innerHTML = `
      <div class="custom-search-box">
        <span class="custom-search-close">&times;</span>
        <form action="courses.html" method="GET">
          <input type="text" name="s" placeholder="Search courses, categories, articles..." autofocus />
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const closeBtn = modal.querySelector(".custom-search-close");

  searchButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.classList.add("active");
      modal.querySelector("input").focus();
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      modal.classList.remove("active");
    });
  }

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
  });
}

/* --- Smooth Number Counters --- */
function initCounters() {
  const counters = document.querySelectorAll(".elementor-counter-number");
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute("data-to-value") || counter.innerText.replace(/,/g, "") || "100", 10);
        const duration = parseInt(counter.getAttribute("data-duration") || "2000", 10);
        let start = 0;
        const stepTime = Math.abs(Math.floor(duration / target));

        let timer = setInterval(() => {
          start += 1;
          counter.innerText = start;
          if (start >= target) {
            counter.innerText = target;
            clearInterval(timer);
          }
        }, Math.max(stepTime, 20));

        obs.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

/* --- Initialize Swiper Carousels --- */
function initSwipers() {
  if (typeof Swiper === "undefined") return;

  // Generic Swiper Slider Initialization
  const swiperContainers = document.querySelectorAll(".swiper-container, .elementor-swiper, .swiper");

  swiperContainers.forEach(container => {
    new Swiper(container, {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      pagination: {
        el: container.querySelector(".swiper-pagination"),
        clickable: true,
      },
      navigation: {
        nextEl: container.querySelector(".swiper-button-next"),
        prevEl: container.querySelector(".swiper-button-prev"),
      },
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 20,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 30,
        },
      },
    });
  });
}

/* --- Sticky Header --- */
function initStickyHeader() {
  const header = document.querySelector("header, .elementor-location-header");
  if (!header) return;

  window.addEventListener("scroll", function () {
    if (window.scrollY > 150) {
      header.classList.add("is-sticky");
    } else {
      header.classList.remove("is-sticky");
    }
  });
}

/* --- Contact & Application Forms --- */
function initFormHandlers() {
  const forms = document.querySelectorAll("form.metform-form, form");
  forms.forEach(form => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerText || submitBtn.value;
        submitBtn.innerText = "Message Sent!";
        submitBtn.disabled = true;
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.disabled = false;
          form.reset();
        }, 3000);
      }
    });
  });
}
