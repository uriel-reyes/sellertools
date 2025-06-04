import React, { useRef, useEffect } from 'react';
import '@commercetools-demo/cms-asset';

interface Props {
  baseurl?: string;
  'business-unit-key'?: string;
  locale?: string;
  'available-locales'?: string;
}

const CsmWrapper: React.FC<Props> = (props) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const element = document.createElement('cms-app');

      Object.entries(props).forEach(([key, value]) => {
        if (typeof value === 'string') {
          element.setAttribute(key, value);
        }
      });

      ref.current.innerHTML = '';
      ref.current.appendChild(element);
    }
  }, []);

  return (
    <div
      ref={ref}
      // override styles here
      style={
        {
          '--ui-button__button-primary__background-color':
            'var(--color-primary-30)',
          '--ui-button__button-primary-hover__background-color':
            'var(--color-primary-40)',
          '--ui-button__button-critical__background-color':
            'var(--color-error-40)',
          '--ui-button__button-critical-hover__background-color':
            'var(--color-error-85)',
          '--ui-button__button-secondary__background-color':
            'var(--color-accent-85)',
          '--ui-button__button-secondary-hover__background-color':
            'var(--color-accent-90)',
          '--ui-button__button-secondary__color': 'var(--color-neutral-80)',
          '--ui-button__button__border-radius': 'var(--border-radius-4)',
          '--ui-button__button-secondary__border': 'none',
        } as React.CSSProperties
      }
    />
  );
};

export default CsmWrapper;
