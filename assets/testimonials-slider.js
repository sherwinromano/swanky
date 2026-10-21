if (!customElements.get("testimonials-slider")) {
  class TestimonialsSlider extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector("[data-track]");
      this.slides = Array.from(this.querySelectorAll("[data-slide]"));
      this.prevButtons = Array.from(
        this.querySelectorAll('[data-direction="prev"]'),
      );
      this.nextButtons = Array.from(
        this.querySelectorAll('[data-direction="next"]'),
      );
      if (!this.track || this.slides.length < 2) return;

      this.onClick = (event) => {
        const button = event.target.closest("[data-direction]");
        if (
          !button ||
          !this.contains(button) ||
          button.getAttribute("aria-disabled") === "true"
        )
          return;
        this.go(button.dataset.direction === "next" ? 1 : -1);
      };
      this.onScroll = () => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.update());
      };

      this.addEventListener("click", this.onClick);
      this.track.addEventListener("scroll", this.onScroll, { passive: true });
      window.addEventListener("resize", this.onScroll);
      document.addEventListener(
        "shopify:block:select",
        (this.onBlockSelect = (event) => {
          const index = this.slides.indexOf(event.target);
          if (index > -1) this.scrollToIndex(index, false);
        }),
      );
      this.update();
    }

    disconnectedCallback() {
      this.removeEventListener("click", this.onClick);
      this.track?.removeEventListener("scroll", this.onScroll);
      window.removeEventListener("resize", this.onScroll);
      document.removeEventListener("shopify:block:select", this.onBlockSelect);
      cancelAnimationFrame(this.frame);
    }

    get currentIndex() {
      const width = this.track.clientWidth || 1;
      return Math.round(this.track.scrollLeft / width);
    }

    go(step) {
      const target = Math.min(
        Math.max(this.currentIndex + step, 0),
        this.slides.length - 1,
      );
      this.scrollToIndex(target, true);
    }

    scrollToIndex(index, animate) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      this.track.scrollTo({
        left: this.slides[index].offsetLeft - this.track.offsetLeft,
        behavior: animate && !reduced ? "smooth" : "auto",
      });
    }

    update() {
      const index = this.currentIndex;
      this.setDisabled(this.prevButtons, index <= 0);
      this.setDisabled(this.nextButtons, index >= this.slides.length - 1);
    }

    setDisabled(buttons, disabled) {
      buttons.forEach((button) =>
        button.setAttribute("aria-disabled", String(disabled)),
      );
    }
  }

  customElements.define("testimonials-slider", TestimonialsSlider);
}
