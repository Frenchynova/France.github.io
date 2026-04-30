// This runs immediately before the page renders — if we waited for DOMContentLoaded
// the user would briefly see the wrong theme before it gets corrected (flash of unstyled content).
// If localStorage is blocked (private mode, etc.) we just fall back to Cinematic.
(function () {
  try {
    const savedStyle = localStorage.getItem("holidae-style") || "cinematic";
    document.documentElement.setAttribute("data-holidae-style", savedStyle);
  } catch (error) {
    document.documentElement.setAttribute("data-holidae-style", "cinematic");
  }

  // CSS uses .js-enabled to enable animations that would break without JavaScript
  document.documentElement.classList.add("js-enabled");
})();

document.addEventListener("DOMContentLoaded", function () {

  // Check these once upfront so we don't repeatedly query matchMedia throughout the file.
  // prefersReducedMotion disables animations for accessibility; isFinePointer skips hover effects on touch devices.
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  // Ensure <main> has an ID so the skip link actually works.
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "main-content";


  /* ─── NAVIGATION ─────────────────────────────────────────── */

  const navToggle = document.querySelector(".nav-toggle");
  const siteNav   = document.querySelector(".site-nav");
  const navLinks  = document.querySelectorAll(".site-nav a");

  // Pulled out as its own function because both the hamburger button
  // and the Escape key need to trigger it — avoids duplicating the same cleanup logic.
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

    navLinks.forEach(function (link) { link.addEventListener("click", closeNavigation); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNavigation(); });
  }

  const siteHeader = document.querySelector(".site-header");

  if (siteHeader) {
    const navList = siteHeader.querySelector(".nav-list");
    const logo    = siteHeader.querySelector(".logo");
    const toggle  = siteHeader.querySelector(".nav-toggle");

    // The header starts transparent and white-text over the video hero.
    // After 20px of scrolling it switches to an opaque pill with dark text
    // so it stays readable against the cream background behind it.
    const updateHeaderScroll = function () {
      const isScrolled = window.scrollY > 20;
      siteHeader.classList.toggle("scrolled", isScrolled);

      if (siteHeader.classList.contains("site-header-overlay")) {
        if (isScrolled) {
          if (navList) navList.classList.remove("nav-list-light");
          if (logo)    { logo.classList.remove("logo-light"); logo.style.color = ""; }
          if (toggle)  toggle.classList.remove("nav-toggle-light");
        } else {
          if (navList) navList.classList.add("nav-list-light");
          if (logo)    logo.classList.add("logo-light");
          if (toggle)  toggle.classList.add("nav-toggle-light");
        }
      }
    };

    updateHeaderScroll();
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
  }


  /* ─── VISUAL STYLE SWITCHER ──────────────────────────────── */

  // Adding a new theme is just a new entry here — the switcher builds its buttons from this array automatically.
  const visualStyles = [
    { id: "cinematic", label: "Cinematic", helper: "Default premium look" },
    { id: "editorial", label: "Editorial", helper: "Warm magazine tone"   },
    { id: "resort",    label: "Resort",    helper: "Fresh coastal tone"   },
    { id: "night",     label: "Night Luxe",helper: "Dark luxury tone"     }
  ];

  function setupStyleSwitcher() {
    if (document.querySelector(".style-switcher")) return;

    const currentStyle = document.documentElement.getAttribute("data-holidae-style") || "cinematic";

    const switcher = document.createElement("aside");
    switcher.className = "style-switcher";
    switcher.setAttribute("aria-label", "Visual style options");

    switcher.innerHTML = `
      <div class="style-switcher-label" aria-hidden="true">Style</div>
      <div class="style-switcher-options">
        ${visualStyles.map(function (s) {
          return `<button class="style-option-btn${s.id === currentStyle ? " active" : ""}" type="button"
            data-style-option="${s.id}" title="${s.helper}"
            aria-pressed="${s.id === currentStyle ? "true" : "false"}">${s.label}</button>`;
        }).join("")}
      </div>
    `;

    document.body.appendChild(switcher);

    const optionButtons = switcher.querySelectorAll("[data-style-option]");

    optionButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const style = button.getAttribute("data-style-option") || "cinematic";
        document.documentElement.setAttribute("data-holidae-style", style);
        localStorage.setItem("holidae-style", style);

        optionButtons.forEach(function (item) {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
      });
    });
  }

  setupStyleSwitcher();


  /* ─── FAQ ACCORDIONS ─────────────────────────────────────── */

  document.querySelectorAll(".faq-item").forEach(function (item) {
    const question = item.querySelector(".faq-question");
    const icon     = item.querySelector(".faq-icon");

    if (!question) return;

    question.setAttribute("aria-expanded", item.classList.contains("active") ? "true" : "false");

    question.addEventListener("click", function () {
      const isActive = item.classList.toggle("active");
      question.setAttribute("aria-expanded", isActive ? "true" : "false");
      if (icon) icon.textContent = isActive ? "−" : "+";
    });
  });


  /* ─── PACKAGE FILTERS ────────────────────────────────────── */

  const packageFilters = document.querySelectorAll("[data-package-filter]");
  const packageCards   = document.querySelectorAll("[data-package-category]");

  if (packageFilters.length > 0 && packageCards.length > 0) {
    const filterBar = document.querySelector(".package-filter-bar");
    let filterStatus = document.querySelector(".package-filter-status");

    // Create the live status line if the HTML doesn't already have one.
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
        const cats = (card.getAttribute("data-package-category") || "").split(" ").filter(Boolean);
        const show = filterValue === "all" || cats.includes(filterValue);
        card.classList.toggle("is-hidden", !show);
        card.setAttribute("aria-hidden", show ? "false" : "true");
        if (show) visibleCount++;
      });

      packageFilters.forEach(function (btn) {
        const active = btn.getAttribute("data-package-filter") === filterValue;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });

      if (filterStatus) {
        const label = filterValue === "all" ? "all package styles" : `${filterValue} packages`;
        filterStatus.textContent = `Showing ${visibleCount} ${label}.`;
      }
    }

    packageFilters.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
      btn.addEventListener("click", function () {
        applyPackageFilter(btn.getAttribute("data-package-filter") || "all");
      });
    });

    applyPackageFilter("all");
  }


  /* ─── DESTINATION + PACKAGE DATA ────────────────────────── */

  // Single source of truth for all six destinations.
  // The booking page, package builder, and sidebar all read from here —
  // so updating a price or description only needs to happen once.
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

  // Each tier is just an extra on top of whatever the destination base price is.
  // Keeping it separate means changing Essential vs Luxe pricing doesn't touch the destination data at all.
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
      bookingCopy: "Signature is the recommended level for most travellers — it balances comfort, clarity, and value."
    },
    "Luxe": {
      extra: 1950,
      label: "Luxe",
      builderCopy: "A more premium enquiry for better room requests, celebration notes, and a higher-end holiday experience.",
      bookingCopy: "Luxe is best when the trip needs to feel more special, more polished, or more celebration-led."
    }
  };

  // Centralised so every price on the page looks identical — no one-off formatting scattered around.
  function formatAED(value) {
    return new Intl.NumberFormat("en-AE", {
      style: "currency", currency: "AED", maximumFractionDigits: 0
    }).format(value);
  }


  /* ─── BOOKING PAGE ───────────────────────────────────────── */

  const destinationSelect  = document.getElementById("destination");
  const destinationButtons = document.querySelectorAll("[data-destination-trigger]");
  const travellersInput    = document.getElementById("travellers");
  const roomTypeSelect     = document.getElementById("room-type");
  const boardTypeSelect    = document.getElementById("board-type");
  const packageTierSelect  = document.getElementById("package-tier");
  const estimatePrice      = document.getElementById("estimate-price");

  // All the text elements the booking page updates when destination or tier changes.
  const bookingDestinationHeading = document.getElementById("booking-destination-heading");
  const bookingDestinationCopy    = document.getElementById("booking-destination-copy");
  const bookingBestFor            = document.getElementById("booking-best-for");
  const bookingTripPace           = document.getElementById("booking-trip-pace");
  const bookingDuration           = document.getElementById("booking-duration");
  const bookingBudgetFeel         = document.getElementById("booking-budget-feel");
  const summaryDestinationTag     = document.getElementById("summary-destination-tag");
  const summaryPackageTag         = document.getElementById("summary-package-tag");
  const summaryPaceTag            = document.getElementById("summary-pace-tag");
  const summaryDurationTag        = document.getElementById("summary-duration-tag");
  const sidebarDestination        = document.getElementById("sidebar-destination");
  const sidebarPackageTier        = document.getElementById("sidebar-package-tier");
  const sidebarBestFor            = document.getElementById("sidebar-best-for");
  const sidebarMood               = document.getElementById("sidebar-mood");
  const sidebarDuration           = document.getElementById("sidebar-duration");
  const estimateContext           = document.getElementById("estimate-context");

  function getCurrentDestination() {
    if (!destinationSelect) return destinationData["Santorini"];
    return destinationData[destinationSelect.value] || destinationData["Santorini"];
  }

  function getCurrentPackageTier() {
    const tier = packageTierSelect ? packageTierSelect.value : "Signature";
    return packageTierData[tier] || packageTierData["Signature"];
  }

  // Recalculates the live price shown in the sidebar whenever any input changes.
  // Room upgrades add a fixed premium; board type reductions apply a discount on top.
  function updateEstimate() {
    if (!estimatePrice) return;

    const dest       = getCurrentDestination();
    const travellers = Math.max(1, parseInt(travellersInput ? travellersInput.value : "1", 10) || 1);
    const roomType   = roomTypeSelect  ? roomTypeSelect.value  : "Standard Room";
    const boardType  = boardTypeSelect ? boardTypeSelect.value : "All-inclusive";
    const tier       = getCurrentPackageTier();

    let roomExtra = 0;
    if (roomType === "Deluxe Room")     roomExtra = 750;
    if (roomType === "Sea View Suite")  roomExtra = 1500;

    let boardAdjustment = 0;
    if (boardType === "Half board")        boardAdjustment = -300;
    if (boardType === "Bed and breakfast") boardAdjustment = -550;

    const total = (dest.basePrice + tier.extra + roomExtra + boardAdjustment) * travellers;
    estimatePrice.textContent = `From ${formatAED(total)} total`;
  }

  function applyPackageTier(tierName) {
    if (!packageTierData[tierName]) return;

    if (packageTierSelect)  packageTierSelect.value       = tierName;
    if (summaryPackageTag)  summaryPackageTag.textContent = tierName;
    if (sidebarPackageTier) sidebarPackageTier.textContent = tierName;

    if (estimateContext && destinationSelect) {
      estimateContext.textContent = `Based on traveller count, room type, board option, and ${tierName} package level for ${destinationSelect.value}.`;
    }

    updateEstimate();
  }

  // Updates every destination-specific element on the page in one go —
  // headings, sidebar tags, summary chips, and the live price estimate all refresh together.
  function applyDestination(destinationName) {
    if (!destinationData[destinationName]) return;

    if (destinationSelect) destinationSelect.value = destinationName;
    const d = destinationData[destinationName];

    if (bookingDestinationHeading) bookingDestinationHeading.textContent = d.heading;
    if (bookingDestinationCopy)    bookingDestinationCopy.textContent    = d.copy;
    if (bookingBestFor)            bookingBestFor.textContent            = d.bestFor;
    if (bookingTripPace)           bookingTripPace.textContent           = d.pace;
    if (bookingDuration)           bookingDuration.textContent           = d.duration;
    if (bookingBudgetFeel)         bookingBudgetFeel.textContent         = d.budgetFeel;
    if (summaryDestinationTag)     summaryDestinationTag.textContent     = destinationName;
    if (summaryPaceTag)            summaryPaceTag.textContent            = d.pace;
    if (summaryDurationTag)        summaryDurationTag.textContent        = d.duration;
    if (sidebarDestination)        sidebarDestination.textContent        = destinationName;
    if (sidebarBestFor)            sidebarBestFor.textContent            = d.bestFor;
    if (sidebarMood)               sidebarMood.textContent               = d.mood;
    if (sidebarDuration)           sidebarDuration.textContent           = d.duration;

    if (estimateContext) {
      const tierName = packageTierSelect ? packageTierSelect.value : "Signature";
      estimateContext.textContent = `Based on traveller count, room type, board option, and ${tierName} package level for ${destinationName}.`;
    }

    destinationButtons.forEach(function (btn) {
      const active = btn.getAttribute("data-destination-trigger") === destinationName;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    updateEstimate();
  }

  if (destinationSelect) {
    destinationSelect.addEventListener("change", function () {
      applyDestination(destinationSelect.value);
    });
  }

  destinationButtons.forEach(function (btn) {
    btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
    btn.addEventListener("click", function () {
      applyDestination(btn.getAttribute("data-destination-trigger"));
    });
  });

  if (travellersInput)   travellersInput.addEventListener("input",  updateEstimate);
  if (roomTypeSelect)    roomTypeSelect.addEventListener("change",   updateEstimate);
  if (boardTypeSelect)   boardTypeSelect.addEventListener("change",  updateEstimate);
  if (packageTierSelect) {
    packageTierSelect.addEventListener("change", function () {
      applyPackageTier(packageTierSelect.value);
    });
  }

  // Destination pages pass ?destination=Dubai&package=Luxe in the URL
  // so clicking "Enquire" on a card pre-fills the booking form automatically.
  const params = new URLSearchParams(window.location.search);
  const requestedDestination = params.get("destination");
  const requestedPackage     = params.get("package") || params.get("tier");

  if (requestedPackage    && packageTierData[requestedPackage])    applyPackageTier(requestedPackage);
  if (requestedDestination && destinationData[requestedDestination]) {
    applyDestination(requestedDestination);
  } else if (destinationSelect) {
    applyDestination(destinationSelect.value);
  } else {
    updateEstimate();
  }
  if (!requestedPackage && packageTierSelect) applyPackageTier(packageTierSelect.value);


  /* ─── BOOKING FORM VALIDATION + PROGRESS BAR ─────────────── */

  const bookingForm   = document.getElementById("booking-form");
  const fullName      = document.getElementById("full-name");
  const email         = document.getElementById("email");
  const phone         = document.getElementById("phone");
  const departureDate = document.getElementById("departure-date");
  const formMessage   = document.getElementById("form-message");

  // Prevent the date picker from allowing past dates — departure has to be at least tomorrow.
  if (departureDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    departureDate.min = tomorrow.toISOString().split("T")[0];
  }

  function setFormMessage(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("error", type === "error");
    el.style.color = type === "error" ? "#b91c1c" : "#0f766e";
  }

  // The progress bar gets injected once — if it already exists on the page we don't duplicate it.
  function setupBookingProgress() {
    if (!bookingForm || document.querySelector(".booking-progress-card")) return;

    const fields = [fullName, email, phone, departureDate, travellersInput, destinationSelect, packageTierSelect].filter(Boolean);
    if (fields.length === 0) return;

    const card = document.createElement("div");
    card.className = "booking-progress-card";
    card.innerHTML = `
      <div class="booking-progress-topline">
        <strong>Enquiry readiness</strong>
        <span class="booking-progress-percent">0%</span>
      </div>
      <div class="booking-progress-track" aria-hidden="true">
        <span class="booking-progress-bar"></span>
      </div>
      <p class="booking-progress-hint">Complete the key details to make the enquiry more useful.</p>
    `;

    bookingForm.insertAdjacentElement("afterbegin", card);

    const percentLabel = card.querySelector(".booking-progress-percent");
    const bar          = card.querySelector(".booking-progress-bar");
    const hint         = card.querySelector(".booking-progress-hint");

    function updateBookingProgress() {
      const completed = fields.filter(function (f) {
        return String(f.value || "").trim() !== "";
      }).length;
      const pct = Math.round((completed / fields.length) * 100);

      if (percentLabel) percentLabel.textContent = `${pct}%`;
      if (bar)          bar.style.width = `${pct}%`;

      if (hint) {
        if (pct < 50)       hint.textContent = "Add your contact details and travel date to make this enquiry useful.";
        else if (pct < 100) hint.textContent = "Almost ready — check traveller count, date, and contact details.";
        else                hint.textContent = "Ready to send. The enquiry has the key information Holidae needs.";
      }
    }

    fields.forEach(function (f) {
      f.addEventListener("input",  updateBookingProgress);
      f.addEventListener("change", updateBookingProgress);
    });

    updateBookingProgress();
  }

  setupBookingProgress();

  if (bookingForm && fullName && email && phone && departureDate && formMessage) {
    bookingForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const nameVal  = fullName.value.trim();
      const emailVal = email.value.trim();
      const phoneVal = phone.value.trim();
      const dateVal  = departureDate.value.trim();
      const emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);

      if (!nameVal || !emailVal || !phoneVal || !dateVal) {
        setFormMessage(formMessage, "Please complete all required fields.", "error");
        return;
      }

      if (!emailOk) {
        setFormMessage(formMessage, "Please enter a valid email address.", "error");
        return;
      }

      if (travellersInput && parseInt(travellersInput.value, 10) < 1) {
        setFormMessage(formMessage, "Travellers must be at least 1.", "error");
        return;
      }

      const selectedDest = destinationSelect  ? destinationSelect.value  : "your selected destination";
      const selectedPkg  = packageTierSelect  ? packageTierSelect.value  : "Signature";

      setFormMessage(
        formMessage,
        `${selectedPkg} enquiry for ${selectedDest} submitted. Holidae will review availability and next steps before any payment.`,
        "success"
      );

      formMessage.classList.add("focus-ring-pulse");
      bookingForm.reset();

      // Restore destination and tier after form.reset() so the sidebar doesn't
      // snap back to Santorini/Signature and confuse someone who just submitted.
      if (travellersInput) travellersInput.value = "2";
      if (roomTypeSelect)  roomTypeSelect.value  = "Standard Room";
      if (boardTypeSelect) boardTypeSelect.value = "All-inclusive";
      if (packageTierSelect) packageTierSelect.value = selectedPkg;
      if (destinationSelect) applyDestination(selectedDest);
      applyPackageTier(selectedPkg);
      updateEstimate();

      bookingForm.querySelectorAll("input, select, textarea").forEach(function (f) {
        f.dispatchEvent(new Event("input",  { bubbles: true }));
        f.dispatchEvent(new Event("change", { bubbles: true }));
      });

      setTimeout(function () { formMessage.classList.remove("focus-ring-pulse"); }, 950);
    });
  }


  /* ─── PACKAGE BUILDER ────────────────────────────────────── */

  const packageBuilderDestination = document.getElementById("package-builder-destination");
  const packageBuilderTier        = document.getElementById("package-builder-tier");
  const packageBuilderTitle       = document.getElementById("package-builder-title");
  const packageBuilderCopy        = document.getElementById("package-builder-copy");
  const packageBuilderLink        = document.getElementById("package-builder-link");
  const builderPrice              = document.getElementById("builder-price");
  const builderDuration           = document.getElementById("builder-duration");
  const builderFit                = document.getElementById("builder-fit");

  // The package builder on packages.html uses the same destination and tier data as the booking page.
  // Selecting a combination here generates a summary and pre-fills the booking form link.
  function updatePackageBuilder() {
    if (!packageBuilderDestination || !packageBuilderTier) return;

    const destName = packageBuilderDestination.value;
    const tierName = packageBuilderTier.value;
    const dest     = destinationData[destName] || destinationData["Santorini"];
    const tier     = packageTierData[tierName] || packageTierData["Signature"];
    const price    = dest.basePrice + tier.extra;

    if (packageBuilderTitle) packageBuilderTitle.textContent = `${destName} ${tierName} enquiry`;
    if (packageBuilderCopy)  packageBuilderCopy.textContent  = `${tier.builderCopy} ${dest.copy}`;
    if (builderPrice)        builderPrice.textContent        = `From ${formatAED(price)}`;
    if (builderDuration)     builderDuration.textContent     = dest.duration;
    if (builderFit)          builderFit.textContent          = dest.bestFor;
    if (packageBuilderLink) {
      packageBuilderLink.href        = `booking.html?destination=${encodeURIComponent(destName)}&package=${encodeURIComponent(tierName)}#booking-form-section`;
      packageBuilderLink.textContent = `Continue with ${destName} ${tierName}`;
    }
  }

  if (packageBuilderDestination && packageBuilderTier) {
    packageBuilderDestination.addEventListener("change", updatePackageBuilder);
    packageBuilderTier.addEventListener("change",        updatePackageBuilder);
    updatePackageBuilder();
  }


  /* ─── CONTACT FORM ───────────────────────────────────────── */

  // Both forms share the .booking-form class, but only the booking form has id="booking-form".
  // This selector grabs the contact form specifically without conflicting with the booking one.
  const contactForm    = document.querySelector("form.booking-form:not(#booking-form)");
  const contactName    = document.getElementById("contact-name");
  const contactEmail   = document.getElementById("contact-email");
  const contactPhone   = document.getElementById("contact-phone");
  const contactMessage = document.getElementById("contact-message");

  if (contactForm && contactName && contactEmail && contactPhone && contactMessage) {
    const existingMsg      = contactForm.querySelector(".form-message");
    const contactFormMsg   = existingMsg || document.createElement("p");

    if (!existingMsg) {
      contactFormMsg.className = "form-message";
      contactFormMsg.setAttribute("role", "status");
      contactFormMsg.setAttribute("aria-live", "polite");
      contactForm.appendChild(contactFormMsg);
    }

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const n = contactName.value.trim();
      const e = contactEmail.value.trim();
      const p = contactPhone.value.trim();
      const m = contactMessage.value.trim();

      if (!n || !e || !p || !m) {
        setFormMessage(contactFormMsg, "Please complete all required contact fields.", "error");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        setFormMessage(contactFormMsg, "Please enter a valid email address.", "error");
        return;
      }

      setFormMessage(contactFormMsg, "Message sent successfully.", "success");
      contactForm.reset();
    });
  }


  /* ─── SCROLL REVEAL ──────────────────────────────────────── */

  const revealItems = document.querySelectorAll(".reveal");

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
      // rootMargin extends the trigger zone below the viewport so sections
      // start fading in slightly before they're fully in view — feels more natural.
      { threshold: 0.01, rootMargin: "0px 0px 160px 0px" }
    );

    revealItems.forEach(function (item) {
      item.classList.add("reveal-animate");
      // The hero is already visible on load, so don't animate it in.
      if (item.classList.contains("video-hero")) item.classList.add("active");
      revealObserver.observe(item);
    });

    // Safety net — if the IntersectionObserver fires slowly on a heavy page,
    // this makes sure nothing stays invisible after 1.2 seconds regardless.
    setTimeout(function () {
      revealItems.forEach(function (item) { item.classList.add("active"); });
    }, 1200);

  } else {
    revealItems.forEach(function (item) { item.classList.add("active"); });
  }


  /* ─── ANIMATED STAT COUNTERS ─────────────────────────────── */

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

          const counter   = entry.target;
          const target    = parseInt(counter.getAttribute("data-target"), 10) || 0;
          let current     = 0;
          const increment = Math.max(1, Math.ceil(target / 60));

          function tick() {
            current += increment;
            if (current >= target) { counter.textContent = `${target}+`; return; }
            counter.textContent = `${current}+`;
            requestAnimationFrame(tick);
          }

          tick();
          observer.unobserve(counter);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (c) { counterObserver.observe(c); });
  } else {
    counters.forEach(setCounterComplete);
  }


  /* ─── PAGE SCROLL PROGRESS BAR ───────────────────────────── */

  if (!document.querySelector(".page-progress")) {
    const progress = document.createElement("div");
    progress.className = "page-progress";
    document.body.appendChild(progress);

    const updateProgress = function () {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct   = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      progress.style.width = `${pct}%`;
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }


  /* ─── CURSOR GLOW ────────────────────────────────────────── */

  // Subtle radial gradient that follows the cursor on desktop.
  // Skipped entirely on touch screens and for users who prefer reduced motion — no point animating something they won't see.
  if (!prefersReducedMotion && isFinePointer && !document.querySelector(".cursor-glow")) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    let raf = null;
    let x   = 0;
    let y   = 0;

    window.addEventListener("mousemove", function (e) {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        glow.style.transform = `translate(${x}px, ${y}px)`;
        glow.style.opacity   = "1";
        raf = null;
      });
    }, { passive: true });

    window.addEventListener("mouseleave", function () { glow.style.opacity = "0"; });
  }


  /* ─── CARD TILT + MAGNETIC BUTTONS ──────────────────────── */

  // 3D tilt on hover gives cards a sense of depth without being distracting.
  // Capped to 8° of rotation and turned off below 900px where it feels wrong on smaller screens.
  if (!prefersReducedMotion && isFinePointer) {
    const tiltCards = document.querySelectorAll(
      ".interactive-card, .deal-card, .review-card, .info-card, .mini-card, .route-card, .destination-switch, .package-level-card"
    );

    tiltCards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        if (window.innerWidth < 900) return;
        const r  = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top)  / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width  - 0.5) *  8;
        card.style.transform = `translateY(-7px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });

    // Buttons drift slightly toward the cursor — a subtle magnetic pull.
    // The math keeps movement small (8% of cursor offset) so it doesn't feel jittery.
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        if (window.innerWidth < 900) return;
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) * 0.08;
        const y = (e.clientY - r.top  - r.height / 2) * 0.08;
        btn.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translateY(-3px)`;
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }


  /* ─── IMAGE DETAIL MODAL ─────────────────────────────────── */

  // Modal content keyed by a substring of the image filename, so we don't need
  // data attributes on every image element — just match the src string at click time.
  const imageDetails = {
    santorini: {
      label: "Destination detail",
      title: "Santorini, Greece",
      copy: "Santorini suits travellers looking for sea views, slower evenings, and a scenic island setting built around terraces and short walks between villages.",
      rows: { "Typical stay": "Around 7 nights", "Best for": "Couples and scenic stays", "Highlights": "Caldera views, whitewashed towns, sunset dining" }
    },
    dubai: {
      label: "Destination detail",
      title: "Dubai, UAE",
      copy: "Dubai works well for travellers who want a polished city break with luxury hotels, dining, and the option to combine city time with beach clubs or desert experiences.",
      rows: { "Typical stay": "Around 5 nights", "Best for": "Luxury city breaks", "Highlights": "Skyline hotels, shopping districts, fine dining" }
    },
    maldives: {
      label: "Destination detail",
      title: "Maldives",
      copy: "The Maldives is built around resort privacy, clear water, and quieter days that suit honeymoon or reset-focused trips.",
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
      copy: "The Amalfi Coast suits travellers who want coastal hotels, summer dining, scenic drives, and Mediterranean viewpoints.",
      rows: { "Typical stay": "Around 6 nights", "Best for": "Coastal holidays", "Highlights": "Sea views, cliffside towns, terraces" }
    },
    marrakech: {
      label: "Destination detail",
      title: "Marrakech, Morocco",
      copy: "Marrakech suits travellers who want boutique stays, local markets, warm evenings, and a city break with more texture than a resort-first trip.",
      rows: { "Typical stay": "Around 5 nights", "Best for": "Culture-led city breaks", "Highlights": "Riads, medina markets, rooftops" }
    },
    gallery1: {
      label: "Travel detail", title: "Travel gallery image",
      copy: "An editorial image used to give extra context to the destination atmosphere.",
      rows: { "Use": "Editorial support", "Next step": "Open the booking page for practical details" }
    },
    gallery2: {
      label: "Travel detail", title: "Travel gallery image",
      copy: "Supporting image helping the destination feel easier to imagine before sending an enquiry.",
      rows: { "Use": "Editorial support", "Next step": "Compare package tiers for the trip style" }
    },
    gallery3: {
      label: "Travel detail", title: "Travel gallery image",
      copy: "A closer look at atmosphere, setting, and travel mood for this destination.",
      rows: { "Use": "Editorial support", "Next step": "Continue to booking for dates and room options" }
    }
  };

  function findImageKey(src) {
    const v    = (src || "").toLowerCase();
    const keys = Object.keys(imageDetails);
    for (let i = 0; i < keys.length; i++) {
      if (v.indexOf(keys[i]) !== -1) return keys[i];
    }
    if (v.indexOf("amafi") !== -1) return "amalfi";
    return "";
  }

  // Only create the modal DOM once and reuse it — swapping content is cheaper than rebuilding the element on every click.
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

    modal.addEventListener("click", function (e) {
      if (e.target.matches("[data-close-modal='true'], .image-detail-close")) {
        modal.classList.remove("open");
        document.body.classList.remove("modal-open");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        modal.classList.remove("open");
        document.body.classList.remove("modal-open");
      }
    });

    return modal;
  }

  function openImageDetail(image) {
    const modal  = ensureModal();
    const key    = image.getAttribute("data-place-key") || findImageKey(image.getAttribute("src"));
    const detail = imageDetails[key] || {
      label: "Destination detail",
      title: image.getAttribute("alt") || "Destination image",
      copy:  "A closer look at the destination and the kind of stay it suggests.",
      rows:  { "Use": "Editorial support", "Next step": "Use the booking page for dates and room options" }
    };

    const img  = modal.querySelector(".image-detail-media img");
    const list = modal.querySelector(".image-detail-list");

    img.src = image.getAttribute("src") || "";
    img.alt = image.getAttribute("alt") || detail.title;
    modal.querySelector(".image-detail-kicker").textContent   = detail.label;
    modal.querySelector("h3").textContent                     = detail.title;
    modal.querySelector(".image-detail-copy").textContent     = detail.copy;
    list.innerHTML = "";

    Object.keys(detail.rows).forEach(function (label) {
      const row = document.createElement("div");
      row.className = "image-detail-row";
      row.innerHTML = `<strong>${label}</strong><span>${detail.rows[label]}</span>`;
      list.appendChild(row);
    });

    modal.classList.add("open");
    document.body.classList.add("modal-open");
    if (window.holidaeSound) window.holidaeSound.play("detail");
  }

  // Give images tabindex and role so keyboard users can open the detail modal too, not just mouse users.
  document.querySelectorAll(".deal-card img, .destination-card img, .stack-large, .stack-small, .image-band-card img, .lookbook-card img, .journey-card img").forEach(function (img) {
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `${img.getAttribute("alt") || "Destination image"}. Open destination details`);
    img.addEventListener("click",   function ()  { openImageDetail(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openImageDetail(img); }
    });
  });


  /* ─── IMMERSIVE SOUND ────────────────────────────────────── */

  // Resolve sound paths relative to this script's own location
  // so the paths work correctly whether the page is at root or inside /pages/.
  const soundBaseScript = Array.from(document.scripts).find(function (s) {
    return /(^|\/)script\.js($|\?|#)/.test(s.getAttribute("src") || "");
  });
  const soundBaseUrl = soundBaseScript && soundBaseScript.src ? soundBaseScript.src : window.location.href;

  const soundFiles = {
    ambient:    new URL("../sounds/coastal-ambient.wav",  soundBaseUrl).href,
    click:      new URL("../sounds/ui-click.wav",         soundBaseUrl).href,
    transition: new URL("../sounds/page-transition.wav",  soundBaseUrl).href,
    detail:     new URL("../sounds/detail-open.wav",      soundBaseUrl).href
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
    showAudioToast._timer = window.setTimeout(function () { toast.classList.remove("show"); }, 1500);
  }

  function HolidaeSound() {
    this.enabled       = false;
    this.pendingResume = false;
    this.hoverContext  = null;
    this.lastHoverAt   = 0;
    this.audio         = {};

    try { this.enabled = localStorage.getItem("holidae-sound-enabled") === "true"; } catch (e) {}

    try {
      this.audio = {
        ambient:    new Audio(soundFiles.ambient),
        click:      new Audio(soundFiles.click),
        transition: new Audio(soundFiles.transition),
        detail:     new Audio(soundFiles.detail)
      };
      this.audio.ambient.loop    = true;
      this.audio.ambient.volume  = 0.24;
      this.audio.ambient.preload = "metadata";
      this.audio.click.volume      = 0.10;
      this.audio.transition.volume = 0.13;
      this.audio.detail.volume     = 0.12;

      // Restore ambient playback position if the user navigated to a new page.
      const savedTime = parseFloat(sessionStorage.getItem("holidae-ambient-time") || "0");
      if (!Number.isNaN(savedTime) && savedTime > 0) {
        this.audio.ambient.currentTime = savedTime;
      }
    } catch (e) {
      this.audio   = {};
      this.enabled = false;
    }
  }

  HolidaeSound.prototype.play = function (name) {
    if (!this.enabled || !this.audio[name]) return;
    try {
      if (name === "ambient") { this.resumeAmbient(); return; }
      // Clone the audio node so overlapping clicks don't cut each other off.
      const clip = this.audio[name].cloneNode();
      clip.volume = this.audio[name].volume;
      clip.play().catch(function () {});
    } catch (e) {}
  };

  HolidaeSound.prototype.resumeAmbient = function () {
    const self = this;
    if (!this.enabled || !this.audio.ambient) return;
    try {
      this.audio.ambient.play()
        .then(function ()  { self.pendingResume = false; })
        .catch(function () { self.pendingResume = true; });
    } catch (e) { self.pendingResume = true; }
  };

  HolidaeSound.prototype.pauseAmbient = function () {
    try { if (this.audio.ambient) this.audio.ambient.pause(); } catch (e) {}
  };

  HolidaeSound.prototype.ensureHoverContext = function () {
    if (this.hoverContext) return this.hoverContext;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try { this.hoverContext = new Ctx(); } catch (e) { return null; }
    return this.hoverContext;
  };

  // Synthesises a tiny tone on hover using the Web Audio API instead of loading
  // a separate audio file for every interactive element — much cheaper on bandwidth.
  HolidaeSound.prototype.playHover = function () {
    if (!this.enabled || prefersReducedMotion) return;
    const now = Date.now();
    if (now - this.lastHoverAt < 140) return; // throttle — no rapid-fire chirping
    this.lastHoverAt = now;

    const ctx = this.ensureHoverContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(function () {});

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(840, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1120, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.004,   ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001,  ctx.currentTime + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  };

  HolidaeSound.prototype.toggle = function () {
    this.enabled = !this.enabled;
    try { localStorage.setItem("holidae-sound-enabled", this.enabled ? "true" : "false"); } catch (e) {}

    if (this.enabled) {
      this.resumeAmbient();
      showAudioToast("Immersive sound enabled");
    } else {
      this.pendingResume = false;
      this.pauseAmbient();
      try { sessionStorage.removeItem("holidae-ambient-time"); } catch (e) {}
      showAudioToast("Immersive sound muted");
    }
    updateSoundButton();
  };

  function ensureSoundButton() {
    if (document.querySelector(".immersive-sound-toggle")) return;

    const button = document.createElement("button");
    button.className = "immersive-sound-toggle";
    button.type      = "button";
    button.setAttribute("aria-label",  "Toggle immersive sound");
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = '<span class="sound-icon" aria-hidden="true">♪</span><span class="sound-status-label">Sound</span>';
    button.addEventListener("click", function () {
      if (window.holidaeSound) window.holidaeSound.toggle();
    });
    document.body.appendChild(button);
  }

  function updateSoundButton() {
    const button = document.querySelector(".immersive-sound-toggle");
    if (!button || !window.holidaeSound) return;
    const on = window.holidaeSound.enabled;
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.classList.toggle("sound-on", on);
    const icon = button.querySelector(".sound-icon");
    if (icon) icon.textContent = on ? "♪" : "○";
  }

  function setupHoverAudio() {
    if (!isFinePointer) return;

    const selector = [
      ".btn", ".btn-secondary", ".btn-ghost", ".text-link",
      ".package-filter", ".destination-switch", ".style-option-btn",
      ".deal-card img", ".destination-card img", ".lookbook-card img",
      ".journey-card img", ".stack-large", ".stack-small", ".faq-question"
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
  if (window.holidaeSound.enabled) window.holidaeSound.resumeAmbient();

  // Play a click sound on any interactive element without attaching a listener to each one.
  document.addEventListener("click", function (e) {
    const el = e.target.closest("button, .btn, .text-link, .style-option-btn, .package-filter, .faq-question, .destination-switch, .nav-list a");
    if (el && window.holidaeSound && window.holidaeSound.enabled) window.holidaeSound.play("click");
  }, true);

  // Save the ambient track position when the user navigates away, so it
  // resumes from the same point on the next page rather than restarting from zero.
  document.addEventListener("visibilitychange", function () {
    if (!window.holidaeSound) return;
    if (document.hidden) {
      try {
        if (window.holidaeSound.audio.ambient) {
          sessionStorage.setItem("holidae-ambient-time", String(window.holidaeSound.audio.ambient.currentTime || 0));
        }
      } catch (e) {}
      window.holidaeSound.pauseAmbient();
    } else if (window.holidaeSound.enabled) {
      window.holidaeSound.resumeAmbient();
    }
  });

  // Browsers block audio autoplay until the user does something — resume ambient
  // sound on first pointer, keyboard, or touch event if we had a pending play request.
  ["pointerdown", "keydown", "touchstart"].forEach(function (eventName) {
    window.addEventListener(eventName, function () {
      if (window.holidaeSound && window.holidaeSound.enabled && window.holidaeSound.pendingResume) {
        window.holidaeSound.resumeAmbient();
      }
    }, { passive: true });
  });

  window.addEventListener("pagehide", function () {
    if (!window.holidaeSound || !window.holidaeSound.audio.ambient) return;
    try { sessionStorage.setItem("holidae-ambient-time", String(window.holidaeSound.audio.ambient.currentTime || 0)); } catch (e) {}
  });

  window.addEventListener("pageshow", function () {
    if (window.holidaeSound && window.holidaeSound.enabled) window.holidaeSound.resumeAmbient();
  });

  setupHoverAudio();


  /* ─── PAGE TRANSITIONS ───────────────────────────────────── */

  function setupTransitions() {
    if (prefersReducedMotion) return;

    if (!document.querySelector(".page-transition-overlay")) {
      const overlay = document.createElement("div");
      overlay.className = "page-transition-overlay";
      document.body.appendChild(overlay);
    }

    document.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        const href = link.getAttribute("href") || "";

        // Skip anchors, mailto/tel links, external tabs, and non-HTML hrefs —
        // we only want to intercept internal page navigations.
        if (!href || href[0] === "#" || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;
        if (!/\.html($|\?|#)/.test(href) && href !== "index.html") return;

        e.preventDefault();
        if (window.holidaeSound) window.holidaeSound.play("transition");
        document.body.classList.add("is-transitioning");
        window.setTimeout(function () { window.location.href = href; }, 180);
      });
    });
  }

  setupTransitions();
});