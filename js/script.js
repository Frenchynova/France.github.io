// Load the saved theme early so the page doesn't flash the wrong style.
(function () {
  try {
    const savedStyle = localStorage.getItem("holidae-style") || "cinematic";
    document.documentElement.setAttribute("data-holidae-style", savedStyle);
  } catch (error) {
    document.documentElement.setAttribute("data-holidae-style", "cinematic");
  }

  document.documentElement.classList.add("js-enabled");
})();

// Main site interactions start after the HTML is ready.
document.addEventListener("DOMContentLoaded", function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  const main = document.querySelector("main");
  if (main && !main.id) {
    main.id = "main-content";
  }

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a");

  // Reused because the menu closes from links and the Escape key.
  function closeNavigation() {
    if (!navToggle || !siteNav) return;

    siteNav.classList.remove("open");
    navToggle.classList.remove("active");
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = !siteNav.classList.contains("open");
      siteNav.classList.toggle("open", isOpen);
      navToggle.classList.toggle("active", isOpen);
      document.body.classList.toggle("nav-open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", closeNavigation);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNavigation();
    });
  }

  const siteHeader = document.querySelector(".site-header");

  // Adds a class once the header is no longer sitting at the very top.
  if (siteHeader) {
    const updateHeaderScroll = function () {
      siteHeader.classList.toggle("scrolled", window.scrollY > 20);
    };

    updateHeaderScroll();
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     VISUAL STYLE SWITCHER
  --------------------------------------------------------- */
  // Theme buttons are generated from this list instead of writing each one manually.
  const visualStyles = [
    { id: "cinematic", label: "Cinematic", helper: "Current premium look" },
    { id: "editorial", label: "Editorial", helper: "Warm magazine tone" },
    { id: "resort", label: "Resort", helper: "Fresh coastal tone" },
    { id: "night", label: "Night Luxe", helper: "Darker luxury tone" }
  ];

  function setupStyleSwitcher() {
    if (document.querySelector(".style-switcher")) return;

    const switcher = document.createElement("aside");
    switcher.className = "style-switcher";
    switcher.setAttribute("aria-label", "Holidae visual style options");

    const savedCollapsed = localStorage.getItem("holidae-style-switcher-collapsed") === "true";
    if (savedCollapsed) switcher.classList.add("collapsed");

    const currentStyle = document.documentElement.getAttribute("data-holidae-style") || "cinematic";

    switcher.innerHTML = `
      <div class="style-switcher-header">
        <span class="style-switcher-copy">
          <span class="style-switcher-title">Visual style</span>
          <span class="style-switcher-subtitle">Choose your Holidae mood</span>
        </span>
        <button class="style-switcher-toggle" type="button" aria-label="Collapse visual style options" aria-expanded="${savedCollapsed ? "false" : "true"}">✦</button>
      </div>
      <div class="style-switcher-options">
        ${visualStyles.map(function (style) {
          return `<button class="style-option-btn${style.id === currentStyle ? " active" : ""}" type="button" data-style-option="${style.id}" title="${style.helper}" aria-pressed="${style.id === currentStyle ? "true" : "false"}">${style.label}</button>`;
        }).join("")}
      </div>
    `;

    document.body.appendChild(switcher);

    const toggle = switcher.querySelector(".style-switcher-toggle");
    const optionButtons = switcher.querySelectorAll("[data-style-option]");

    if (toggle) {
      toggle.addEventListener("click", function () {
        const isCollapsed = !switcher.classList.contains("collapsed");
        switcher.classList.toggle("collapsed", isCollapsed);
        toggle.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
        localStorage.setItem("holidae-style-switcher-collapsed", isCollapsed ? "true" : "false");
      });
    }

    optionButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const style = button.getAttribute("data-style-option") || "cinematic";
        document.documentElement.setAttribute("data-holidae-style", style);
        localStorage.setItem("holidae-style", style);

        optionButtons.forEach(function (item) {
          const isActive = item === button;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      });
    });
  }

  setupStyleSwitcher();

  /* ---------------------------------------------------------
     FAQ ACCORDIONS
  --------------------------------------------------------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    const question = item.querySelector(".faq-question");
    const icon = item.querySelector(".faq-icon");

    if (!question) return;

    question.setAttribute("aria-expanded", item.classList.contains("active") ? "true" : "false");

    question.addEventListener("click", function () {
      const isActive = item.classList.toggle("active");
      question.setAttribute("aria-expanded", isActive ? "true" : "false");

      if (icon) {
        icon.textContent = isActive ? "−" : "+";
      }
    });
  });

  /* ---------------------------------------------------------
     PACKAGE FILTERS
  --------------------------------------------------------- */
  const packageFilters = document.querySelectorAll("[data-package-filter]");
  const packageCards = document.querySelectorAll("[data-package-category]");

  if (packageFilters.length > 0 && packageCards.length > 0) {
    const filterBar = document.querySelector(".package-filter-bar");
    let filterStatus = document.querySelector(".package-filter-status");

    // Small status line for the package results.
    if (filterBar && !filterStatus) {
      filterStatus = document.createElement("p");
      filterStatus.className = "package-filter-status";
      filterStatus.setAttribute("aria-live", "polite");
      filterBar.insertAdjacentElement("afterend", filterStatus);
    } else if (filterStatus) {
      filterStatus.setAttribute("aria-live", "polite");
    }

    function applyPackageFilter(filterValue) {
      let visibleCount = 0;

      packageCards.forEach(function (card) {
        const categories = (card.getAttribute("data-package-category") || "").split(" ").filter(Boolean);
        const shouldShow = filterValue === "all" || categories.includes(filterValue);
        card.classList.toggle("is-hidden", !shouldShow);
        card.setAttribute("aria-hidden", shouldShow ? "false" : "true");
        if (shouldShow) visibleCount += 1;
      });

      packageFilters.forEach(function (button) {
        const isActive = button.getAttribute("data-package-filter") === filterValue;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      if (filterStatus) {
        const label = filterValue === "all" ? "all package styles" : `${filterValue} packages`;
        filterStatus.textContent = `Showing ${visibleCount} ${label}.`;
      }
    }

    packageFilters.forEach(function (button) {
      button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
      button.addEventListener("click", function () {
        applyPackageFilter(button.getAttribute("data-package-filter") || "all");
      });
    });

    applyPackageFilter("all");
  }

  /* ---------------------------------------------------------
     SHARED TRIP DATA
  --------------------------------------------------------- */
  // Main trip data used by the booking page and package builder.
  const destinationData = {
    "Santorini": {
      basePrice: 4950,
      heading: "Santorini is currently selected",
      copy: "A slower, scenic island stay designed around sea views, sunset evenings, and a more romantic pace.",
      bestFor: "Couples and scenic travellers",
      pace: "Slow and scenic",
      duration: "7 nights",
      budgetFeel: "Premium mid-range",
      mood: "Romantic, visual, and relaxed"
    },
    "Dubai": {
      basePrice: 4200,
      heading: "Dubai is currently selected",
      copy: "A brighter city-led trip built around skyline hotels, dining, shopping, and a more energetic luxury feel.",
      bestFor: "Luxury seekers and city-break travellers",
      pace: "Busy and polished",
      duration: "5 nights",
      budgetFeel: "Premium city break",
      mood: "Modern, stylish, and energetic"
    },
    "Maldives": {
      basePrice: 6450,
      heading: "Maldives is currently selected",
      copy: "A quieter luxury escape shaped by water villas, resort calm, and a destination that feels like a full reset.",
      bestFor: "Honeymoons and quiet luxury stays",
      pace: "Very slow and restful",
      duration: "7 nights",
      budgetFeel: "Highest luxury tier",
      mood: "Quiet, exclusive, and restorative"
    },
    "Bali": {
      basePrice: 5450,
      heading: "Bali is currently selected",
      copy: "A softer tropical package built around warm scenery, resort comfort, and a calmer island rhythm.",
      bestFor: "Resort travellers and tropical escapes",
      pace: "Gentle and balanced",
      duration: "7 nights",
      budgetFeel: "Premium accessible",
      mood: "Warm, tropical, and calm"
    },
    "Amalfi Coast": {
      basePrice: 5700,
      heading: "Amalfi Coast is currently selected",
      copy: "A more refined coastal journey focused on bright towns, elegant sea views, and Mediterranean summer style.",
      bestFor: "Stylish coastal travellers",
      pace: "Relaxed but polished",
      duration: "6 nights",
      budgetFeel: "Refined coastal premium",
      mood: "Elegant, bright, and scenic"
    },
    "Marrakech": {
      basePrice: 4450,
      heading: "Marrakech is currently selected",
      copy: "A boutique city break with stronger colour, cultural atmosphere, and warmer evening energy than a beach-first trip.",
      bestFor: "Culture-led breaks and boutique stays",
      pace: "Vibrant and varied",
      duration: "5 nights",
      budgetFeel: "Good-value premium break",
      mood: "Colourful, warm, and distinctive"
    }
  };

  const packageTierData = {
    "Essential": {
      extra: 0,
      label: "Essential",
      builderCopy: "A sharper-value enquiry focused on the destination, core hotel comfort, and the cleanest starting price.",
      bookingCopy: "Essential keeps the package focused and price-conscious while still giving the enquiry enough structure."
    },
    "Signature": {
      extra: 900,
      label: "Signature",
      builderCopy: "A balanced Holidae enquiry with stronger room preference, transfers, board guidance, and a more complete trip feel.",
      bookingCopy: "Signature is the recommended Holidae level for most travellers because it balances comfort, clarity, and value."
    },
    "Luxe": {
      extra: 1950,
      label: "Luxe",
      builderCopy: "A more premium enquiry for better room requests, celebration notes, and a higher-end holiday experience.",
      bookingCopy: "Luxe is best when the trip needs to feel more special, more polished, or more celebration-led."
    }
  };

  // One formatter for every AED price.
  function formatAED(value) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0
    }).format(value);
  }

  /* ---------------------------------------------------------
     BOOKING PAGE LOGIC
  --------------------------------------------------------- */
  const destinationSelect = document.getElementById("destination");
  const destinationButtons = document.querySelectorAll("[data-destination-trigger]");
  const travellersInput = document.getElementById("travellers");
  const roomTypeSelect = document.getElementById("room-type");
  const boardTypeSelect = document.getElementById("board-type");
  const packageTierSelect = document.getElementById("package-tier");
  const estimatePrice = document.getElementById("estimate-price");

  const bookingDestinationHeading = document.getElementById("booking-destination-heading");
  const bookingDestinationCopy = document.getElementById("booking-destination-copy");
  const bookingBestFor = document.getElementById("booking-best-for");
  const bookingTripPace = document.getElementById("booking-trip-pace");
  const bookingDuration = document.getElementById("booking-duration");
  const bookingBudgetFeel = document.getElementById("booking-budget-feel");
  const summaryDestinationTag = document.getElementById("summary-destination-tag");
  const summaryPackageTag = document.getElementById("summary-package-tag");
  const summaryPaceTag = document.getElementById("summary-pace-tag");
  const summaryDurationTag = document.getElementById("summary-duration-tag");
  const sidebarDestination = document.getElementById("sidebar-destination");
  const sidebarPackageTier = document.getElementById("sidebar-package-tier");
  const sidebarBestFor = document.getElementById("sidebar-best-for");
  const sidebarMood = document.getElementById("sidebar-mood");
  const sidebarDuration = document.getElementById("sidebar-duration");
  const estimateContext = document.getElementById("estimate-context");

  function getCurrentDestination() {
    if (!destinationSelect) return destinationData["Santorini"];
    return destinationData[destinationSelect.value] || destinationData["Santorini"];
  }

  function getCurrentPackageTier() {
    const tier = packageTierSelect ? packageTierSelect.value : "Signature";
    return packageTierData[tier] || packageTierData["Signature"];
  }

  // Price changes with destination, package, room, board, and travellers.
  function updateEstimate() {
    if (!estimatePrice) return;

    const selectedDestination = getCurrentDestination();
    const travellers = Math.max(1, parseInt(travellersInput ? travellersInput.value : "1", 10) || 1);
    const roomType = roomTypeSelect ? roomTypeSelect.value : "Standard Room";
    const boardType = boardTypeSelect ? boardTypeSelect.value : "All-inclusive";
    const packageTier = getCurrentPackageTier();

    let roomExtra = 0;
    if (roomType === "Deluxe Room") roomExtra = 750;
    if (roomType === "Sea View Suite") roomExtra = 1500;

    let boardAdjustment = 0;
    if (boardType === "Half board") boardAdjustment = -300;
    if (boardType === "Bed and breakfast") boardAdjustment = -550;

    const total = (selectedDestination.basePrice + packageTier.extra + roomExtra + boardAdjustment) * travellers;
    estimatePrice.textContent = `From ${formatAED(total)} total`;
  }

  function applyPackageTier(tierName) {
    if (!packageTierData[tierName]) return;

    if (packageTierSelect) packageTierSelect.value = tierName;
    if (summaryPackageTag) summaryPackageTag.textContent = tierName;
    if (sidebarPackageTier) sidebarPackageTier.textContent = tierName;

    if (estimateContext && destinationSelect) {
      estimateContext.textContent = `Based on traveller count, room type, board option, and ${tierName} package level for ${destinationSelect.value}.`;
    }

    updateEstimate();
  }

  // Keeps all destination text and tags matched to the selected place.
  function applyDestination(destinationName) {
    if (!destinationData[destinationName]) return;

    if (destinationSelect) destinationSelect.value = destinationName;
    const selected = destinationData[destinationName];

    if (bookingDestinationHeading) bookingDestinationHeading.textContent = selected.heading;
    if (bookingDestinationCopy) bookingDestinationCopy.textContent = selected.copy;
    if (bookingBestFor) bookingBestFor.textContent = selected.bestFor;
    if (bookingTripPace) bookingTripPace.textContent = selected.pace;
    if (bookingDuration) bookingDuration.textContent = selected.duration;
    if (bookingBudgetFeel) bookingBudgetFeel.textContent = selected.budgetFeel;
    if (summaryDestinationTag) summaryDestinationTag.textContent = destinationName;
    if (summaryPaceTag) summaryPaceTag.textContent = selected.pace;
    if (summaryDurationTag) summaryDurationTag.textContent = selected.duration;
    if (sidebarDestination) sidebarDestination.textContent = destinationName;
    if (sidebarBestFor) sidebarBestFor.textContent = selected.bestFor;
    if (sidebarMood) sidebarMood.textContent = selected.mood;
    if (sidebarDuration) sidebarDuration.textContent = selected.duration;

    if (estimateContext) {
      const tierName = packageTierSelect ? packageTierSelect.value : "Signature";
      estimateContext.textContent = `Based on traveller count, room type, board option, and ${tierName} package level for ${destinationName}.`;
    }

    destinationButtons.forEach(function (button) {
      const isActive = button.getAttribute("data-destination-trigger") === destinationName;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    updateEstimate();
  }

  if (destinationSelect) {
    destinationSelect.addEventListener("change", function () {
      applyDestination(destinationSelect.value);
    });
  }

  destinationButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
    button.addEventListener("click", function () {
      applyDestination(button.getAttribute("data-destination-trigger"));
    });
  });

  if (travellersInput) travellersInput.addEventListener("input", updateEstimate);
  if (roomTypeSelect) roomTypeSelect.addEventListener("change", updateEstimate);
  if (boardTypeSelect) boardTypeSelect.addEventListener("change", updateEstimate);
  if (packageTierSelect) {
    packageTierSelect.addEventListener("change", function () {
      applyPackageTier(packageTierSelect.value);
    });
  }

  // Pre-fills booking choices from links like booking.html?destination=Dubai&package=Luxe.
  const params = new URLSearchParams(window.location.search);
  const requestedDestination = params.get("destination");
  const requestedPackage = params.get("package") || params.get("tier");

  if (requestedPackage && packageTierData[requestedPackage]) {
    applyPackageTier(requestedPackage);
  }

  if (requestedDestination && destinationData[requestedDestination]) {
    applyDestination(requestedDestination);
  } else if (destinationSelect) {
    applyDestination(destinationSelect.value);
  } else {
    updateEstimate();
  }

  if (!requestedPackage && packageTierSelect) {
    applyPackageTier(packageTierSelect.value);
  }

  /* ---------------------------------------------------------
     BOOKING FORM VALIDATION + PROGRESS
  --------------------------------------------------------- */
  const bookingForm = document.getElementById("booking-form");
  const fullName = document.getElementById("full-name");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const departureDate = document.getElementById("departure-date");
  const formMessage = document.getElementById("form-message");

  // Date picker starts from tomorrow.
  if (departureDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    departureDate.min = tomorrow.toISOString().split("T")[0];
  }

  function setFormMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", type === "error");
    element.style.color = type === "error" ? "#b91c1c" : "#0f766e";
  }

  function setupBookingProgress() {
    if (!bookingForm || document.querySelector(".booking-progress-card")) return;

    const requiredFields = [fullName, email, phone, departureDate, travellersInput, destinationSelect, packageTierSelect].filter(Boolean);
    if (requiredFields.length === 0) return;

    const progressCard = document.createElement("div");
    progressCard.className = "booking-progress-card";
    progressCard.innerHTML = `
      <div class="booking-progress-topline">
        <strong>Enquiry readiness</strong>
        <span class="booking-progress-percent">0%</span>
      </div>
      <div class="booking-progress-track" aria-hidden="true">
        <span class="booking-progress-bar"></span>
      </div>
      <p class="booking-progress-hint">Complete the key details to make the enquiry more useful.</p>
    `;

    bookingForm.insertAdjacentElement("afterbegin", progressCard);

    const percentLabel = progressCard.querySelector(".booking-progress-percent");
    const progressBar = progressCard.querySelector(".booking-progress-bar");
    const hint = progressCard.querySelector(".booking-progress-hint");

    // Counts only the fields that matter most for the enquiry.
    function updateBookingProgress() {
      const completed = requiredFields.filter(function (field) {
        return String(field.value || "").trim() !== "";
      }).length;
      const percent = Math.round((completed / requiredFields.length) * 100);

      if (percentLabel) percentLabel.textContent = `${percent}%`;
      if (progressBar) progressBar.style.width = `${percent}%`;

      if (hint) {
        if (percent < 50) {
          hint.textContent = "Add your contact details and travel date to make this enquiry useful.";
        } else if (percent < 100) {
          hint.textContent = "Almost ready — check traveller count, date, and contact details before submitting.";
        } else {
          hint.textContent = "Ready to send. The enquiry now has the key information Holidae needs.";
        }
      }
    }

    requiredFields.forEach(function (field) {
      field.addEventListener("input", updateBookingProgress);
      field.addEventListener("change", updateBookingProgress);
    });

    updateBookingProgress();
  }

  setupBookingProgress();

  if (bookingForm && fullName && email && phone && departureDate && formMessage) {
    bookingForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const nameValue = fullName.value.trim();
      const emailValue = email.value.trim();
      const phoneValue = phone.value.trim();
      const dateValue = departureDate.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!nameValue || !emailValue || !phoneValue || !dateValue) {
        setFormMessage(formMessage, "Please complete all required fields.", "error");
        return;
      }

      if (!emailPattern.test(emailValue)) {
        setFormMessage(formMessage, "Please enter a valid email address.", "error");
        return;
      }

      if (travellersInput && parseInt(travellersInput.value, 10) < 1) {
        setFormMessage(formMessage, "Travellers must be at least 1.", "error");
        return;
      }

      const selectedDestination = destinationSelect ? destinationSelect.value : "your selected destination";
      const selectedPackage = packageTierSelect ? packageTierSelect.value : "Signature";

      setFormMessage(
        formMessage,
        `${selectedPackage} enquiry for ${selectedDestination} submitted successfully. Holidae would now review availability, package fit, and next steps before any payment.`,
        "success"
      );

      formMessage.classList.add("focus-ring-pulse");
      bookingForm.reset();

      // Restore these after reset so the page does not jump back to unrelated defaults.
      if (travellersInput) travellersInput.value = "2";
      if (roomTypeSelect) roomTypeSelect.value = "Standard Room";
      if (boardTypeSelect) boardTypeSelect.value = "All-inclusive";
      if (packageTierSelect) packageTierSelect.value = selectedPackage;
      if (destinationSelect) applyDestination(selectedDestination);
      applyPackageTier(selectedPackage);
      updateEstimate();

      bookingForm.querySelectorAll("input, select, textarea").forEach(function (field) {
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
      });

      setTimeout(function () {
        formMessage.classList.remove("focus-ring-pulse");
      }, 950);
    });
  }

  /* ---------------------------------------------------------
     PACKAGE BUILDER
  --------------------------------------------------------- */
  const packageBuilderDestination = document.getElementById("package-builder-destination");
  const packageBuilderTier = document.getElementById("package-builder-tier");
  const packageBuilderTitle = document.getElementById("package-builder-title");
  const packageBuilderCopy = document.getElementById("package-builder-copy");
  const packageBuilderLink = document.getElementById("package-builder-link");
  const builderPrice = document.getElementById("builder-price");
  const builderDuration = document.getElementById("builder-duration");
  const builderFit = document.getElementById("builder-fit");

  // Same data, different page section.
  function updatePackageBuilder() {
    if (!packageBuilderDestination || !packageBuilderTier) return;

    const destinationName = packageBuilderDestination.value;
    const tierName = packageBuilderTier.value;
    const destination = destinationData[destinationName] || destinationData["Santorini"];
    const tier = packageTierData[tierName] || packageTierData["Signature"];
    const price = destination.basePrice + tier.extra;

    if (packageBuilderTitle) packageBuilderTitle.textContent = `${destinationName} ${tierName} enquiry`;
    if (packageBuilderCopy) packageBuilderCopy.textContent = `${tier.builderCopy} ${destination.copy}`;
    if (builderPrice) builderPrice.textContent = `From ${formatAED(price)}`;
    if (builderDuration) builderDuration.textContent = destination.duration;
    if (builderFit) builderFit.textContent = destination.bestFor;
    if (packageBuilderLink) {
      packageBuilderLink.href = `booking.html?destination=${encodeURIComponent(destinationName)}&package=${encodeURIComponent(tierName)}#booking-form-section`;
      packageBuilderLink.textContent = `Continue with ${destinationName} ${tierName}`;
    }
  }

  if (packageBuilderDestination && packageBuilderTier) {
    packageBuilderDestination.addEventListener("change", updatePackageBuilder);
    packageBuilderTier.addEventListener("change", updatePackageBuilder);
    updatePackageBuilder();
  }

  /* ---------------------------------------------------------
     CONTACT FORM
  --------------------------------------------------------- */
  const contactForm = document.querySelector('form.booking-form:not(#booking-form)');
  const contactName = document.getElementById("contact-name");
  const contactEmail = document.getElementById("contact-email");
  const contactPhone = document.getElementById("contact-phone");
  const contactMessage = document.getElementById("contact-message");

  if (contactForm && contactName && contactEmail && contactPhone && contactMessage) {
    const existingMessage = contactForm.querySelector(".form-message");
    const contactFormMessage = existingMessage || document.createElement("p");

    if (!existingMessage) {
      contactFormMessage.className = "form-message";
      contactFormMessage.setAttribute("role", "status");
      contactFormMessage.setAttribute("aria-live", "polite");
      contactForm.appendChild(contactFormMessage);
    }

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const nameValue = contactName.value.trim();
      const emailValue = contactEmail.value.trim();
      const phoneValue = contactPhone.value.trim();
      const messageValue = contactMessage.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!nameValue || !emailValue || !phoneValue || !messageValue) {
        setFormMessage(contactFormMessage, "Please complete all required contact fields.", "error");
        return;
      }

      if (!emailPattern.test(emailValue)) {
        setFormMessage(contactFormMessage, "Please enter a valid email address.", "error");
        return;
      }

      setFormMessage(contactFormMessage, "Message sent successfully.", "success");
      contactForm.reset();
    });
  }

  /* ---------------------------------------------------------
     REVEALS
  --------------------------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");

  // Reveals sections as they come into view.
  if (revealItems.length > 0 && "IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 160px 0px" }
    );

    revealItems.forEach(function (item) {
      item.classList.add("reveal-animate");
      if (item.classList.contains("video-hero")) {
        item.classList.add("active");
      }
      revealObserver.observe(item);
    });

    // Fallback so nothing stays hidden if the observer is slow.
    setTimeout(function () {
      revealItems.forEach(function (item) {
        item.classList.add("active");
      });
    }, 1200);
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("active");
    });
  }

  /* ---------------------------------------------------------
     COUNTERS
  --------------------------------------------------------- */
  const counters = document.querySelectorAll(".counter");

  function setCounterComplete(counter) {
    const target = parseInt(counter.getAttribute("data-target"), 10) || 0;
    counter.textContent = `${target}+`;
  }

  if (counters.length > 0 && "IntersectionObserver" in window && !prefersReducedMotion) {
    const counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          const counter = entry.target;
          const target = parseInt(counter.getAttribute("data-target"), 10) || 0;
          let current = 0;
          const increment = Math.max(1, Math.ceil(target / 60));

          function animateCounter() {
            current += increment;
            if (current >= target) {
              counter.textContent = `${target}+`;
              return;
            }
            counter.textContent = `${current}+`;
            requestAnimationFrame(animateCounter);
          }

          animateCounter();
          observer.unobserve(counter);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  } else {
    counters.forEach(setCounterComplete);
  }

  /* ---------------------------------------------------------
     PAGE PROGRESS
  --------------------------------------------------------- */
  if (!document.querySelector(".page-progress")) {
    const progress = document.createElement("div");
    progress.className = "page-progress";
    document.body.appendChild(progress);

    const updateProgress = function () {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
      progress.style.width = `${pct}%`;
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }

  /* ---------------------------------------------------------
     CURSOR GLOW
  --------------------------------------------------------- */
  // Desktop-only glow effect.
  if (!prefersReducedMotion && isFinePointer && !document.querySelector(".cursor-glow")) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    let raf = null;
    let x = 0;
    let y = 0;

    const renderGlow = function () {
      glow.style.transform = `translate(${x}px, ${y}px)`;
      glow.style.opacity = "1";
      raf = null;
    };

    window.addEventListener("mousemove", function (event) {
      x = event.clientX;
      y = event.clientY;
      if (!raf) raf = requestAnimationFrame(renderGlow);
    }, { passive: true });

    window.addEventListener("mouseleave", function () {
      glow.style.opacity = "0";
    });
  }

  /* ---------------------------------------------------------
     CARD TILT + MAGNETIC BUTTONS
  --------------------------------------------------------- */
  if (!prefersReducedMotion && isFinePointer) {
    const tiltCards = document.querySelectorAll(".interactive-card, .deal-card, .review-card, .info-card, .mini-card, .route-card, .home-fit-card, .destination-switch, .package-level-card, .package-detail-card");

    tiltCards.forEach(function (card) {
      card.addEventListener("mousemove", function (event) {
        if (window.innerWidth < 900) return;
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rotateY = (px - 0.5) * 8;
        const rotateX = (0.5 - py) * 8;
        card.style.transform = `translateY(-7px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });

    document.querySelectorAll(".btn").forEach(function (button) {
      button.addEventListener("mousemove", function (event) {
        if (window.innerWidth < 900) return;
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${(x * 0.08).toFixed(2)}px, ${(y * 0.08).toFixed(2)}px) translateY(-3px)`;
      });

      button.addEventListener("mouseleave", function () {
        button.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     IMAGE DETAIL MODAL
  --------------------------------------------------------- */
  // Info shown when a destination image is opened.
  const imageDetails = {
    santorini: {
      label: "Destination detail",
      title: "Santorini, Greece",
      copy: "Santorini usually suits travellers looking for sea views, slower evenings, and a scenic island setting built around terraces, dining, and short walks between villages.",
      rows: { "Typical stay": "Around 7 nights", "Best for": "Couples and scenic stays", "Highlights": "Caldera views, whitewashed towns, sunset dining" }
    },
    dubai: {
      label: "Destination detail",
      title: "Dubai, UAE",
      copy: "Dubai is stronger for travellers who want a polished city break with luxury hotels, restaurants, shopping, and the option to combine city time with beach clubs or desert experiences.",
      rows: { "Typical stay": "Around 5 nights", "Best for": "Luxury city breaks", "Highlights": "Skyline hotels, shopping districts, dining" }
    },
    maldives: {
      label: "Destination detail",
      title: "Maldives",
      copy: "The Maldives is built around resort privacy, clear water, beach time, and quieter days that suit honeymoon-style or reset-focused trips.",
      rows: { "Typical stay": "Around 7 nights", "Best for": "Resort-led luxury stays", "Highlights": "Water villas, lagoons, slower pace" }
    },
    bali: {
      label: "Destination detail",
      title: "Bali, Indonesia",
      copy: "Bali combines tropical scenery, resort comfort, and a balanced pace that can include beach time, wellness, and light cultural exploring.",
      rows: { "Typical stay": "Around 7 nights", "Best for": "Tropical stays and wellness trips", "Highlights": "Resorts, greenery, beach clubs" }
    },
    amalfi: {
      label: "Destination detail",
      title: "Amalfi Coast, Italy",
      copy: "The Amalfi Coast is a strong fit for travellers who want coastal hotels, summer dining, scenic drives, and Mediterranean viewpoints.",
      rows: { "Typical stay": "Around 6 nights", "Best for": "Coastal holidays", "Highlights": "Sea views, cliffside towns, terraces" }
    },
    marrakech: {
      label: "Destination detail",
      title: "Marrakech, Morocco",
      copy: "Marrakech tends to suit travellers who want boutique stays, local markets, warm evenings, and a city break with more colour and texture than a resort-first trip.",
      rows: { "Typical stay": "Around 5 nights", "Best for": "Culture-led city breaks", "Highlights": "Riads, markets, rooftops" }
    },
    gallery1: {
      label: "Travel detail",
      title: "Travel gallery image",
      copy: "This gallery image is used to give extra context to the destination atmosphere and the type of stay it suggests.",
      rows: { "Use on site": "Editorial support image", "Best for": "Browsing mood and atmosphere", "Next step": "Open the package or booking page for the practical details" }
    },
    gallery2: {
      label: "Travel detail",
      title: "Travel gallery image",
      copy: "This gallery image adds more visual context so the destination feels easier to imagine before an enquiry is sent.",
      rows: { "Use on site": "Editorial support image", "Best for": "Understanding scenery", "Next step": "Compare package tiers for the trip style" }
    },
    gallery3: {
      label: "Travel detail",
      title: "Travel gallery image",
      copy: "This gallery image supports the destination story with a closer look at atmosphere, setting, and travel mood.",
      rows: { "Use on site": "Editorial support image", "Best for": "Visual comparison", "Next step": "Continue to booking for dates and room options" }
    }
  };

  function findImageKey(src) {
    const value = (src || "").toLowerCase();
    const keys = Object.keys(imageDetails);

    for (let i = 0; i < keys.length; i += 1) {
      if (value.indexOf(keys[i]) !== -1) return keys[i];
    }

    if (value.indexOf("amafi") !== -1) return "amalfi";
    return "";
  }

  function ensureModal() {
    let modal = document.querySelector(".image-detail-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "image-detail-modal";
    modal.innerHTML = `
      <div class="image-detail-backdrop" data-close-modal="true"></div>
      <div class="image-detail-panel" role="dialog" aria-modal="true" aria-label="Destination image detail">
        <button class="image-detail-close" type="button" aria-label="Close image detail">×</button>
        <div class="image-detail-media"><img src="" alt="Expanded destination image"></div>
        <div class="image-detail-content">
          <span class="image-detail-kicker"></span>
          <h3></h3>
          <p class="image-detail-copy"></p>
          <div class="image-detail-list"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (event) {
      if (event.target.matches("[data-close-modal='true'], .image-detail-close")) {
        modal.classList.remove("open");
        document.body.classList.remove("modal-open");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        modal.classList.remove("open");
        document.body.classList.remove("modal-open");
      }
    });

    return modal;
  }

  function openImageDetail(image) {
    const modal = ensureModal();
    const key = image.getAttribute("data-place-key") || findImageKey(image.getAttribute("src"));
    const detail = imageDetails[key] || {
      label: "Destination detail",
      title: image.getAttribute("alt") || "Destination image",
      copy: "This image is included to give a closer look at the destination and the kind of stay it suggests.",
      rows: { "Use on site": "Editorial support image", "Best for": "Understanding the destination feel", "Next step": "Use the package or booking page for the practical details" }
    };

    const modalImage = modal.querySelector(".image-detail-media img");
    const list = modal.querySelector(".image-detail-list");

    modalImage.src = image.getAttribute("src") || "";
    modalImage.alt = image.getAttribute("alt") || detail.title;
    modal.querySelector(".image-detail-kicker").textContent = detail.label;
    modal.querySelector("h3").textContent = detail.title;
    modal.querySelector(".image-detail-copy").textContent = detail.copy;
    list.innerHTML = "";

    Object.keys(detail.rows).forEach(function (label) {
      const row = document.createElement("div");
      row.className = "image-detail-row";
      row.innerHTML = `<strong>${label}</strong><span>${detail.rows[label]}</span>`;
      list.appendChild(row);
    });

    modal.classList.add("open");
    document.body.classList.add("modal-open");

    if (window.holidaeSound) {
      window.holidaeSound.play("detail");
    }
  }

  // Makes clickable images usable with keyboard too.
  document.querySelectorAll(".deal-card img, .destination-card img, .stack-large, .stack-small, .story-card img, .image-band-card img, .lookbook-card img, .journey-card img").forEach(function (img) {
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `${img.getAttribute("alt") || "Destination image"}. Open destination details`);
    img.addEventListener("click", function () { openImageDetail(img); });
    img.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openImageDetail(img);
      }
    });
  });

  /* ---------------------------------------------------------
     IMMERSIVE SOUND
  --------------------------------------------------------- */
  const soundBaseScript = Array.from(document.scripts).find(function (script) {
    const src = script.getAttribute("src") || "";
    return /(^|\/)script\.js($|\?|#)/.test(src);
  });
  const soundBaseUrl = soundBaseScript && soundBaseScript.src ? soundBaseScript.src : window.location.href;

  const soundFiles = {
    ambient: new URL("../sounds/coastal-ambient.wav", soundBaseUrl).href,
    click: new URL("../sounds/ui-click.wav", soundBaseUrl).href,
    transition: new URL("../sounds/page-transition.wav", soundBaseUrl).href,
    detail: new URL("../sounds/detail-open.wav", soundBaseUrl).href
  };

  function showAudioToast(message) {
    let toast = document.querySelector(".audio-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "audio-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showAudioToast._timer);
    showAudioToast._timer = window.setTimeout(function () {
      toast.classList.remove("show");
    }, 1500);
  }

  // Handles all site sounds from one object.
  function HolidaeSound() {
    this.enabled = false;
    this.pendingResume = false;
    this.hoverContext = null;
    this.lastHoverAt = 0;
    this.audio = {};

    try {
      this.enabled = localStorage.getItem("holidae-sound-enabled") === "true";
    } catch (error) {
      this.enabled = false;
    }

    try {
      this.audio = {
        ambient: new Audio(soundFiles.ambient),
        click: new Audio(soundFiles.click),
        transition: new Audio(soundFiles.transition),
        detail: new Audio(soundFiles.detail)
      };

      this.audio.ambient.loop = true;
      this.audio.ambient.volume = 0.24;
      this.audio.ambient.preload = "metadata";
      this.audio.click.volume = 0.1;
      this.audio.transition.volume = 0.13;
      this.audio.detail.volume = 0.12;

      const savedTime = parseFloat(sessionStorage.getItem("holidae-ambient-time") || "0");
      if (!Number.isNaN(savedTime) && savedTime > 0) {
        this.audio.ambient.currentTime = savedTime;
      }
    } catch (error) {
      this.audio = {};
      this.enabled = false;
    }
  }

  HolidaeSound.prototype.play = function (name) {
    if (!this.enabled || !this.audio[name]) return;

    try {
      if (name === "ambient") {
        this.resumeAmbient();
        return;
      }

      const clip = this.audio[name].cloneNode();
      clip.volume = this.audio[name].volume;
      clip.play().catch(function () {});
    } catch (error) {}
  };

  HolidaeSound.prototype.resumeAmbient = function () {
    const self = this;
    if (!this.enabled || !this.audio.ambient) return;

    try {
      this.audio.ambient.play().then(function () {
        self.pendingResume = false;
      }).catch(function () {
        self.pendingResume = true;
      });
    } catch (error) {
      self.pendingResume = true;
    }
  };

  HolidaeSound.prototype.pauseAmbient = function () {
    try {
      if (this.audio.ambient) this.audio.ambient.pause();
    } catch (error) {}
  };

  HolidaeSound.prototype.ensureHoverContext = function () {
    if (this.hoverContext) return this.hoverContext;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    try {
      this.hoverContext = new AudioContextConstructor();
    } catch (error) {
      return null;
    }

    return this.hoverContext;
  };

  HolidaeSound.prototype.playHover = function () {
    if (!this.enabled || prefersReducedMotion) return;

    const now = Date.now();
    if (now - this.lastHoverAt < 140) return;
    this.lastHoverAt = now;

    const context = this.ensureHoverContext();
    if (!context) return;

    if (context.state === "suspended") {
      context.resume().catch(function () {});
    }

    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(840, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1120, context.currentTime + 0.07);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.004, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.11);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.12);
  };

  HolidaeSound.prototype.toggle = function () {
    this.enabled = !this.enabled;

    try {
      localStorage.setItem("holidae-sound-enabled", this.enabled ? "true" : "false");
    } catch (error) {}

    if (this.enabled) {
      this.resumeAmbient();
      showAudioToast("Immersive sound enabled");
    } else {
      this.pendingResume = false;
      this.pauseAmbient();
      try { sessionStorage.removeItem("holidae-ambient-time"); } catch (error) {}
      showAudioToast("Immersive sound muted");
    }

    updateSoundButton();
  };

  function ensureSoundButton() {
    if (document.querySelector(".immersive-sound-toggle")) return;

    const button = document.createElement("button");
    button.className = "immersive-sound-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Toggle immersive sound");
    button.innerHTML = '<span>Immersive sound</span><span class="sound-status">Off</span>';
    button.addEventListener("click", function () {
      if (window.holidaeSound) window.holidaeSound.toggle();
    });

    document.body.appendChild(button);
  }

  function updateSoundButton() {
    const button = document.querySelector(".immersive-sound-toggle");
    if (!button || !window.holidaeSound) return;

    const status = button.querySelector(".sound-status");
    if (status) status.textContent = window.holidaeSound.enabled ? "On" : "Off";
    button.setAttribute("aria-pressed", window.holidaeSound.enabled ? "true" : "false");
  }

  function setupHoverAudio() {
    if (!isFinePointer) return;

    const selector = [
      ".btn",
      ".btn-secondary",
      ".btn-ghost",
      ".text-link",
      ".package-filter",
      ".destination-switch",
      ".style-option-btn",
      ".deal-card img",
      ".destination-card img",
      ".lookbook-card img",
      ".journey-card img",
      ".stack-large",
      ".stack-small",
      ".faq-question"
    ].join(", ");

    document.querySelectorAll(selector).forEach(function (node) {
      if (node.dataset.hoverAudioBound === "true") return;
      node.dataset.hoverAudioBound = "true";
      node.addEventListener("mouseenter", function () {
        if (window.holidaeSound) window.holidaeSound.playHover();
      });
    });
  }

  window.holidaeSound = new HolidaeSound();
  ensureSoundButton();
  updateSoundButton();

  if (window.holidaeSound.enabled) {
    window.holidaeSound.resumeAmbient();
  }

  document.addEventListener("click", function (event) {
    const clickable = event.target.closest("button, .btn, .text-link, .style-option-btn, .package-filter, .faq-question, .destination-switch, .nav-list a");
    if (!clickable || !window.holidaeSound) return;
    if (window.holidaeSound.enabled) window.holidaeSound.play("click");
  }, true);

  // Pause ambience when the tab is hidden.
  document.addEventListener("visibilitychange", function () {
    if (!window.holidaeSound) return;

    if (document.hidden) {
      try {
        if (window.holidaeSound.audio.ambient) {
          sessionStorage.setItem("holidae-ambient-time", String(window.holidaeSound.audio.ambient.currentTime || 0));
        }
      } catch (error) {}
      window.holidaeSound.pauseAmbient();
    } else if (window.holidaeSound.enabled) {
      window.holidaeSound.resumeAmbient();
    }
  });

  ["pointerdown", "keydown", "touchstart"].forEach(function (eventName) {
    window.addEventListener(eventName, function () {
      if (window.holidaeSound && window.holidaeSound.enabled && window.holidaeSound.pendingResume) {
        window.holidaeSound.resumeAmbient();
      }
    }, { passive: true });
  });

  window.addEventListener("pagehide", function () {
    if (!window.holidaeSound || !window.holidaeSound.audio.ambient) return;
    try {
      sessionStorage.setItem("holidae-ambient-time", String(window.holidaeSound.audio.ambient.currentTime || 0));
    } catch (error) {}
  });

  window.addEventListener("pageshow", function () {
    if (window.holidaeSound && window.holidaeSound.enabled) {
      window.holidaeSound.resumeAmbient();
    }
  });

  setupHoverAudio();

  /* ---------------------------------------------------------
     PAGE TRANSITIONS
  --------------------------------------------------------- */
  function setupTransitions() {
    if (prefersReducedMotion) return;

    if (!document.querySelector(".page-transition-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "page-transition-overlay";
      document.body.appendChild(overlay);
    }

    document.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        const href = link.getAttribute("href") || "";

        // Only internal page links get the transition effect.
        if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;
        if (!/\.html($|\?|#)/.test(href) && href !== "index.html") return;

        event.preventDefault();

        if (window.holidaeSound) {
          window.holidaeSound.play("transition");
        }

        document.body.classList.add("is-transitioning");
        window.setTimeout(function () {
          window.location.href = href;
        }, 180);
      });
    });
  }

  setupTransitions();
});
