(function () {
  if (customElements.get("header-component")) return;

  class HeaderComponent extends HTMLElement {
    connectedCallback() {
      /** @type {HTMLElement | null} */
      this.bar = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__bar")
      );
      /** @type {HTMLElement | null} */
      this.header = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header")
      );
      /** @type {HTMLElement | null} */
      this.drawer = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__drawer")
      );
      /** @type {HTMLElement | null} */
      this.searchDrawer = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__search-drawer")
      );
      /** @type {HTMLElement | null} */
      this.overlay = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__overlay")
      );
      /** @type {HTMLElement | null} */
      this.toggleBtn = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__toggle")
      );
      /** @type {NodeListOf<HTMLElement>} */
      this.drawerCloseBtns = /** @type {NodeListOf<HTMLElement>} */ (
        this.querySelectorAll(".site-header__drawer-close")
      );
      /** @type {HTMLElement | null} */
      this.searchToggleBtn = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__search-toggle")
      );
      /** @type {HTMLInputElement | null} */
      this.searchInput = /** @type {HTMLInputElement | null} */ (
        this.querySelector(".site-header__search-input")
      );
      /** @type {HTMLElement | null} */
      this.searchResults = /** @type {HTMLElement | null} */ (
        this.querySelector(".site-header__search-results")
      );
      /** @type {HTMLFormElement | null} */
      this.searchForm = /** @type {HTMLFormElement | null} */ (
        this.querySelector(".site-header__search-form")
      );
      this.stickyType = this.getAttribute("data-sticky");

      this.toggleBtn?.addEventListener("click", () => this.openDrawer());
      this.drawerCloseBtns.forEach((btn) =>
        btn.addEventListener("click", () => this.closeAll()),
      );
      this.overlay?.addEventListener("click", () => this.closeAll());
      this.searchToggleBtn?.addEventListener("click", () =>
        this.toggleSearch(),
      );

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.closeAll();
      });

      this.bindDropdowns();
      this.bindMegaMenu();
      this.bindPredictiveSearch();

      if (this.stickyType === "on_scroll_up") {
        this.bindScrollHide();
      }
    }

    setHeaderHeight() {
      if (!this.bar) return;

      const height = this.bar.offsetHeight;
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${height}px`,
      );
    }

    openDrawer() {
      if (!this.drawer || !this.overlay) return;

      this.drawer.hidden = false;
      this.overlay.hidden = false;

      requestAnimationFrame(() => this.drawer?.classList.add("is-open"));
      document.body.classList.add("site-header-lock");
      this.toggleBtn?.setAttribute("aria-expanded", "true");
    }

    toggleSearch() {
      if (!this.searchDrawer || !this.overlay) return;

      const isOpen = !this.searchDrawer.hidden;

      if (isOpen) {
        this.closeAll();
        return;
      }

      this.searchDrawer.hidden = false;
      this.overlay.hidden = false;
      document.body.classList.add("site-header-lock");
      this.searchToggleBtn?.setAttribute("aria-expanded", "true");
      this.searchInput?.focus();
    }

    closeAll() {
      this.drawer?.classList.remove("is-open");
      if (this.drawer) this.drawer.hidden = true;
      if (this.searchDrawer) this.searchDrawer.hidden = true;
      if (this.overlay) this.overlay.hidden = true;

      document.body.classList.remove("site-header-lock");
      this.toggleBtn?.setAttribute("aria-expanded", "false");
      this.searchToggleBtn?.setAttribute("aria-expanded", "false");
    }

    bindDropdowns() {
      this.querySelectorAll(".site-header__dropdown-toggle").forEach(
        (button) => {
          const panel = /** @type {HTMLElement | null} */ (
            this.querySelector("#" + button.getAttribute("aria-controls"))
          );
          if (!panel) return;

          button.addEventListener("click", () => {
            const isOpen = button.getAttribute("aria-expanded") === "true";
            this.closeAllPanels();

            if (!isOpen) {
              button.setAttribute("aria-expanded", "true");
              panel.hidden = false;
            }
          });
        },
      );
    }

    bindMegaMenu() {
      this.querySelectorAll(".site-header__mega-toggle").forEach((button) => {
        const panel = /** @type {HTMLElement | null} */ (
          this.querySelector("#" + button.getAttribute("aria-controls"))
        );
        if (!panel) return;

        button.addEventListener("click", () => {
          const isOpen = button.getAttribute("aria-expanded") === "true";
          this.closeAllPanels();

          if (!isOpen) {
            button.setAttribute("aria-expanded", "true");
            panel.hidden = false;
          }
        });
      });

      document.addEventListener("click", (event) => {
        const target = /** @type {Node | null} */ (event.target);
        if (!this.contains(target)) this.closeAllPanels();
      });
    }

    closeAllPanels() {
      this.querySelectorAll(
        ".site-header__dropdown-toggle, .site-header__mega-toggle",
      ).forEach((button) => {
        button.setAttribute("aria-expanded", "false");
      });

      this.querySelectorAll(
        ".site-header__dropdown, .site-header__mega-menu",
      ).forEach((panel) => {
        /** @type {HTMLElement} */ (panel).hidden = true;
      });
    }

    bindPredictiveSearch() {
      const searchInput = this.searchInput;
      if (!searchInput) return;

      /** @type {number} */
      let debounceTimer = 0;

      this.searchForm?.addEventListener("submit", (event) => {
        if (!searchInput.value.trim()) event.preventDefault();
      });

      searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (query.length < 2) {
          if (this.searchResults) this.searchResults.innerHTML = "";
          return;
        }

        debounceTimer = window.setTimeout(
          () => this.runPredictiveSearch(query),
          300,
        );
      });
    }

    /**
     * @param {string} query
     */
    runPredictiveSearch(query) {
      const shopify = /** @type {any} */ (window.Shopify);
      const url =
        shopify && shopify.routes && shopify.routes.root
          ? shopify.routes.root + "search/suggest.json"
          : "/search/suggest.json";

      fetch(
        url +
          "?q=" +
          encodeURIComponent(query) +
          "&resources[type]=product&resources[limit]=6",
        {
          headers: { Accept: "application/json" },
        },
      )
        .then((response) => response.json())
        .then((data) => this.renderResults(data))
        .catch(() => {
          if (this.searchResults) this.searchResults.innerHTML = "";
        });
    }

    /**
     * @param {any} data
     */
    renderResults(data) {
      if (!this.searchResults) return;

      const products = /** @type {any[]} */ (
        data &&
          data.resources &&
          data.resources.results &&
          data.resources.results.products
      );

      if (!products || !products.length) {
        this.searchResults.innerHTML =
          '<p class="site-header__search-empty">No results found.</p>';
        return;
      }

      const markup = products
        .map(
          /** @param {any} product */
          (product) => {
            const image = product.featured_image
              ? product.featured_image.url
              : "";
            return (
              '<a class="site-header__search-result" href="' +
              product.url +
              '">' +
              (image ? '<img src="' + image + '" alt="" loading="lazy">' : "") +
              "<span>" +
              product.title +
              "</span>" +
              "</a>"
            );
          },
        )
        .join("");

      this.searchResults.innerHTML = markup;
    }

    bindScrollHide() {
      let lastScrollY = window.scrollY || 0;
      let ticking = false;
      const threshold = 8;

      const update = () => {
        const currentY = window.scrollY || 0;
        const headerHeight = this.header ? this.header.offsetHeight : 0;

        if (
          (this.drawer && !this.drawer.hidden) ||
          (this.searchDrawer && !this.searchDrawer.hidden)
        ) {
          this.header?.classList.remove("is-hidden");
          lastScrollY = currentY;
          ticking = false;
          return;
        }

        if (currentY <= headerHeight) {
          this.header?.classList.remove("is-hidden");
          lastScrollY = currentY;
          ticking = false;
          return;
        }

        const scrollingDown = currentY > lastScrollY + threshold;
        const scrollingUp = currentY < lastScrollY - threshold;

        if (scrollingDown) {
          this.header?.classList.add("is-hidden");
          this.closeAllPanels();
        } else if (scrollingUp) {
          this.header?.classList.remove("is-hidden");
        }

        lastScrollY = currentY;
        ticking = false;
      };

      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
          }
        },
        { passive: true },
      );
    }
  }

  customElements.define("header-component", HeaderComponent);
})();
