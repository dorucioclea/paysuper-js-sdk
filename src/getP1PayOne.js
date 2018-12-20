import assert from 'simple-assert';
import { extend } from 'lodash-es';
import styles from './assets/styles/styles.scss';

/**
 * Returns DOM element by selector or actual DOM element
 *
 * @param {String|DomElement} appendContainer
 * @return {DomElement}
 */
function getDomElement(element) {
  return typeof element === 'string'
    ? document.querySelector(element)
    : element;
}

/**
 * Creates iframe container for payment form

 * @param {String|DomElement} appendContainer
 * @return {Object}
 */
function createIframe(appendContainer) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('frameborder', '0');

  const appendContainerElement = getDomElement(appendContainer);
  assert(appendContainerElement, 'Element for form rendering is not found');
  appendContainerElement.appendChild(iframe);

  const { body, head } = iframe.contentDocument;
  const styleTag = document.createElement('STYLE');
  styleTag.innerHTML = styles;
  head.appendChild(styleTag);
  const iframeMountPoint = document.createElement('DIV');
  body.appendChild(iframeMountPoint);

  return { iframe, iframeMountPoint };
}

export default function getP1PayOne(mountApp) {
  return class P1PayOne {
    constructor({
      projectID, region, email, paymentMethod, account,
    }) {
      assert(projectID, 'projectID is required for "new P1PayOne(...)"');
      this.projectID = projectID;
      this.region = region;
      this.email = email;
      this.paymentMethod = paymentMethod;
      this.account = account;

      this.currency = 'USD';
      this.amount = null;
    }

    /**
     * Renders the payment form into target element
     *
     * @param {String|DomElement} appendContainer
     * @return {P1PayOne}
     */
    async renderInElement(appendContainer) {
      assert(appendContainer, 'Mount element or selector is required for embedded form render');
      assert(this.amount, 'amount is required. Use setAmount method to set it');

      const { iframe, iframeMountPoint } = createIframe(appendContainer);

      // These sizes are initial
      // Right after App is mounted actual form size is transferred to iframe
      iframe.setAttribute('width', '560');
      iframe.setAttribute('height', '600');

      await mountApp(
        iframeMountPoint,
        {
          projectID: this.projectID,
          region: this.region,
          amount: this.amount,
          currency: this.currency,
          email: this.email,
          paymentMethod: this.paymentMethod,
          account: this.account,
        },
        {
          isInModal: false,
          iframeResizeHandler({ width, height }) {
            iframe.setAttribute('width', width);
            iframe.setAttribute('height', height);
          },
        },
      );

      return iframe;
    }

    /**
     * Renders the payment form in modal dialog layer
     *
     * @param {String|DomElement} appendContainer
     * @return {P1PayOne}
     */
    async renderModal() {
      assert(this.amount, 'amount is required. Use setAmount method to set it');

      const { iframe, iframeMountPoint } = createIframe(document.body);

      extend(iframe.style, {
        width: '100%',
        height: '100%',
        position: 'fixed',
        background: 'rgba(0, 0, 0, 0.6)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      });

      await mountApp(
        iframeMountPoint,
        {
          projectID: this.projectID,
          region: this.region,
          amount: this.amount,
          currency: this.currency,
          email: this.email,
          paymentMethod: this.paymentMethod,
          account: this.account,
        },
        {
          isInModal: true,
          destroyHandler() {
            iframe.parentNode.removeChild(iframe);
          },
        },
      );

      return iframe;
    }

    /**
     * Renders the payment form
     *
     * @param {String|DomElement} appendContainer
     * @return {P1PayOne}
     */
    setAmount(amount) {
      const amountIsValidType = (typeof amount === 'string' || typeof amount === 'number');
      assert(amountIsValidType, 'Amount value must be a string or number');
      this.amount = Number(amount);
      return this;
    }

    setCurrency(currency) {
      assert(typeof currency === 'string', 'Currency value must be a string');
      this.currency = currency;
      return this;
    }
  };
}
