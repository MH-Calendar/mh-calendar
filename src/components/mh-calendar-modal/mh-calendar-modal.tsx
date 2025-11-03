import { Component, Element, h, State } from '@stencil/core';
import newMhCalendarStore from '../../store/store/mh-calendar-store';

// Export interface for external use
export interface IModalPosition {
  x?: number;
  y?: number;
  // For element-based positioning, pass the element directly
  element?: HTMLElement;
  alignment?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  // Alternative: pass coordinates from getBoundingClientRect
  rect?: { top: number; left: number; width: number; height: number };
}

@Component({
  tag: 'mh-calendar-modal',
  styleUrl: 'mh-calendar-modal.css',
  shadow: false,
})
export class MHCalendarModal {
  @Element() el?: HTMLElement;

  @State() isOpen: boolean = false;
  @State() modalContent: any = null;
  @State() position: IModalPosition | null = null;

  private modalRef?: HTMLElement;
  private contentContainerRef?: HTMLElement;

  componentWillLoad() {
    this.setupStoreSubscriptions();
  }

  componentDidLoad() {
    this.modalRef = this.el?.querySelector(
      '.mhCalendarModal__content'
    ) as HTMLElement;
    this.updateModalContent();
  }

  componentDidUpdate() {
    this.updateModalContent();
  }

  private updateModalContent() {
    if (this.contentContainerRef && this.modalContent) {
      // Clear previous content
      this.contentContainerRef.innerHTML = '';

      // Append new content
      if (this.modalContent instanceof HTMLElement) {
        this.contentContainerRef.appendChild(this.modalContent);
      } else if (typeof this.modalContent === 'string') {
        this.contentContainerRef.innerHTML = this.modalContent;
      } else {
        // For JSX or other content types
        this.contentContainerRef.innerHTML = String(this.modalContent || '');
      }
    }
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  private setupStoreSubscriptions() {
    // Subscribe to modal changes
    newMhCalendarStore.onChange('modal', (modalState) => {
      const wasOpen = this.isOpen;
      this.isOpen = modalState?.isOpen ?? false;
      this.modalContent = modalState?.content ?? null;
      this.position = modalState?.position ?? null;

      // Clear content when modal is closed
      if (wasOpen && !this.isOpen && this.contentContainerRef) {
        this.contentContainerRef.innerHTML = '';
      }
    });

    // Setup escape key listener
    document.addEventListener('keydown', this.handleEscapeKey);
  }

  private handleBackdropClick = (event: MouseEvent) => {
    // Close modal if clicking on backdrop (not on content)
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  };

  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isOpen) {
      this.closeModal();
    }
  };

  private closeModal = () => {
    newMhCalendarStore.closeModal();
  };

  private calculatePosition(): {
    top?: string;
    left?: string;
    transform?: string;
  } {
    if (!this.position || !this.modalRef) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const { x, y, element, alignment, rect } = this.position;

    // If position is relative to an element or rect
    const elementRect =
      rect || (element ? element.getBoundingClientRect() : null);
    if (elementRect) {
      const modalRect = this.modalRef.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

      // Calculate bottom and right if using rect object
      const rectBottom =
        'bottom' in elementRect
          ? elementRect.bottom
          : elementRect.top + elementRect.height;
      const rectRight =
        'right' in elementRect
          ? elementRect.right
          : elementRect.left + elementRect.width;

      let top = elementRect.top + scrollTop;
      let left = elementRect.left + scrollLeft;

      switch (alignment) {
        case 'bottom':
          top = rectBottom + scrollTop;
          left = elementRect.left + scrollLeft + elementRect.width / 2;
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-50%, 0)',
          };
        case 'top':
          top = elementRect.top + scrollTop - modalRect.height;
          left = elementRect.left + scrollLeft + elementRect.width / 2;
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-50%, -100%)',
          };
        case 'right':
          top = elementRect.top + scrollTop + elementRect.height / 2;
          left = rectRight + scrollLeft;
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(0, -50%)',
          };
        case 'left':
          top = elementRect.top + scrollTop + elementRect.height / 2;
          left = elementRect.left + scrollLeft - modalRect.width;
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-100%, -50%)',
          };
        default: // center
          top = elementRect.top + scrollTop + elementRect.height / 2;
          left = elementRect.left + scrollLeft + elementRect.width / 2;
          return {
            top: `${top}px`,
            left: `${left}px`,
            transform: 'translate(-50%, -50%)',
          };
      }
    }

    // If position is absolute coordinates
    if (x !== undefined && y !== undefined) {
      return {
        top: `${y}px`,
        left: `${x}px`,
        transform: 'translate(-50%, -50%)',
      };
    }

    // Default: center of screen
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  render() {
    if (!this.isOpen) {
      return null;
    }

    const positionStyle = this.calculatePosition();

    return (
      <div class="mhCalendarModal" onClick={this.handleBackdropClick}>
        <div
          class="mhCalendarModal__content"
          ref={(el) => {
            this.modalRef = el;
            this.contentContainerRef = el;
          }}
          style={{
            ...positionStyle,
            ...newMhCalendarStore.getInlineStyleForClass(
              'mhCalendarModal__content'
            ),
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }
}
