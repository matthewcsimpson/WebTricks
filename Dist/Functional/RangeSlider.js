/*!
 * Webflow Utilities v1.1.0
 * Range Slider Module
 * A customizable, attribute-driven range slider that can be easily integrated into any HTML-based website.
 * (c) 2023 Jorge Cortez
 * MIT License
 * https://github.com/JorchCortez/Weblfow-Trickery
 */

/**
 * @file RangeSlider.js
 * @description A customizable dual-handle range slider for selecting value ranges.
 *
 * Key Features:
 * - Dual handles for selecting a range of values
 * - Real-time visual updates
 * - Form integration with input fields
 * - Display elements for current values
 * - Customizable thumbs with SVG/image support
 * - Mutation observer support for programmatic value changes
 * - Configurable min/max values and step size
 *
 * Required Attributes:
 * - wt-rangeslider-element="slider-wrapper": Container element
 * - wt-rangeslider-element="slider": Main slider element
 * - wt-rangeslider-element="input-left": Left range input
 * - wt-rangeslider-element="input-right": Right range input
 * - wt-rangeslider-element="thumb-left": Left thumb element
 * - wt-rangeslider-element="thumb-right": Right thumb element
 * - wt-rangeslider-element="range": Range indicator element
 *
 * Optional Attributes:
 * - wt-rangeslider-min: Minimum value (default: 0)
 * - wt-rangeslider-max: Maximum value (default: 100)
 * - wt-rangeslider-steps: Step size (default: 1)
 *
 * Optional Elements:
 * - [wt-rangeslider-range="from"]: Form input for start value
 * - [wt-rangeslider-range="to"]: Form input for end value
 * - [wt-rangeslider-display="from"]: Display element for start value
 * - [wt-rangeslider-display="to"]: Display element for end value
 *
 * @example
 * <!-- Basic Implementation -->
 * <div wt-rangeslider-element="slider-wrapper">
 *   <!-- Optional Display Elements -->
 *   <div wt-rangeslider-display="from">0</div>
 *   <div wt-rangeslider-display="to">100</div>
 *
 *   <!-- Optional Form Inputs -->
 *   <input wt-rangeslider-range="from" type="text">
 *   <input wt-rangeslider-range="to" type="text">
 *
 *   <!-- Required Slider Structure -->
 *   <div wt-rangeslider-element="slider"
 *        wt-rangeslider-min="0"
 *        wt-rangeslider-max="100"
 *        wt-rangeslider-steps="1">
 *     <div wt-rangeslider-element="range"></div>
 *     <div wt-rangeslider-element="thumb-left"></div>
 *     <div wt-rangeslider-element="thumb-right"></div>
 *     <input type="range" wt-rangeslider-element="input-left">
 *     <input type="range" wt-rangeslider-element="input-right">
 *   </div>
 * </div>
 *
 * @example
 * <!-- Custom Thumb Implementation -->
 * <div wt-rangeslider-element="slider-wrapper">
 *   <div wt-rangeslider-element="slider">
 *     <div wt-rangeslider-element="range"></div>
 *     <div wt-rangeslider-element="thumb-left">
 *       <svg width="20" height="20">
 *         <circle cx="10" cy="10" r="8" fill="white" stroke="black"/>
 *       </svg>
 *     </div>
 *     <div wt-rangeslider-element="thumb-right">
 *       <svg width="20" height="20">
 *         <circle cx="10" cy="10" r="8" fill="white" stroke="black"/>
 *       </svg>
 *     </div>
 *     <input type="range" wt-rangeslider-element="input-left">
 *     <input type="range" wt-rangeslider-element="input-right">
 *   </div>
 * </div>
 *
 * Behavior:
 * 1. Slider updates in real-time during interaction
 * 2. Form inputs update simultaneously with slider movement
 * 3. Display elements update in real-time
 * 4. Programmatic changes to form inputs trigger slider updates
 * 5. Values are constrained within min/max range
 * 6. Left value cannot exceed right value minus step size
 * 7. Right value cannot be less than left value plus step size
 */

/**
 * @class RangeSlider
 * @classdesc Creates a range slider component with two handles for selecting a range of values.
 * The component supports both visual slider interaction and direct input of values.
 *
 * @param {HTMLElement} wrapper - The container element for the range slider
 * @throws {Error} If required elements or attributes are missing
 */
class RangeSlider {
    /**
     * @constructor
     * @param {HTMLElement} wrapper - The wrapper element containing all slider components
     */
    constructor(wrapper) {
      try {
        this.wrapper = wrapper;
        this.slider = wrapper.querySelector('[wt-rangeslider-element="slider"]');
        this.__suspendExternalSync = false;
  
        if (!this.slider) {
          throw new Error("Slider element not found within wrapper");
        }
  
        // Add required styles
        this.addStyles();
  
        // Initialize configuration
        this.initConfig();
  
        // Initialize elements
        this.initElements();
  
        // Setup initial state
        this.initState();
  
        // Setup event listeners
        this.setupEventListeners();
      } catch (err) {
        console.error(`RangeSlider initialization failed: ${err.message}`);
      }
    }
  
    /**
     * Adds required styles for proper thumb alignment
     * @private
     */
    addStyles() {
      const existing = document.getElementById("wt-rangeslider-styles");
      if (existing) return;
  
      const style = document.createElement("style");
      style.id = "wt-rangeslider-styles";
      style.textContent = `
    [wt-rangeslider-element="slider"] {
      position: relative;
    }
  
    [wt-rangeslider-element="input-left"],
    [wt-rangeslider-element="input-right"] {
      pointer-events: all;
      position: absolute;
      left: 0;
      width: 100%;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      opacity: 0;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;
      height: var(--thumb-hit-area, 44px);
      z-index: 4;
      background: transparent;
    }
  
    [wt-rangeslider-element="input-left"]::-webkit-slider-runnable-track,
    [wt-rangeslider-element="input-right"]::-webkit-slider-runnable-track {
      height: 6px;
      background: transparent;
      border: 0;
    }
  
    [wt-rangeslider-element="input-left"]::-moz-range-track,
    [wt-rangeslider-element="input-right"]::-moz-range-track {
      height: 6px;
      background: transparent;
      border: 0;
    }
  
    [wt-rangeslider-element="input-left"]::-webkit-slider-thumb,
    [wt-rangeslider-element="input-right"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: var(--thumb-width, 20px);
      height: var(--thumb-width, 20px);
      pointer-events: auto;
      cursor: pointer;
      border: 0;
      background: transparent;
      margin-top: calc((6px - var(--thumb-width, 20px)) / 2);
    }
  
    [wt-rangeslider-element="input-left"]::-moz-range-thumb,
    [wt-rangeslider-element="input-right"]::-moz-range-thumb {
      width: var(--thumb-width, 20px);
      height: var(--thumb-width, 20px);
      pointer-events: auto;
      cursor: pointer;
      border: 0;
      background: transparent;
      opacity: 0;
    }
  
    [wt-rangeslider-element="thumb-left"],
    [wt-rangeslider-element="thumb-right"] {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      will-change: left;
      z-index: 3;
    }
  `;
      document.head.appendChild(style);
    }
  
    /**
     * Initialize slider configuration from attributes
     * @private
     */
    initConfig() {
      const minAttr = this.slider.getAttribute("wt-rangeslider-min");
      this.sliderMin = minAttr !== null ? this.validateNumber(minAttr) : 0;
  
      const maxAttr = this.slider.getAttribute("wt-rangeslider-max");
      this.sliderMax = maxAttr !== null ? this.validateNumber(maxAttr) : 100;
  
      const stepsAttr = this.slider.getAttribute("wt-rangeslider-steps");
      this.sliderSteps = stepsAttr !== null ? this.validateNumber(stepsAttr) : 1;
  
      const minDiffAttr = this.slider.getAttribute(
        "wt-rangeslider-mindifference",
      );
      this.minDifference =
        minDiffAttr !== null
          ? this.validateNumber(minDiffAttr)
          : this.sliderSteps;
  
      this.rightSuffix =
        this.slider.getAttribute("wt-rangeslider-rightsuffix") || null;
  
      this.defaultSuffix =
        this.slider.getAttribute("wt-rangeslider-defaultsuffix") || null;
  
      this.shouldFormatNumber =
        this.slider.getAttribute("wt-rangeslider-formatnumber") || null;
    }
  
    /**
     * Initialize DOM elements
     * @private
     */
    initElements() {
      this.rangeStart = this.wrapper.querySelector(
        '[wt-rangeslider-range="from"]',
      );
      this.rangeEnd = this.wrapper.querySelector('[wt-rangeslider-range="to"]');
  
      this.displayStart = this.wrapper.querySelector(
        '[wt-rangeslider-display="from"]',
      );
      this.displayEnd = this.wrapper.querySelector(
        '[wt-rangeslider-display="to"]',
      );
  
      this.inputLeft = this.slider.querySelector(
        '[wt-rangeslider-element="input-left"]',
      );
      this.inputRight = this.slider.querySelector(
        '[wt-rangeslider-element="input-right"]',
      );
      this.thumbLeft = this.slider.querySelector(
        '[wt-rangeslider-element="thumb-left"]',
      );
      this.thumbRight = this.slider.querySelector(
        '[wt-rangeslider-element="thumb-right"]',
      );
      this.range = this.slider.querySelector('[wt-rangeslider-element="range"]');
  
      this.validateRequiredElements();
      this.setupThumbStyles();
    }
  
    /**
     * Sets up proper thumb styling to ensure clickable areas align with visuals
     * @private
     */
    setupThumbStyles() {
      const setupThumb = (thumb, input) => {
        const thumbWidth =
          thumb.offsetWidth || parseInt(getComputedStyle(thumb).width, 10) || 20;
  
        // Copy the visible thumb width onto the hidden native range thumb
        input.style.setProperty("--thumb-width", `${thumbWidth}px`);
  
        // Stores the thumb width on the shared slider element for CSS access
        this.slider.style.setProperty("--thumb-width", `${thumbWidth}px`);
  
        // Gives the invisible native input a real vertical hit area so dragging is easier
        this.slider.style.setProperty(
          "--thumb-hit-area",
          `${Math.max(thumbWidth, 44)}px`,
        );
  
        // Visible thumb is decorative only; the actual drag target is the native range thumb
        thumb.style.position = "absolute";
        thumb.style.pointerEvents = "none";
      };
  
      setupThumb(this.thumbLeft, this.inputLeft);
      setupThumb(this.thumbRight, this.inputRight);
    }
  
    /**
     * Initialize slider state
     * @private
     */
    initState() {
      [this.inputLeft, this.inputRight].forEach((input) => {
        input.setAttribute("min", this.sliderMin);
        input.setAttribute("max", this.sliderMax);
        input.setAttribute("step", this.sliderSteps);
        input.setAttribute("formnovalidate", "");
        input.setAttribute("data-form-ignore", "");
      });
  
      if (this.rangeStart && this.rangeStart.value) {
        this.updateLeftValues(this.rangeStart.value);
      } else {
        this.updateLeftValues(this.sliderMin);
      }
  
      if (this.rangeEnd && this.rangeEnd.value) {
        this.updateRightValues(this.rangeEnd.value);
      } else {
        this.updateRightValues(this.sliderMax);
      }
  
      // Force one final unified render after both values are initialized
      this.syncVisuals();
    }
  
    /**
     * Formats a number with commas as thousand separators
     * @param {number} number - The number to format
     * @returns {string} The formatted number string
     * @private
     */
    formatNumber(number) {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  
    /**
     * Updates all visual elements and values for the left handle
     * @private
     */
    updateLeftValues(value) {
      const constrainedValue = Math.min(
        parseInt(value, 10),
        parseInt(this.inputRight.value, 10) - this.minDifference,
      );
  
      this.inputLeft.value = constrainedValue;
  
      if (this.rangeStart) {
        const valueProp = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        );
  
        this.__suspendExternalSync = true;
        valueProp.set.call(this.rangeStart, constrainedValue);
        this.__suspendExternalSync = false;
      }
  
      if (this.displayStart) {
        const displayLeft =
          this.shouldFormatNumber === "true"
            ? this.formatNumber(constrainedValue)
            : constrainedValue;
  
        this.displayStart.textContent = String(displayLeft);
      }
  
      // Re-renders both thumbs and the selected range together, instead of updating only one side
      this.syncVisuals();
    }
  
    /**
     * Updates all visual elements and values for the right handle
     * @private
     */
    updateRightValues(value) {
      const constrainedValue = Math.max(
        parseInt(value, 10),
        parseInt(this.inputLeft.value, 10) + this.minDifference,
      );
  
      this.inputRight.value = constrainedValue;
  
      if (this.rangeEnd) {
        const valueProp = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        );
  
        this.__suspendExternalSync = true;
        valueProp.set.call(this.rangeEnd, constrainedValue);
        this.__suspendExternalSync = false;
      }
  
      if (this.displayEnd) {
        const finalDisplay =
          this.shouldFormatNumber === "true"
            ? this.formatNumber(constrainedValue)
            : constrainedValue;
  
        // Suffix logic now uses constrainedValue so display matches the actual stored slider value
        if (this.rightSuffix && constrainedValue >= this.sliderMax) {
          this.displayEnd.textContent = `${finalDisplay}${this.rightSuffix}`;
        } else if (this.defaultSuffix) {
          this.displayEnd.textContent = `${finalDisplay}${this.defaultSuffix}`;
        } else {
          this.displayEnd.textContent = String(finalDisplay);
        }
      }
  
      // Re-renders both thumbs and the selected range together, instead of updating only one side
      this.syncVisuals();
    }
  
    /**
     * Sets up event listeners for the range slider
     * @private
     */
    setupEventListeners() {
      this.inputLeft.addEventListener("input", () => {
        this.updateLeftValues(this.inputLeft.value);
        if (this.rangeStart) {
          this.triggerEvent(this.rangeStart);
        }
      });
  
      this.inputRight.addEventListener("input", () => {
        this.updateRightValues(this.inputRight.value);
        if (this.rangeEnd) {
          this.triggerEvent(this.rangeEnd);
        }
      });
  
      if (this.rangeStart) {
        this.rangeStart.addEventListener("input", (evt) => {
          this.updateLeftValues(evt.target.value);
        });
  
        this.rangeStart.addEventListener("change", (evt) => {
          this.updateLeftValues(evt.target.value);
        });
  
        this.hookInputValueSync(this.rangeStart, (val) => {
          this.updateLeftValues(val);
        });
      }
  
      if (this.rangeEnd) {
        this.rangeEnd.addEventListener("input", (evt) => {
          this.updateRightValues(evt.target.value);
        });
  
        this.rangeEnd.addEventListener("change", (evt) => {
          this.updateRightValues(evt.target.value);
        });
  
        this.hookInputValueSync(this.rangeEnd, (val) => {
          this.updateRightValues(val);
        });
      }
    }
  
    /**
     * New unified renderer for both thumbs and the selected fill bar.
     * It calculates both percentages from the current values and updates the UI in one place.
     * This prevents the left and right thumbs from drifting out of sync.
     * @private
     */
    syncVisuals() {
      const min = parseInt(this.inputLeft.min, 10);
      const max = parseInt(this.inputLeft.max, 10);
  
      const leftPercent =
        ((parseInt(this.inputLeft.value, 10) - min) / (max - min)) * 100;
  
      const rightPercent =
        ((parseInt(this.inputRight.value, 10) - min) / (max - min)) * 100;
  
      // Both thumbs are now positioned using left percentages only
      this.thumbLeft.style.left = `${leftPercent}%`;
      this.thumbLeft.style.transform = "translate(-50%, -50%)";
  
      this.thumbRight.style.left = `${rightPercent}%`;
      this.thumbRight.style.transform = "translate(-50%, -50%)";
  
      // The active range bar is drawn from the left thumb to the right thumb using left + width
      this.range.style.left = `${leftPercent}%`;
      this.range.style.width = `${rightPercent - leftPercent}%`;
    }
  
    /**
     * Updates the position of a thumb element
     * @param {HTMLInputElement} input - The input element
     * @param {HTMLElement} thumb - The thumb element
     * @param {HTMLElement} range - The range element
     * @param {string} side - The side of the slider ('left' or 'right')
     * @private
     */
    updateThumbPosition(input, thumb, range, side) {
      // Kept for backward compatibility, but now delegates to syncVisuals()
      // This avoids split logic where one side used left and the other used right
      this.syncVisuals();
    }
  
    /**
     * Validates that a value is a valid number
     * @param {string} value - The value to validate
     * @returns {number} The parsed number
     * @throws {Error} If the value is not a valid number
     */
    validateNumber(value) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new Error(`Invalid number value: ${value}`);
      }
      return num;
    }
  
    /**
     * Triggers an input event on an element
     * @param {HTMLElement} element - The element to trigger the event on
     * @private
     */
    triggerEvent(element) {
      if (element) {
        element.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  
    /**
     * Hook into a text input's value property to react to programmatic assignments
     * @param {HTMLInputElement} input - The input to hook
     * @param {(val: string|number) => void} handler - Handler to run on assignment
     * @private
     */
    hookInputValueSync(input, handler) {
      if (!input) return;
  
      const valueProp = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      );
  
      const self = this;
  
      try {
        Object.defineProperty(input, "value", {
          get() {
            return valueProp.get.call(this);
          },
          set(v) {
            valueProp.set.call(this, v);
  
            // Prevents our own sync writes from triggering the sync handler again
            if (!self.__suspendExternalSync) {
              handler(v);
            }
          },
          configurable: true,
          enumerable: true,
        });
      } catch (err) {
        // Fallback: rely on 'input'/'change' listeners if defineProperty fails
      }
    }
  
    /**
     * Public API: set left range value
     * @param {number|string} value
     */
    setFrom(value) {
      this.updateLeftValues(value);
    }
  
    /**
     * Public API: set right range value
     * @param {number|string} value
     */
    setTo(value) {
      this.updateRightValues(value);
    }
  
    /**
     * Public API: set both range values atomically and in correct order
     * @param {number|string} from
     * @param {number|string} to
     */
    setRange(from, to) {
      this.updateLeftValues(from);
      this.updateRightValues(to);
    }
  
    /**
     * Public API: reset slider to configured bounds
     */
    reset() {
      this.setRange(this.sliderMin, this.sliderMax);
    }
  
    /**
     * Validates that all required elements are present
     * @private
     * @throws {Error} If any required element is missing
     */
    validateRequiredElements() {
      const requiredElements = {
        inputLeft: this.inputLeft,
        inputRight: this.inputRight,
        thumbLeft: this.thumbLeft,
        thumbRight: this.thumbRight,
        range: this.range,
      };
  
      Object.entries(requiredElements).forEach(([name, element]) => {
        if (!element) {
          throw new Error(`Required element ${name} is missing`);
        }
      });
    }
  }
  
  /**
   * Initialize all range sliders on the page
   */
  const initializeRangeSlider = () => {
    try {
      window.webtricks = window.webtricks || [];
      const wrappers = document.querySelectorAll(
        '[wt-rangeslider-element="slider-wrapper"]',
      );
  
      if (!wrappers || wrappers.length === 0) return;
  
      wrappers.forEach((wrapper) => {
        const instance = new RangeSlider(wrapper);
        window.webtricks.push({ RangeSlider: instance });
      });
    } catch (err) {
      console.error(`RangeSlider initialization error: ${err.message}`);
    }
  };
  
  if (/complete|interactive|loaded/.test(document.readyState)) {
    initializeRangeSlider();
  } else {
    window.addEventListener("DOMContentLoaded", initializeRangeSlider);
  }